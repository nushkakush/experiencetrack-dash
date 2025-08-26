import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';

export interface PaymentInvoiceRow {
  id: string;
  payment_transaction_id: string;
  student_id: string;
  cohort_id: string;
  invoice_file_url: string;
  invoice_file_name: string;
  invoice_file_size: number;
  invoice_file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInvoiceInsert {
  payment_transaction_id: string;
  student_id: string;
  cohort_id: string;
  invoice_file_url: string;
  invoice_file_name: string;
  invoice_file_size: number;
  invoice_file_type: string;
  uploaded_by: string;
}

class PaymentInvoiceService extends BaseService<PaymentInvoiceRow> {
  constructor() {
    super('payment_invoices');
  }

  /**
   * Upload invoice file to Supabase Storage
   */
  private async uploadInvoiceFile(
    file: File,
    studentId: string,
    transactionId: string
  ): Promise<ApiResponse<{ url: string; fileName: string }>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `invoices/${studentId}/${transactionId}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('payment-invoices')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        Logger.getInstance().error('Failed to upload invoice to storage', {
          error,
          fileName,
        });
        return { data: null, error: error.message, success: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-invoices')
        .getPublicUrl(fileName);

      return {
        data: { url: urlData.publicUrl, fileName },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error uploading invoice to storage', {
        error,
        fileName: file.name,
      });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
      };
    }
  }

  /**
   * Helper method to clean up old files from storage for a transaction
   */
  private async cleanupOldFiles(paymentTransactionId: string): Promise<void> {
    try {
      // Get all invoices for this transaction (should be 0 or 1, but let's be safe)
      const { data: oldInvoices, error } = await supabase
        .from('payment_invoices')
        .select('invoice_file_name')
        .eq('payment_transaction_id', paymentTransactionId);

      if (error) {
        Logger.getInstance().warn('Failed to fetch old invoices for cleanup', {
          error,
          paymentTransactionId,
        });
        return;
      }

      if (oldInvoices && oldInvoices.length > 0) {
        const fileNames = oldInvoices
          .map(invoice => invoice.invoice_file_name)
          .filter(Boolean);

        if (fileNames.length > 0) {
          Logger.getInstance().info('Cleaning up old files from storage', {
            fileNames,
            paymentTransactionId,
          });

          const { error: storageError } = await supabase.storage
            .from('payment-invoices')
            .remove(fileNames);

          if (storageError) {
            Logger.getInstance().warn(
              'Failed to clean up old files from storage',
              {
                error: storageError,
                fileNames,
                paymentTransactionId,
              }
            );
          } else {
            Logger.getInstance().info(
              'Successfully cleaned up old files from storage',
              { fileNames, paymentTransactionId }
            );
          }
        }
      }
    } catch (error) {
      Logger.getInstance().warn('Exception during old file cleanup', {
        error,
        paymentTransactionId,
      });
    }
  }

  /**
   * Upload invoice for a payment transaction (with replace functionality)
   */
  async uploadInvoice(
    file: File,
    paymentTransactionId: string,
    studentId: string,
    cohortId: string,
    uploadedBy: string
  ): Promise<ApiResponse<PaymentInvoiceRow>> {
    return this.executeQuery(async () => {
      // First, upload the new file to storage
      const uploadResult = await this.uploadInvoiceFile(
        file,
        studentId,
        paymentTransactionId
      );
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload invoice file');
      }

      // Prepare invoice data
      const invoiceData: PaymentInvoiceInsert = {
        payment_transaction_id: paymentTransactionId,
        student_id: studentId,
        cohort_id: cohortId,
        invoice_file_url: uploadResult.data!.url,
        invoice_file_name: uploadResult.data!.fileName,
        invoice_file_size: file.size,
        invoice_file_type: file.type,
        uploaded_by: uploadedBy,
      };

      // Try to update existing invoice first
      Logger.getInstance().info(
        'Attempting to update existing invoice for transaction',
        { paymentTransactionId }
      );

      const updateResult = await this.updateExistingInvoice(
        paymentTransactionId,
        invoiceData
      );

      if (updateResult.success && updateResult.data) {
        // Update was successful
        Logger.getInstance().info('Successfully updated existing invoice', {
          paymentTransactionId,
        });

        // Update payment transaction with lit_invoice_id
        const { error: finalUpdateError } = await supabase
          .from('payment_transactions')
          .update({ lit_invoice_id: updateResult.data.id })
          .eq('id', paymentTransactionId);

        if (finalUpdateError) {
          Logger.getInstance().warn(
            'Failed to update payment transaction with invoice ID',
            { error: finalUpdateError }
          );
        }

        return { data: updateResult.data, error: null };
      }

      // If update failed or no existing invoice, try delete + insert approach
      Logger.getInstance().info(
        'Update failed or no existing invoice, trying delete + insert approach',
        { paymentTransactionId }
      );

      // Delete any existing invoice for this transaction
      const deleteSuccess =
        await this.deleteExistingInvoice(paymentTransactionId);
      if (!deleteSuccess) {
        // Clean up the uploaded file since we can't proceed
        try {
          await supabase.storage
            .from('payment-invoices')
            .remove([uploadResult.data!.fileName]);
          Logger.getInstance().info(
            'Cleaned up uploaded file after delete failure',
            { fileName: uploadResult.data!.fileName }
          );
        } catch (cleanupError) {
          Logger.getInstance().warn(
            'Failed to clean up uploaded file after delete failure',
            { error: cleanupError }
          );
        }
        throw new Error('Failed to delete existing invoice. Please try again.');
      }

      // Also remove any lit_invoice_id references from payment_transactions
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ lit_invoice_id: null })
        .eq('id', paymentTransactionId);

      if (updateError) {
        Logger.getInstance().warn(
          'Failed to clear lit_invoice_id from payment transaction',
          { error: updateError }
        );
      }

      // Create new invoice record
      const { data, error } = await supabase
        .from('payment_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) {
        // If insert fails, try to clean up the uploaded file
        try {
          await supabase.storage
            .from('payment-invoices')
            .remove([uploadResult.data!.fileName]);
          Logger.getInstance().info(
            'Cleaned up uploaded file after insert failure',
            { fileName: uploadResult.data!.fileName }
          );
        } catch (cleanupError) {
          Logger.getInstance().warn(
            'Failed to clean up uploaded file after insert failure',
            { error: cleanupError }
          );
        }

        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error(
            'An invoice already exists for this payment. Please try again or contact support if the issue persists.'
          );
        } else if (error.code === '23503') {
          throw new Error(
            'Invalid payment transaction reference. Please refresh the page and try again.'
          );
        } else {
          throw new Error(`Failed to save invoice: ${error.message}`);
        }
      }

      // Update payment transaction with lit_invoice_id
      const { error: finalUpdateError } = await supabase
        .from('payment_transactions')
        .update({ lit_invoice_id: data.id })
        .eq('id', paymentTransactionId);

      if (finalUpdateError) {
        Logger.getInstance().warn(
          'Failed to update payment transaction with invoice ID',
          { error: finalUpdateError }
        );
      }

      return { data, error: null };
    });
  }

  /**
   * Replace existing invoice for a payment transaction
   * This method is specifically designed for replacing invoices and provides better error handling
   */
  async replaceInvoice(
    file: File,
    paymentTransactionId: string,
    studentId: string,
    cohortId: string,
    uploadedBy: string
  ): Promise<ApiResponse<PaymentInvoiceRow>> {
    return this.executeQuery(async () => {
      // First, upload the new file to storage
      const uploadResult = await this.uploadInvoiceFile(
        file,
        studentId,
        paymentTransactionId
      );
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload invoice file');
      }

      // Prepare invoice data
      const invoiceData: PaymentInvoiceInsert = {
        payment_transaction_id: paymentTransactionId,
        student_id: studentId,
        cohort_id: cohortId,
        invoice_file_url: uploadResult.data!.url,
        invoice_file_name: uploadResult.data!.fileName,
        invoice_file_size: file.size,
        invoice_file_type: file.type,
        uploaded_by: uploadedBy,
      };

      // Check if an invoice already exists
      const invoiceExists = await this.checkInvoiceExists(paymentTransactionId);

      if (invoiceExists) {
        Logger.getInstance().info('Replacing existing invoice', {
          paymentTransactionId,
        });

        // Try to update the existing invoice
        const updateResult = await this.updateExistingInvoice(
          paymentTransactionId,
          invoiceData
        );

        if (updateResult.success && updateResult.data) {
          // Update was successful
          Logger.getInstance().info('Successfully replaced existing invoice', {
            paymentTransactionId,
          });

          // Update payment transaction with lit_invoice_id
          const { error: finalUpdateError } = await supabase
            .from('payment_transactions')
            .update({ lit_invoice_id: updateResult.data.id })
            .eq('id', paymentTransactionId);

          if (finalUpdateError) {
            Logger.getInstance().warn(
              'Failed to update payment transaction with invoice ID',
              { error: finalUpdateError }
            );
          }

          return { data: updateResult.data, error: null };
        } else {
          // Update failed, try delete + insert
          Logger.getInstance().info(
            'Update failed, trying delete + insert approach',
            { paymentTransactionId }
          );

          const deleteSuccess =
            await this.deleteExistingInvoice(paymentTransactionId);
          if (!deleteSuccess) {
            // Clean up the uploaded file since we can't proceed
            try {
              await supabase.storage
                .from('payment-invoices')
                .remove([uploadResult.data!.fileName]);
              Logger.getInstance().info(
                'Cleaned up uploaded file after delete failure',
                { fileName: uploadResult.data!.fileName }
              );
            } catch (cleanupError) {
              Logger.getInstance().warn(
                'Failed to clean up uploaded file after delete failure',
                { error: cleanupError }
              );
            }
            throw new Error(
              'Failed to replace existing invoice. Please try again.'
            );
          }
        }
      } else {
        Logger.getInstance().info(
          'No existing invoice found, creating new one',
          { paymentTransactionId }
        );
      }

      // Create new invoice record
      const { data, error } = await supabase
        .from('payment_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) {
        // If insert fails, try to clean up the uploaded file
        try {
          await supabase.storage
            .from('payment-invoices')
            .remove([uploadResult.data!.fileName]);
          Logger.getInstance().info(
            'Cleaned up uploaded file after insert failure',
            { fileName: uploadResult.data!.fileName }
          );
        } catch (cleanupError) {
          Logger.getInstance().warn(
            'Failed to clean up uploaded file after insert failure',
            { error: cleanupError }
          );
        }

        // Provide more specific error messages
        if (error.code === '23505') {
          throw new Error(
            'An invoice already exists for this payment. Please try again or contact support if the issue persists.'
          );
        } else if (error.code === '23503') {
          throw new Error(
            'Invalid payment transaction reference. Please refresh the page and try again.'
          );
        } else {
          throw new Error(`Failed to save invoice: ${error.message}`);
        }
      }

      // Update payment transaction with lit_invoice_id
      const { error: finalUpdateError } = await supabase
        .from('payment_transactions')
        .update({ lit_invoice_id: data.id })
        .eq('id', paymentTransactionId);

      if (finalUpdateError) {
        Logger.getInstance().warn(
          'Failed to update payment transaction with invoice ID',
          { error: finalUpdateError }
        );
      }

      Logger.getInstance().info('Successfully created/replaced invoice', {
        paymentTransactionId,
      });
      return { data, error: null };
    });
  }

  /**
   * Get invoice by payment transaction ID
   */
  async getByTransactionId(
    paymentTransactionId: string
  ): Promise<ApiResponse<PaymentInvoiceRow | null>> {
    try {
      console.log(
        '🔍 [PaymentInvoiceService] Getting invoice for transaction:',
        paymentTransactionId
      );

      const { data, error } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('payment_transaction_id', paymentTransactionId)
        .maybeSingle();

      console.log('🔍 [PaymentInvoiceService] Query result:', { data, error });

      if (error) {
        Logger.getInstance().error('Error fetching invoice by transaction ID', {
          error,
          paymentTransactionId,
        });
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: data,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error in getByTransactionId', {
        error,
        paymentTransactionId,
      });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Get all invoices for a student
   */
  async getByStudentId(
    studentId: string
  ): Promise<ApiResponse<PaymentInvoiceRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    });
  }

  /**
   * Helper method to verify if a file exists in storage
   */
  private async checkFileExists(fileName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from('payment-invoices')
        .list('', {
          search: fileName,
        });

      if (error) {
        Logger.getInstance().warn('Failed to check file existence', {
          error,
          fileName,
        });
        return false;
      }

      return data.some(file => file.name === fileName);
    } catch (error) {
      Logger.getInstance().warn('Exception checking file existence', {
        error,
        fileName,
      });
      return false;
    }
  }

  /**
   * Helper method to check if an invoice exists for a transaction
   */
  private async checkInvoiceExists(
    paymentTransactionId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payment_invoices')
        .select('id')
        .eq('payment_transaction_id', paymentTransactionId)
        .maybeSingle();

      if (error) {
        Logger.getInstance().warn('Failed to check if invoice exists', {
          error,
          paymentTransactionId,
        });
        return false;
      }

      return !!data;
    } catch (error) {
      Logger.getInstance().warn('Exception checking if invoice exists', {
        error,
        paymentTransactionId,
      });
      return false;
    }
  }

  /**
   * Helper method to update existing invoice for a transaction
   */
  private async updateExistingInvoice(
    paymentTransactionId: string,
    invoiceData: PaymentInvoiceInsert
  ): Promise<ApiResponse<PaymentInvoiceRow>> {
    try {
      // Check if invoice exists
      const invoiceExists = await this.checkInvoiceExists(paymentTransactionId);
      if (!invoiceExists) {
        Logger.getInstance().info(
          'No existing invoice found for update, will insert new one',
          { paymentTransactionId }
        );
        return { data: null, error: null, success: false }; // Signal to insert instead
      }

      // Get the existing invoice to clean up old storage file
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('payment_invoices')
        .select('invoice_file_name')
        .eq('payment_transaction_id', paymentTransactionId)
        .single();

      if (fetchError) {
        Logger.getInstance().warn(
          'Failed to fetch existing invoice for cleanup',
          { error: fetchError, paymentTransactionId }
        );
      }

      // Update the existing invoice
      const { data, error } = await supabase
        .from('payment_invoices')
        .update({
          invoice_file_url: invoiceData.invoice_file_url,
          invoice_file_name: invoiceData.invoice_file_name,
          invoice_file_size: invoiceData.invoice_file_size,
          invoice_file_type: invoiceData.invoice_file_type,
          uploaded_by: invoiceData.uploaded_by,
          updated_at: new Date().toISOString(),
        })
        .eq('payment_transaction_id', paymentTransactionId)
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Failed to update existing invoice', {
          error,
          paymentTransactionId,
        });
        return { data: null, error: error.message, success: false };
      }

      // Clean up old file from storage if we have the filename and it's different
      if (
        existingInvoice?.invoice_file_name &&
        existingInvoice.invoice_file_name !== invoiceData.invoice_file_name
      ) {
        try {
          const { error: storageError } = await supabase.storage
            .from('payment-invoices')
            .remove([existingInvoice.invoice_file_name]);

          if (storageError) {
            Logger.getInstance().warn(
              'Failed to delete old invoice from storage',
              {
                error: storageError,
                fileName: existingInvoice.invoice_file_name,
              }
            );
          } else {
            Logger.getInstance().info(
              'Successfully deleted old invoice from storage',
              { fileName: existingInvoice.invoice_file_name }
            );
          }
        } catch (storageException) {
          Logger.getInstance().warn(
            'Exception deleting old invoice from storage',
            {
              error: storageException,
              fileName: existingInvoice.invoice_file_name,
            }
          );
        }
      }

      Logger.getInstance().info('Successfully updated existing invoice', {
        paymentTransactionId,
      });
      return { data, error: null, success: true };
    } catch (error) {
      Logger.getInstance().error('Exception in updateExistingInvoice', {
        error,
        paymentTransactionId,
      });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  /**
   * Helper method to delete existing invoice for a transaction
   */
  private async deleteExistingInvoice(
    paymentTransactionId: string
  ): Promise<boolean> {
    try {
      // First check if invoice exists
      const invoiceExists = await this.checkInvoiceExists(paymentTransactionId);
      if (!invoiceExists) {
        Logger.getInstance().info('No existing invoice found for transaction', {
          paymentTransactionId,
        });
        return true;
      }

      // Get the existing invoice to clean up storage
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('payment_invoices')
        .select('invoice_file_name')
        .eq('payment_transaction_id', paymentTransactionId)
        .single();

      if (fetchError) {
        Logger.getInstance().warn(
          'Failed to fetch existing invoice for cleanup',
          { error: fetchError, paymentTransactionId }
        );
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('payment_invoices')
        .delete()
        .eq('payment_transaction_id', paymentTransactionId);

      if (deleteError) {
        Logger.getInstance().error(
          'Failed to delete existing invoice from database',
          { error: deleteError, paymentTransactionId }
        );
        return false;
      }

      // Clean up from storage if we have the filename
      if (existingInvoice?.invoice_file_name) {
        try {
          const { error: storageError } = await supabase.storage
            .from('payment-invoices')
            .remove([existingInvoice.invoice_file_name]);

          if (storageError) {
            Logger.getInstance().warn(
              'Failed to delete existing invoice from storage',
              {
                error: storageError,
                fileName: existingInvoice.invoice_file_name,
              }
            );
          } else {
            Logger.getInstance().info(
              'Successfully deleted existing invoice from storage',
              { fileName: existingInvoice.invoice_file_name }
            );
          }
        } catch (storageException) {
          Logger.getInstance().warn(
            'Exception deleting existing invoice from storage',
            {
              error: storageException,
              fileName: existingInvoice.invoice_file_name,
            }
          );
        }
      }

      Logger.getInstance().info('Successfully deleted existing invoice', {
        paymentTransactionId,
      });
      return true;
    } catch (error) {
      Logger.getInstance().error('Exception in deleteExistingInvoice', {
        error,
        paymentTransactionId,
      });
      return false;
    }
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: string): Promise<ApiResponse<void>> {
    return this.executeQuery(async () => {
      // Get invoice details first
      const { data: invoice, error: fetchError } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        Logger.getInstance().error('Failed to fetch invoice for deletion', {
          error: fetchError,
          invoiceId,
        });
        throw fetchError;
      }

      // Delete from storage using the actual filename
      const fileName = invoice.invoice_file_name;
      if (fileName) {
        console.log(
          '🔍 [PaymentInvoiceService] Deleting file from storage:',
          fileName
        );

        // Check if file exists before deletion
        const fileExists = await this.checkFileExists(fileName);
        if (fileExists) {
          Logger.getInstance().info(
            'File exists in storage, proceeding with deletion',
            { fileName }
          );
        } else {
          Logger.getInstance().warn(
            'File not found in storage, skipping storage deletion',
            { fileName }
          );
        }

        try {
          const { data: storageData, error: storageError } =
            await supabase.storage.from('payment-invoices').remove([fileName]);

          if (storageError) {
            Logger.getInstance().error(
              'Failed to delete invoice from storage',
              {
                error: storageError,
                fileName,
                invoiceId,
              }
            );
            // Don't throw here, continue with database deletion
          } else {
            Logger.getInstance().info(
              'File deleted from storage successfully',
              {
                fileName,
                storageData,
                invoiceId,
              }
            );

            // Verify deletion
            const stillExists = await this.checkFileExists(fileName);
            if (stillExists) {
              Logger.getInstance().warn(
                'File still exists in storage after deletion attempt',
                { fileName }
              );
            } else {
              Logger.getInstance().info(
                'File successfully removed from storage',
                { fileName }
              );
            }
          }
        } catch (storageException) {
          Logger.getInstance().error('Exception during storage deletion', {
            error: storageException,
            fileName,
            invoiceId,
          });
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('payment_invoices')
        .delete()
        .eq('id', invoiceId);

      if (deleteError) {
        Logger.getInstance().error('Failed to delete invoice from database', {
          error: deleteError,
          invoiceId,
        });
        throw deleteError;
      }

      // Remove lit_invoice_id from payment transaction
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ lit_invoice_id: null })
        .eq('lit_invoice_id', invoiceId);

      if (updateError) {
        Logger.getInstance().warn(
          'Failed to remove invoice reference from payment transaction',
          { error: updateError }
        );
      }

      Logger.getInstance().info('Invoice deleted successfully', {
        invoiceId,
        fileName,
      });
      return { data: null, error: null };
    });
  }

  /**
   * Download invoice file
   */
  async downloadInvoice(invoiceId: string): Promise<ApiResponse<Blob>> {
    return this.executeQuery(async () => {
      // Get invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        Logger.getInstance().error('Failed to fetch invoice for download', {
          error: fetchError,
          invoiceId,
        });
        throw fetchError;
      }

      // Use the public URL from the database instead of trying to download
      const publicUrl = invoice.invoice_file_url;
      if (!publicUrl) {
        throw new Error('Invalid file URL');
      }

      console.log(
        '🔍 [PaymentInvoiceService] Downloading from URL:',
        publicUrl
      );

      try {
        // First attempt: Try to fetch from the public URL
        const response = await fetch(publicUrl);

        if (!response.ok) {
          console.error(
            '🔍 [PaymentInvoiceService] Fetch error:',
            response.status,
            response.statusText
          );

          // Second attempt: Try to get a fresh URL from Supabase storage
          try {
            console.log(
              '🔍 [PaymentInvoiceService] Trying to get fresh URL from storage'
            );
            const { data: urlData } = supabase.storage
              .from('payment-invoices')
              .getPublicUrl(invoice.invoice_file_name);

            if (urlData.publicUrl !== publicUrl) {
              console.log(
                '🔍 [PaymentInvoiceService] Trying fresh URL:',
                urlData.publicUrl
              );
              const freshResponse = await fetch(urlData.publicUrl);

              if (freshResponse.ok) {
                const blob = await freshResponse.blob();

                if (blob.size === 0) {
                  throw new Error('Downloaded file is empty');
                }

                Logger.getInstance().info(
                  'Invoice downloaded successfully with fresh URL',
                  {
                    invoiceId,
                    fileSize: blob.size,
                    contentType: blob.type,
                  }
                );

                return { data: blob, error: null };
              }
            }
          } catch (freshUrlError) {
            console.error(
              '🔍 [PaymentInvoiceService] Fresh URL attempt failed:',
              freshUrlError
            );
          }

          throw new Error(
            `Failed to fetch file: ${response.status} ${response.statusText}`
          );
        }

        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        Logger.getInstance().info('Invoice downloaded successfully', {
          invoiceId,
          fileSize: blob.size,
          contentType: blob.type,
        });

        return { data: blob, error: null };
      } catch (fetchError) {
        Logger.getInstance().error('Failed to download invoice file', {
          error: fetchError,
          invoiceId,
          url: publicUrl,
        });
        throw fetchError;
      }
    });
  }
}

export const paymentInvoiceService = new PaymentInvoiceService();
