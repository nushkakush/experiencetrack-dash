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

      // Only require file uploads for non-online payment methods
      // Skip file requirement for admin-recorded online payments (when Payment ID is provided)
      if (paymentMethod !== 'razorpay' && !paymentData.isAdminRecorded) {
        if (
          !paymentData.receiptFile &&
          !paymentData.proofOfPaymentFile &&
          !paymentData.transactionScreenshotFile
        ) {
          toast.error('Please upload a receipt or payment proof');
          return;
        }
      }

      try {
        setSubmittingPayments(new Set([...submittingPayments, paymentId]));

        let result;

        // Admin-recorded payments (including Razorpay) go straight to "Paid" status
        // Only student-initiated Razorpay payments use the online gateway
        if (paymentMethod === 'razorpay' && !paymentData.isAdminRecorded) {
          console.log(
            '🔍 [DEBUG] Student Razorpay payment - using online gateway'
          );
          result = await handleRazorpayPayment(paymentData);
        } else {
          console.log(
            '🔍 [DEBUG] Regular payment flow - direct to paid status',
            {
              paymentMethod,
              isAdminRecorded: paymentData.isAdminRecorded,
            }
          );
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
      // Use student data from paymentData if available (admin context), otherwise use studentData (student context)
      const effectiveStudentId = paymentData.studentId || studentData?.id;
      const effectiveCohortId = paymentData.cohortId || studentData?.cohort_id;

      console.log('🔍 [DEBUG] handleRegularPayment - effective IDs:', {
        effectiveStudentId,
        effectiveCohortId,
        paymentDataStudentId: paymentData.studentId,
        paymentDataCohortId: paymentData.cohortId,
        studentDataId: studentData?.id,
        studentDataCohortId: studentData?.cohort_id,
      });

      const { data: existingStudentPayment, error: studentPaymentError } =
        await supabase
          .from('student_payments')
          .select('id, payment_plan')
          .eq('student_id', effectiveStudentId)
          .eq('cohort_id', effectiveCohortId)
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
        // Create new student payment record with only existing fields
        const { data: newStudentPayment, error: createError } = await supabase
          .from('student_payments')
          .insert({
            student_id: effectiveStudentId,
            cohort_id: effectiveCohortId,
            payment_plan: 'instalment_wise', // Default to installment-wise for targeted payments
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
      console.log(
        '🔍 [DEBUG] Creating transaction record with FULL payment data:',
        paymentData
      );
      console.log('🔍 [DEBUG] Specific installment fields:', {
        installmentId: paymentData.installmentId,
        semesterNumber: paymentData.semesterNumber,
        hasInstallmentId: 'installmentId' in paymentData,
        hasSemesterNumber: 'semesterNumber' in paymentData,
        installmentIdType: typeof paymentData.installmentId,
        semesterNumberType: typeof paymentData.semesterNumber,
      });

      // Normalize and strictly require installment targeting
      const parseSemesterFromId = (id?: string | null): number | null => {
        if (!id) return null;
        const first = String(id).split('-')[0];
        const num = Number(first);
        return Number.isFinite(num) ? num : null;
      };

      const normalizedInstallmentId: string | null =
        paymentData.installmentId ?? null;
      let normalizedSemesterNumber: number | null =
        typeof paymentData.semesterNumber === 'number'
          ? paymentData.semesterNumber
          : null;
      if (!normalizedSemesterNumber) {
        normalizedSemesterNumber = parseSemesterFromId(normalizedInstallmentId);
      }

      console.log('🔍 [DEBUG] Normalized targeting:', {
        normalizedInstallmentId,
        normalizedSemesterNumber,
        isOneShotPayment: existingStudentPayment?.payment_plan === 'one_shot' || normalizedInstallmentId === 'program_fee_one_shot' || paymentData.installmentId === 'program_fee_one_shot',
        paymentPlan: existingStudentPayment?.payment_plan,
        originalInstallmentId: paymentData.installmentId,
        hasExistingPayment: !!existingStudentPayment,
      });

      // For one-shot payments, we don't need semester/installment targeting
      // Check both existing payment plan and installment ID pattern
      const isOneShotPayment = existingStudentPayment?.payment_plan === 'one_shot' || 
                               normalizedInstallmentId === 'program_fee_one_shot' ||
                               paymentData.installmentId === 'program_fee_one_shot';
      
      if (!normalizedInstallmentId) {
        toast.error(
          'Installment targeting is required. Please select a specific installment and try again.'
        );
        Logger.getInstance().error(
          'Missing installment targeting on regular payment',
          {
            paymentData,
            normalizedInstallmentId,
            normalizedSemesterNumber,
            isOneShotPayment,
          }
        );
        return { success: false, error: 'Missing installment targeting' };
      }
      
      // For non-one-shot payments, require semester number
      if (!isOneShotPayment && !normalizedSemesterNumber) {
        toast.error(
          'Semester targeting is required for installment-based payments. Please select a specific installment and try again.'
        );
        Logger.getInstance().error(
          'Missing semester targeting on installment payment',
          {
            paymentData,
            normalizedInstallmentId,
            normalizedSemesterNumber,
            isOneShotPayment,
          }
        );
        return { success: false, error: 'Missing semester targeting' };
      }

      // Determine if this is an admin-recorded payment
      const isAdminRecorded = paymentData.isAdminRecorded === true;
      const recordedByUserId = paymentData.recordedByUserId;

      const transactionRecord = {
        payment_id: studentPaymentId, // Use the UUID from student_payments
        transaction_type: 'payment',
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber || '',
        status: isAdminRecorded ? 'success' : 'pending', // Admin payments are immediately successful
        notes: paymentData.notes || '',
        created_by: paymentData.studentUserId || studentData?.user_id,
        verification_status: isAdminRecorded
          ? 'approved'
          : 'verification_pending', // Admin payments skip verification
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
          paymentData.paymentDate ||
          paymentData.transferDate ||
          new Date().toISOString().split('T')[0],
        transfer_date:
          paymentData.transferDate || new Date().toISOString().split('T')[0],
        // Add installment identification fields (normalized)
        installment_id: normalizedInstallmentId,
        semester_number: normalizedSemesterNumber,
        // Add admin tracking fields
        recorded_by_user_id: recordedByUserId || null,
        verified_by: isAdminRecorded ? recordedByUserId : null, // Auto-verify admin payments
        verified_at: isAdminRecorded ? new Date().toISOString() : null, // Auto-verify admin payments
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
        isAdminRecorded,
        recordedByUserId,
      });

      // Show appropriate success message
      if (isAdminRecorded) {
        toast.success(
          'Payment recorded successfully! The installment has been marked as paid.'
        );
      } else {
        toast.success(
          'Payment submitted for verification! You will be notified once verified.'
        );
      }

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
      // Use student data from paymentData if available (admin context), otherwise use studentData (student context)
      const effectiveStudentId = paymentData.studentId || studentData?.id;
      const effectiveCohortId = paymentData.cohortId || studentData?.cohort_id;

      console.log('🔍 [DEBUG] handleRazorpayPayment - effective IDs:', {
        effectiveStudentId,
        effectiveCohortId,
        paymentDataStudentId: paymentData.studentId,
        paymentDataCohortId: paymentData.cohortId,
        studentDataId: studentData?.id,
        studentDataCohortId: studentData?.cohort_id,
      });

      // Validate effective student data
      if (!effectiveStudentId || !effectiveCohortId) {
        console.error('❌ [DEBUG] Missing effective student data:', {
          effectiveStudentId,
          effectiveCohortId,
          paymentData,
          studentData,
        });
        throw new Error(
          'Student data is missing. Please refresh the page and try again.'
        );
      }

      // Get the actual payment plan from student data or use a default
      let paymentPlan = 'one_shot'; // default

      // Try to get payment plan from student payments if available
      if (effectiveStudentId && effectiveCohortId) {
        try {
          const { data: studentPayment } = await supabase
            .from('student_payments')
            .select('payment_plan')
            .eq('student_id', effectiveStudentId)
            .eq('cohort_id', effectiveCohortId)
            .maybeSingle();

          console.log(
            '🔍 [DEBUG] handleRazorpayPayment - studentPayment:',
            studentPayment
          );

          if (
            studentPayment?.payment_plan &&
            studentPayment.payment_plan !== 'not_selected'
          ) {
            paymentPlan = studentPayment.payment_plan;
          }
        } catch (error) {
          console.warn(
            'Could not fetch student payment plan, using default:',
            error
          );
        }
      }

      const razorpayData = {
        amount: paymentData.amount,
        studentId: effectiveStudentId || '',
        cohortId: effectiveCohortId || '',
        paymentPlan: paymentPlan,
        installmentId: paymentData.installmentId,
        semesterNumber: paymentData.semesterNumber,
        onSuccess: async () => {
          // Payment was successful, refresh data
          if (onPaymentSuccess) {
            await onPaymentSuccess();
          }
        },
        onError: error => {
          Logger.getInstance().error('Razorpay payment error', {
            error,
            paymentData,
          });
        },
      };

      console.log(
        '🔍 [DEBUG] handleRazorpayPayment - calling razorpayService.initiatePayment with:',
        razorpayData
      );

      await razorpayService.initiatePayment(razorpayData);

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
