import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';
import { ApiResponse } from '@/types/common';
import { PaymentSubmissionData } from '@/types/payments';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';

export interface IndianBank {
  id: string;
  bank_name: string;
  bank_code?: string;
  ifsc_code_prefix?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethodConfiguration {
  id: string;
  cohort_id: string;
  cash_enabled: boolean;
  bank_transfer_enabled: boolean;
  cheque_enabled: boolean;
  scan_to_pay_enabled: boolean;
  razorpay_enabled: boolean;
  bank_account_number?: string;
  bank_account_holder?: string;
  ifsc_code?: string;
  bank_name?: string;
  bank_branch?: string;
  qr_code_url?: string;
  upi_id?: string;
  receiver_bank_name?: string;
  receiver_bank_logo_url?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

class PaymentTransactionService extends BaseService<PaymentTransactionRow> {
  constructor() {
    super('payment_transactions');
  }

  // Get payment transactions by payment ID
  async getByPaymentId(
    paymentId: string
  ): Promise<ApiResponse<PaymentTransactionRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Submit a new payment transaction
  async submitPayment(
    paymentData: PaymentSubmissionData,
    userId: string
  ): Promise<ApiResponse<PaymentTransactionRow>> {
    return this.executeQuery(async () => {
      // First, upload files if they exist
      let receiptUrl = null;
      let proofOfPaymentUrl = null;
      let transactionScreenshotUrl = null;

      if (paymentData.receiptFile) {
        receiptUrl = await this.uploadFile(paymentData.receiptFile, 'receipts');
      }

      if (paymentData.proofOfPaymentFile) {
        proofOfPaymentUrl = await this.uploadFile(
          paymentData.proofOfPaymentFile,
          'proof-of-payment'
        );
      }

      if (paymentData.transactionScreenshotFile) {
        transactionScreenshotUrl = await this.uploadFile(
          paymentData.transactionScreenshotFile,
          'screenshots'
        );
      }

      // Create payment transaction record
      const transactionRecord = {
        payment_id: paymentData.paymentId,
        transaction_type: 'payment',
        amount: paymentData.amountPaid,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.paymentReferenceNumber,
        status: 'pending',
        notes: paymentData.notes,
        created_by: userId,
        verification_status: 'verification_pending',
        receipt_url: receiptUrl,
        proof_of_payment_url: proofOfPaymentUrl,
        transaction_screenshot_url: transactionScreenshotUrl,
        bank_name: paymentData.bankName,
        bank_branch: paymentData.bankBranch,
        transfer_date: paymentData.transferDate,
        payment_date: paymentData.transferDate,
        razorpay_payment_id: paymentData.razorpayPaymentId,
        razorpay_order_id: paymentData.razorpayOrderId,
        razorpay_signature: paymentData.razorpaySignature,
      };

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert(transactionRecord)
        .select()
        .single();

      if (error) throw error;

      // Update the student_payments table with the new payment amount
      await this.updateStudentPaymentAmount(
        paymentData.paymentId,
        paymentData.amountPaid
      );

      return { data, error: null };
    });
  }

  // Update student payment amount and status
  private async updateStudentPaymentAmount(
    paymentId: string,
    amountPaid: number
  ): Promise<void> {
    const { error } = await supabase
      .from('student_payments')
      .update({
        total_amount_paid: supabase.rpc('increment_amount_paid', {
          payment_id: paymentId,
          amount: amountPaid,
        }),
        last_payment_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', paymentId);

    if (error) throw error;
  }

  // Upload file to Supabase Storage
  private async uploadFile(file: File, folder: string): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('payment-documents')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('payment-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Get Indian banks
  async getIndianBanks(): Promise<ApiResponse<IndianBank[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('indian_banks')
        .select('*')
        .eq('is_active', true)
        .order('bank_name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Get payment method configuration for a cohort
  async getPaymentMethodConfiguration(
    cohortId: string
  ): Promise<ApiResponse<PaymentMethodConfiguration>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('payment_method_configurations')
        .select('*')
        .eq('cohort_id', cohortId)
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Get available payment methods for a cohort
  async getAvailablePaymentMethods(
    cohortId: string
  ): Promise<ApiResponse<string[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('payment_method_configurations')
        .select(
          'cash_enabled, bank_transfer_enabled, cheque_enabled, scan_to_pay_enabled, razorpay_enabled'
        )
        .eq('cohort_id', cohortId)
        .single();

      if (error) throw error;

      const methods: string[] = [];
      if (data.cash_enabled) methods.push('cash');
      if (data.bank_transfer_enabled) methods.push('bank_transfer');
      if (data.cheque_enabled) methods.push('cheque');
      if (data.scan_to_pay_enabled) methods.push('scan_to_pay');
      if (data.razorpay_enabled) methods.push('razorpay');

      return { data: methods, error: null };
    });
  }

  // Verify payment transaction
  async verifyPayment(
    transactionId: string,
    verifiedBy: string,
    status: 'approved' | 'rejected',
    notes?: string,
    rejectionReason?: string
  ): Promise<ApiResponse<PaymentTransactionRow>> {
    return this.executeQuery(async () => {
      // First, get the transaction details to understand the payment context
      const { data: transaction, error: fetchError } = await supabase
        .from('payment_transactions')
        .select(
          `
          *,
          student_payments!inner (
            id,
            student_id
          )
        `
        )
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;
      if (!transaction) throw new Error('Transaction not found');

      // Update the transaction verification status
      const updateData: {
        verification_status: 'approved' | 'rejected';
        verification_notes?: string;
        verified_by: string;
        verified_at: string;
        updated_at: string;
        status?: 'success' | 'failed';
        rejection_reason?: string;
      } = {
        verification_status: status,
        verification_notes: notes,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update the transaction status based on verification result
      if (status === 'approved') {
        updateData.status = 'success';
      } else if (status === 'rejected') {
        updateData.status = 'failed';
        if (rejectionReason) {
          updateData.rejection_reason = rejectionReason;
        }
      }

      const { data, error } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Note: Since we simplified the student_payments table and removed payment_status,
      // the payment status is now calculated dynamically in the frontend based on
      // the verification_status of payment_transactions. The verification process
      // only needs to update the transaction verification_status, and the UI will
      // automatically reflect the correct status based on the approved transactions.

      return { data, error: null };
    });
  }

  // Get payment statistics for a student
  async getPaymentStatistics(
    studentId: string
  ): Promise<
    ApiResponse<{
      totalPayments: number;
      totalAmountPaid: number;
      totalAmountRequired: number;
      completionPercentage: number;
      pendingPayments: number;
      verifiedPayments: number;
    }>
  > {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('student_payments')
        .select(
          `
          *,
          payment_transactions (
            amount,
            payment_method,
            verification_status,
            created_at
          )
        `
        )
        .eq('student_id', studentId);

      if (error) throw error;

      // Calculate statistics
      const stats: {
        totalPayments: number;
        totalAmountPaid: number;
        totalAmountRequired: number;
        completionPercentage: number;
        pendingPayments: number;
        verifiedPayments: number;
      } = {
        totalPayments: data.length,
        totalAmountPaid: data.reduce(
          (sum, payment) => sum + (payment.total_amount_paid || 0),
          0
        ),
        totalAmountRequired: data.reduce(
          (sum, payment) => sum + payment.total_amount_payable,
          0
        ),
        completionPercentage:
          data.reduce((sum, payment) => {
            const percentage =
              (payment.total_amount_paid / payment.total_amount_payable) * 100;
            return sum + percentage;
          }, 0) / data.length,
        pendingPayments: data.filter(
          payment => payment.payment_status === 'pending'
        ).length,
        verifiedPayments: data.filter(
          payment => payment.payment_status === 'paid'
        ).length,
      };

      return { data: stats, error: null };
    });
  }

  // Get payment history for a student
  async getPaymentHistory(
    studentId: string
  ): Promise<ApiResponse<PaymentTransactionRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(
          `
          *,
          student_payments!inner (
            student_id
          )
        `
        )
        .eq('student_payments.student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Get count of pending verification transactions for a cohort
  async getPendingVerificationCount(
    cohortId: string
  ): Promise<ApiResponse<number>> {
    return this.executeQuery(async () => {
      // First, get all payment IDs for the cohort
      const { data: paymentIds, error: paymentError } = await supabase
        .from('student_payments')
        .select('id')
        .eq('cohort_id', cohortId);

      if (paymentError) throw paymentError;

      if (!paymentIds || paymentIds.length === 0) {
        return { data: 0, error: null };
      }

      const paymentIdArray = paymentIds.map(p => p.id);

      // Then count pending verification transactions for these payment IDs
      const { count, error } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verification_pending')
        .in('payment_id', paymentIdArray);

      if (error) throw error;

      return { data: count || 0, error: null };
    });
  }

  // Get count of pending verification transactions for a specific student payment
  async getPendingVerificationCountByPaymentId(
    paymentId: string
  ): Promise<ApiResponse<number>> {
    return this.executeQuery(async () => {
      const { count, error } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('payment_id', paymentId)
        .eq('verification_status', 'verification_pending');

      if (error) throw error;

      return { data: count || 0, error: null };
    });
  }
}

export const paymentTransactionService = new PaymentTransactionService();
