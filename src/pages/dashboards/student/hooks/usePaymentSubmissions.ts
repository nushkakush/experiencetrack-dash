import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { Logger } from '@/lib/logging/Logger';
import { razorpayService } from '@/services/razorpay.service';
import { PaymentSubmissionData } from '@/components/fee-collection/PaymentMethodSelector';
import { supabase } from '@/integrations/supabase/client';

// Helper function to upload receipt to Supabase Storage
const uploadReceiptToStorage = async (file: File, paymentId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `receipts/${paymentId}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      Logger.getInstance().error('Failed to upload receipt to storage', { error, fileName });
      return { success: false, error: error.message, url: '' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(fileName);

    return { success: true, error: null, url: urlData.publicUrl };
  } catch (error) {
    Logger.getInstance().error('Error uploading receipt to storage', { error, fileName: file.name });
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed', url: '' };
  }
};

interface PaymentSubmission {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  receiptFile?: File;
  receiptUrl?: string;
  notes?: string;
  submittedAt: Date;
}

export const usePaymentSubmissions = () => {
  const [paymentSubmissions, setPaymentSubmissions] = useState<Map<string, PaymentSubmission>>(new Map());
  const [submittingPayments, setSubmittingPayments] = useState<Set<string>>(new Set());

  const handlePaymentSubmission = useCallback(async (paymentData: PaymentSubmissionData) => {
    const { paymentId, paymentMethod, amountPaid } = paymentData;
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (amountPaid <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!paymentData.receiptFile && !paymentData.proofOfPaymentFile && !paymentData.transactionScreenshotFile) {
      toast.error('Please upload a receipt or payment proof');
      return;
    }

    try {
      setSubmittingPayments(new Set([...submittingPayments, paymentId]));
      
      let result;
      
      if (paymentMethod === 'razorpay') {
        result = await handleRazorpayPayment(paymentData);
      } else {
        result = await handleRegularPayment(paymentData);
      }

      if (result.success) {
        toast.success('Payment submitted successfully!');
        
        // Remove from submissions after successful submission
        const newSubmissions = new Map(paymentSubmissions);
        newSubmissions.delete(paymentId);
        setPaymentSubmissions(newSubmissions);
      } else {
        toast.error(result.error || 'Failed to submit payment');
      }
    } catch (error) {
      Logger.getInstance().error('Error submitting payment', { error, paymentData });
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setSubmittingPayments(new Set([...submittingPayments].filter(id => id !== paymentId)));
    }
  }, [paymentSubmissions, submittingPayments]);

  const handleRegularPayment = async (paymentData: PaymentSubmissionData) => {
    try {
      Logger.getInstance().info('Starting regular payment submission', { 
        paymentId: paymentData.paymentId, 
        amount: paymentData.amountPaid,
        method: paymentData.paymentMethod 
      });

      // 1. Upload receipt file to Supabase Storage if provided
      let receiptUrl = '';
      if (paymentData.receiptFile || paymentData.proofOfPaymentFile || paymentData.transactionScreenshotFile) {
        const fileToUpload = paymentData.receiptFile || paymentData.proofOfPaymentFile || paymentData.transactionScreenshotFile;
        if (fileToUpload) {
          const uploadResult = await uploadReceiptToStorage(fileToUpload, paymentData.paymentId);
          if (uploadResult.success) {
            receiptUrl = uploadResult.url;
          } else {
            Logger.getInstance().warn('Failed to upload receipt, continuing with payment submission', { 
              error: uploadResult.error 
            });
          }
        }
      }

      // 2. Create payment record in student_payments table
      const paymentRecord = {
        student_id: paymentData.studentId,
        cohort_id: paymentData.cohortId,
        payment_type: 'fee_payment',
        payment_method: paymentData.paymentMethod,
        amount_paid: paymentData.amountPaid,
        receipt_url: receiptUrl,
        notes: paymentData.notes || '',
        status: 'pending_verification',
        submitted_at: new Date().toISOString(),
        reference_number: paymentData.transactionId || paymentData.receiptNumber || '',
        bank_name: paymentData.bankName || '',
        payment_date: paymentData.paymentDate || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('student_payments')
        .insert([paymentRecord])
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Failed to create payment record', { error, paymentData });
        throw new Error(`Failed to create payment record: ${error.message}`);
      }

      // 3. Create payment transaction record
      const transactionRecord = {
        payment_id: data.id,
        amount: paymentData.amountPaid,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.transactionId || paymentData.receiptNumber || '',
        status: 'pending',
        notes: paymentData.notes || '',
        receipt_url: receiptUrl,
        submitted_by: paymentData.userId,
        submitted_at: new Date().toISOString()
      };

      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([transactionRecord]);

      if (transactionError) {
        Logger.getInstance().error('Failed to create transaction record', { error: transactionError, paymentData });
        // Don't throw here as the payment record was created successfully
      }

      Logger.getInstance().info('Payment submission completed successfully', { 
        paymentId: data.id, 
        amount: paymentData.amountPaid 
      });

      return { success: true, error: null, paymentId: data.id };
    } catch (error) {
      Logger.getInstance().error('Payment submission failed', { error, paymentData });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment submission failed' 
      };
    }
  };

  const handleRazorpayPayment = async (paymentData: PaymentSubmissionData) => {
    try {
      // Create Razorpay order
      const orderResult = await razorpayService.createOrder({
        amount: paymentData.amountPaid * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt: `payment_${paymentData.paymentId}`,
        notes: {
          paymentId: paymentData.paymentId,
          studentId: paymentData.studentId || '',
        },
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create payment order');
      }

      // Initialize Razorpay payment
      const options = {
        key: process.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentData.amountPaid * 100,
        currency: 'INR',
        name: 'ExperienceTrack',
        description: 'Fee Payment',
        order_id: orderResult.data.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Handle successful payment
          const verificationResult = await razorpayService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verificationResult.success) {
            // Update payment status in database
            await paymentTransactionService.submitPayment(paymentData, paymentData.userId || '');
          }
        },
        prefill: {
          email: paymentData.email || '',
          contact: paymentData.phone || '',
        },
        theme: {
          color: '#3B82F6',
        },
      };

      // @ts-ignore - Razorpay types
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return { success: true, error: null };
    } catch (error) {
      Logger.getInstance().error('Razorpay payment error', { error, paymentData });
      return { success: false, error: error instanceof Error ? error.message : 'Payment failed' };
    }
  };

  return {
    paymentSubmissions,
    submittingPayments,
    handlePaymentSubmission,
  };
};
