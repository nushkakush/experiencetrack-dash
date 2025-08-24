import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

interface UploadResult {
  success: boolean;
  error: string | null;
  url: string;
}

// Helper function to upload receipt to Supabase Storage
export const uploadReceiptToStorage = async (
  file: File,
  paymentId: string
): Promise<UploadResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `receipts/${paymentId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      Logger.getInstance().error('Failed to upload receipt to storage', {
        error,
        fileName,
      });
      return { success: false, error: error.message, url: '' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(fileName);

    return { success: true, error: null, url: urlData.publicUrl };
  } catch (error) {
    Logger.getInstance().error('Error uploading receipt to storage', {
      error,
      fileName: file.name,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      url: '',
    };
  }
};

// Helper function to upload multiple receipt files
export const uploadMultipleReceipts = async (
  files: {
    receiptFile?: File;
    proofOfPaymentFile?: File;
    transactionScreenshotFile?: File;
  },
  paymentId: string
) => {
  const results = {
    receiptUrl: '',
    proofOfPaymentUrl: '',
    transactionScreenshotUrl: '',
  };

  if (files.receiptFile) {
    const uploadResult = await uploadReceiptToStorage(files.receiptFile, paymentId);
    if (uploadResult.success) {
      results.receiptUrl = uploadResult.url;
    } else {
      Logger.getInstance().warn(
        'Failed to upload receipt, continuing with payment submission',
        {
          error: uploadResult.error,
        }
      );
    }
  }

  if (files.proofOfPaymentFile) {
    const uploadResult = await uploadReceiptToStorage(files.proofOfPaymentFile, paymentId);
    if (uploadResult.success) {
      results.proofOfPaymentUrl = uploadResult.url;
    }
  }

  if (files.transactionScreenshotFile) {
    const uploadResult = await uploadReceiptToStorage(files.transactionScreenshotFile, paymentId);
    if (uploadResult.success) {
      results.transactionScreenshotUrl = uploadResult.url;
    }
  }

  return results;
};
