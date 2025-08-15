import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { Logger } from '@/lib/logging/Logger';
import { razorpayService } from '@/services/razorpay.service';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { CohortStudent } from '@/types/cohort';

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Helper function to upload receipt to Supabase Storage
const uploadReceiptToStorage = async (file: File, paymentId: string) => {
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

interface PaymentSubmission {
  paymentId: string;
  amount: number;
  paymentMethod: string;
  receiptFile?: File;
  receiptUrl?: string;
  notes?: string;
  submittedAt: Date;
}

export const usePaymentSubmissions = (
  studentData?: CohortStudent,
  onPaymentSuccess?: () => Promise<void>
) => {
  const [paymentSubmissions, setPaymentSubmissions] = useState<
    Map<string, PaymentSubmission>
  >(new Map());
  const [submittingPayments, setSubmittingPayments] = useState<Set<string>>(
    new Set()
  );

  const handlePaymentSubmission = useCallback(
    async (paymentData: PaymentSubmissionData) => {
      console.log(
        '🔍 [DEBUG] usePaymentSubmissions - handlePaymentSubmission called'
      );
      console.log(
        '🔍 [DEBUG] usePaymentSubmissions - paymentData:',
        paymentData
      );

      const { paymentId, paymentMethod, amount } = paymentData;

      console.log(
        '🔍 [DEBUG] usePaymentSubmissions - paymentMethod:',
        paymentMethod
      );
      console.log(
        '🔍 [DEBUG] usePaymentSubmissions - paymentMethod type:',
        typeof paymentMethod
      );
      console.log(
        '🔍 [DEBUG] usePaymentSubmissions - paymentMethod truthy:',
        !!paymentMethod
      );

      if (!paymentMethod) {
        console.log(
          '❌ [DEBUG] usePaymentSubmissions - Payment method validation failed, showing toast'
        );
        toast.error('Please select a payment method');
        return;
      }

      if (amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (
        !paymentData.receiptFile &&
        !paymentData.proofOfPaymentFile &&
        !paymentData.transactionScreenshotFile
      ) {
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

          // Call the success callback to refresh data
          if (onPaymentSuccess) {
            console.log(
              '🔄 [DEBUG] Calling onPaymentSuccess callback to refresh UI data'
            );
            await onPaymentSuccess();
          } else {
            console.log(
              '⚠️ [DEBUG] No onPaymentSuccess callback provided - UI may not refresh'
            );
          }
        } else {
          toast.error(result.error || 'Failed to submit payment');
        }
      } catch (error) {
        Logger.getInstance().error('Error submitting payment', {
          error,
          paymentData,
        });
        toast.error('Failed to submit payment. Please try again.');
      } finally {
        setSubmittingPayments(
          new Set([...submittingPayments].filter(id => id !== paymentId))
        );
      }
    },
    [paymentSubmissions, submittingPayments, onPaymentSuccess, studentData]
  );

  const handleRegularPayment = async (paymentData: PaymentSubmissionData) => {
    try {
      Logger.getInstance().info('Starting regular payment submission', {
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
      });

      // 1. Upload receipt file to Supabase Storage if provided
      let receiptUrl = '';
      let proofOfPaymentUrl = '';
      let transactionScreenshotUrl = '';

      if (paymentData.receiptFile) {
        const uploadResult = await uploadReceiptToStorage(
          paymentData.receiptFile,
          paymentData.paymentId
        );
        if (uploadResult.success) {
          receiptUrl = uploadResult.url;
        } else {
          Logger.getInstance().warn(
            'Failed to upload receipt, continuing with payment submission',
            {
              error: uploadResult.error,
            }
          );
        }
      }

      if (paymentData.proofOfPaymentFile) {
        const uploadResult = await uploadReceiptToStorage(
          paymentData.proofOfPaymentFile,
          paymentData.paymentId
        );
        if (uploadResult.success) {
          proofOfPaymentUrl = uploadResult.url;
        }
      }

      if (paymentData.transactionScreenshotFile) {
        const uploadResult = await uploadReceiptToStorage(
          paymentData.transactionScreenshotFile,
          paymentData.paymentId
        );
        if (uploadResult.success) {
          transactionScreenshotUrl = uploadResult.url;
        }
      }

      // 2. First, get or create a student_payments record
      let studentPaymentId: string;

      // Check if student_payments record exists
      const { data: existingStudentPayment, error: studentPaymentError } =
        await supabase
          .from('student_payments')
          .select('id')
          .eq('student_id', studentData?.id)
          .eq('cohort_id', studentData?.cohort_id)
          .single();

      if (studentPaymentError && studentPaymentError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no record exists
        Logger.getInstance().error('Error checking student payment record', {
          error: studentPaymentError,
        });
        throw new Error(
          `Error checking student payment record: ${studentPaymentError.message}`
        );
      }

      if (existingStudentPayment) {
        // Use existing student payment record
        studentPaymentId = existingStudentPayment.id;
        Logger.getInstance().info('Using existing student payment record', {
          studentPaymentId,
        });
      } else {
        // Create new student payment record
        const { data: newStudentPayment, error: createError } = await supabase
          .from('student_payments')
          .insert({
            student_id: studentData?.id,
            cohort_id: studentData?.cohort_id,
            payment_plan: 'one_shot', // Default plan, can be updated later
            total_amount_payable: paymentData.amount,
            total_amount_paid: 0,
            total_amount_pending: paymentData.amount,
            payment_status: 'pending',
            notes: 'Created during payment submission',
          })
          .select('id')
          .single();

        if (createError) {
          Logger.getInstance().error(
            'Failed to create student payment record',
            { error: createError }
          );
          throw new Error(
            `Failed to create student payment record: ${createError.message}`
          );
        }

        studentPaymentId = newStudentPayment.id;
        Logger.getInstance().info('Created new student payment record', {
          studentPaymentId,
        });
      }

      // 3. Create a single payment transaction record with all the enhanced fields
      const transactionRecord = {
        payment_id: studentPaymentId, // Use the UUID from student_payments
        transaction_type: 'payment',
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber || '',
        status: 'pending',
        notes: paymentData.notes || '',
        created_by: studentData?.user_id,
        verification_status: 'verification_pending',
        receipt_url: receiptUrl,
        proof_of_payment_url: proofOfPaymentUrl,
        transaction_screenshot_url: transactionScreenshotUrl,
        bank_name: paymentData.bankName || '',
        bank_branch: paymentData.bankBranch || '',
        utr_number: paymentData.referenceNumber || '',
        payer_upi_id: paymentData.upiId || '',
        razorpay_payment_id: paymentData.razorpayPaymentId || '',
        razorpay_order_id: paymentData.razorpayOrderId || '',
        payment_date:
          paymentData.transferDate || new Date().toISOString().split('T')[0],
        transfer_date:
          paymentData.transferDate || new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase
        .from('payment_transactions')
        .insert([transactionRecord])
        .select()
        .single();

      if (error) {
        Logger.getInstance().error(
          'Failed to create payment transaction record',
          { error, paymentData }
        );
        throw new Error(
          `Failed to create payment transaction record: ${error.message}`
        );
      }

      // 4. Update the student_payments record (only update timestamp since we removed calculated fields)
      const { error: updateError } = await supabase
        .from('student_payments')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentPaymentId);

      if (updateError) {
        Logger.getInstance().error(
          'Failed to update student payment record timestamp',
          { error: updateError }
        );
        // Don't throw error here, as the transaction was already created
        // Just log the error for debugging
      } else {
        Logger.getInstance().info(
          'Updated student payment record timestamp after payment submission',
          {
            studentPaymentId,
            amount: paymentData.amount,
          }
        );
      }

      Logger.getInstance().info('Payment submission completed successfully', {
        paymentId: data.id,
        amount: paymentData.amount,
      });

      return { success: true, error: null, paymentId: data.id };
    } catch (error) {
      Logger.getInstance().error('Payment submission failed', {
        error,
        paymentData,
      });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Payment submission failed',
      };
    }
  };

  const handleRazorpayPayment = async (paymentData: PaymentSubmissionData) => {
    try {
      // Create Razorpay order
      const orderResult = await razorpayService.createOrder({
        amount: paymentData.amount * 100, // Razorpay expects amount in paise
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
        amount: paymentData.amount * 100,
        currency: 'INR',
        name: 'ExperienceTrack',
        description: 'Fee Payment',
        order_id: orderResult.data.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Handle successful payment
          const verificationResult = await razorpayService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verificationResult.success) {
            // Update payment status in database
            await paymentTransactionService.submitPayment(
              paymentData,
              paymentData.userId || ''
            );
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

      // @ts-expect-error - Razorpay types
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return { success: true, error: null };
    } catch (error) {
      Logger.getInstance().error('Razorpay payment error', {
        error,
        paymentData,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  };

  return {
    paymentSubmissions,
    submittingPayments,
    handlePaymentSubmission,
  };
};
