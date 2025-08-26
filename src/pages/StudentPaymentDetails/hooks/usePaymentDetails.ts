/**
 * Payment Details Hook
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { profileService } from '@/services/profile.service';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { useAuth } from '@/hooks/useAuth';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { Logger } from '@/lib/logging/Logger';
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

export const usePaymentDetails = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<string>('');
  const [engineBreakdown, setEngineBreakdown] = useState<any | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(
    new Set()
  );
  const [expandedInstallments, setExpandedInstallments] = useState<Set<string>>(
    new Set()
  );

  // Payment submission states
  const [paymentSubmissions, setPaymentSubmissions] = useState<
    Map<string, PaymentSubmission>
  >(new Map());
  const [submittingPayments, setSubmittingPayments] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    // Only load data when auth is ready and profile exists
    if (!authLoading && profile) {
      loadStudentData();
    }
  }, [authLoading, profile]);

  // Fetch canonical breakdown from Edge Function when inputs are ready
  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        if (
          !studentData?.id ||
          !cohortData?.cohort_id ||
          !selectedPaymentPlan
        ) {
          setEngineBreakdown(null);
          return;
        }
        const plan = selectedPaymentPlan as
          | 'one_shot'
          | 'sem_wise'
          | 'instalment_wise'
          | 'not_selected';
        if (plan === 'not_selected') {
          setEngineBreakdown(null);
          return;
        }
        const { breakdown } = await getFullPaymentView({
          studentId: String(studentData.id),
          cohortId: String(cohortData.cohort_id || cohortData.id),
          paymentPlan: plan as 'one_shot' | 'sem_wise' | 'instalment_wise',
        });
        setEngineBreakdown(breakdown || null);
      } catch (error) {
        console.error('Failed to fetch payment breakdown from engine', error);
        setEngineBreakdown(null);
      }
    };
    fetchBreakdown();
  }, [
    studentData?.id,
    cohortData?.cohort_id,
    cohortData?.id,
    selectedPaymentPlan,
  ]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Check if profile and user_id exist
      if (!profile?.user_id) {
        toast.error('User profile not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Load student profile
      const studentResult = await profileService.getByUserId(profile.user_id);
      if (!studentResult.success || !studentResult.data) {
        toast.error('Failed to load student data');
        return;
      }
      setStudentData(studentResult.data);

      // Get the student record from cohort_students table
      const cohortStudentResult = await cohortStudentsService.getByUserId(
        profile.user_id
      );
      if (!cohortStudentResult.success || !cohortStudentResult.data) {
        toast.error('Student not found in any cohort');
        return;
      }

      // Load cohort data using the cohort_id from the student record
      const cohortData = cohortStudentResult.data;
      setCohortData(cohortData);

      // Load fee structure - prioritize custom plan for this student if it exists
      const feeStructureResult = await FeeStructureService.getFeeStructure(
        cohortData.cohort_id,
        cohortData.id
      );
      if (feeStructureResult) {
        setFeeStructure(feeStructureResult);
      }

      // Load scholarships
      const scholarshipsResult = await studentScholarshipsService.getByStudent(
        cohortData.id
      );
      if (scholarshipsResult.success && scholarshipsResult.data) {
        setScholarships(
          Array.isArray(scholarshipsResult.data)
            ? scholarshipsResult.data
            : [scholarshipsResult.data]
        );
      }

      // Set default payment plan
      setSelectedPaymentPlan('one_shot');
    } catch (error) {
      Logger.getInstance().error('Error loading student data', { error });
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentBreakdown = () => engineBreakdown;

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const toggleSemester = (semesterNumber: number) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(semesterNumber)) {
        newSet.delete(semesterNumber);
      } else {
        newSet.add(semesterNumber);
      }
      return newSet;
    });
  };

  const toggleInstallment = (installmentKey: string) => {
    setExpandedInstallments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(installmentKey)) {
        newSet.delete(installmentKey);
      } else {
        newSet.add(installmentKey);
      }
      return newSet;
    });
  };

  const handlePaymentMethodChange = (paymentId: string, method: string) => {
    setPaymentSubmissions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(paymentId) || {
        paymentId,
        amount: 0,
        paymentMethod: '',
        submittedAt: new Date(),
      };
      newMap.set(paymentId, { ...existing, paymentMethod: method });
      return newMap;
    });
  };

  const handleAmountChange = (paymentId: string, amount: number) => {
    setPaymentSubmissions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(paymentId) || {
        paymentId,
        amount: 0,
        paymentMethod: '',
        submittedAt: new Date(),
      };
      newMap.set(paymentId, { ...existing, amount });
      return newMap;
    });
  };

  const handleReceiptUpload = (paymentId: string, file: File) => {
    setPaymentSubmissions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(paymentId) || {
        paymentId,
        amount: 0,
        paymentMethod: '',
        submittedAt: new Date(),
      };
      newMap.set(paymentId, { ...existing, receiptFile: file });
      return newMap;
    });
  };

  const handleNotesChange = (paymentId: string, notes: string) => {
    setPaymentSubmissions(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(paymentId) || {
        paymentId,
        amount: 0,
        paymentMethod: '',
        submittedAt: new Date(),
      };
      newMap.set(paymentId, { ...existing, notes });
      return newMap;
    });
  };

  const handlePaymentSubmission = async (paymentId: string) => {
    console.log(
      '🔍 [PAYMENT SUBMISSION] Starting payment submission for:',
      paymentId
    );

    const submission = paymentSubmissions.get(paymentId);
    if (!submission) {
      console.log(
        '❌ [PAYMENT SUBMISSION] No payment data found for:',
        paymentId
      );
      toast.error('No payment data found');
      return;
    }

    console.log('🔍 [PAYMENT SUBMISSION] Submission data:', {
      paymentId,
      submission,
      studentData: studentData?.id,
      cohortData: cohortData?.id,
      selectedPaymentPlan,
    });

    if (!submission.paymentMethod || submission.amount <= 0) {
      console.log('❌ [PAYMENT SUBMISSION] Invalid submission data:', {
        paymentMethod: submission.paymentMethod,
        amount: submission.amount,
      });
      toast.error('Please select payment method and enter amount');
      return;
    }

    setSubmittingPayments(prev => new Set(prev).add(paymentId));

    try {
      Logger.getInstance().info('Submitting payment', { submission });

      // Upload receipt file to Supabase Storage if provided
      let receiptUrl = '';
      if (submission.receiptFile) {
        const uploadResult = await uploadReceiptToStorage(
          submission.receiptFile,
          paymentId
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

      // First, check if there's already a student_payments record for this student and cohort
      console.log(
        '🔍 [PAYMENT SUBMISSION] Checking for existing student_payments record:',
        {
          student_id: studentData?.id,
          cohort_id: cohortData?.id,
        }
      );

      let studentPaymentId: string;

      const { data: existingPayment, error: existingError } = await supabase
        .from('student_payments')
        .select('id, payment_plan, scholarship_id')
        .eq('student_id', studentData?.id)
        .eq('cohort_id', cohortData?.id)
        .maybeSingle();

      console.log(
        '🔍 [PAYMENT SUBMISSION] Existing payment record query result:',
        {
          existingPayment,
          existingError,
          hasExistingPayment: !!existingPayment,
        }
      );

      if (existingError) {
        console.log(
          '❌ [PAYMENT SUBMISSION] Error checking existing payment record:',
          existingError
        );
        Logger.getInstance().error('Failed to check existing payment record', {
          error: existingError,
        });
        throw new Error(
          `Failed to check existing payment record: ${existingError.message}`
        );
      }

      if (existingPayment) {
        // Use existing student_payments record
        studentPaymentId = existingPayment.id;
        console.log(
          '✅ [PAYMENT SUBMISSION] Using existing student payment record:',
          {
            studentPaymentId,
            existingPayment,
          }
        );
        Logger.getInstance().info('Using existing student payment record', {
          studentPaymentId,
        });
      } else {
        // Create a new student_payments record for the payment plan
        console.log(
          '🔍 [PAYMENT SUBMISSION] Creating new student_payments record'
        );

        const paymentPlanRecord = {
          student_id: studentData?.id,
          cohort_id: cohortData?.id,
          payment_plan: selectedPaymentPlan || 'one_shot',
          scholarship_id: scholarships?.[0]?.id || null,
        };

        console.log(
          '🔍 [PAYMENT SUBMISSION] Payment plan record to create:',
          paymentPlanRecord
        );

        const { data: newPayment, error: newPaymentError } = await supabase
          .from('student_payments')
          .insert([paymentPlanRecord])
          .select()
          .single();

        console.log(
          '🔍 [PAYMENT SUBMISSION] New payment record creation result:',
          {
            newPayment,
            newPaymentError,
          }
        );

        if (newPaymentError) {
          console.log(
            '❌ [PAYMENT SUBMISSION] Error creating payment plan record:',
            newPaymentError
          );
          Logger.getInstance().error('Failed to create payment plan record', {
            error: newPaymentError,
          });
          throw new Error(
            `Failed to create payment plan record: ${newPaymentError.message}`
          );
        }

        studentPaymentId = newPayment.id;
        console.log(
          '✅ [PAYMENT SUBMISSION] Created new student payment record:',
          {
            studentPaymentId,
            newPayment,
          }
        );
        Logger.getInstance().info('Created new student payment record', {
          studentPaymentId,
        });
      }

      // Parse installment information from paymentId (format: "semester-installment" or similar)
      let semesterNumber: number | null = null;
      let installmentNumber: number | null = null;

      if (paymentId.includes('-')) {
        const parts = paymentId.split('-');
        if (parts.length >= 2) {
          semesterNumber = parseInt(parts[0], 10);
          installmentNumber = parseInt(parts[1], 10);
        }
      } else if (paymentId.startsWith('semester_')) {
        // Handle "semester_X" format
        semesterNumber = parseInt(paymentId.replace('semester_', ''), 10);
        installmentNumber = 1; // Default to first installment for semester-wise payments
      }

      // Create payment transaction record
      console.log(
        '🔍 [PAYMENT SUBMISSION] Creating transaction record with parsed installment info:',
        {
          semesterNumber,
          installmentNumber,
          paymentId,
        }
      );

      const transactionRecord = {
        payment_id: studentPaymentId, // Use the student payment record ID
        amount: submission.amount,
        payment_method: submission.paymentMethod,
        reference_number: paymentId,
        installment_id: paymentId, // Use paymentId as installment_id
        semester_number: semesterNumber,
        status: 'pending',
        notes: submission.notes || '',
        receipt_url: receiptUrl,
        submitted_by: studentData?.id,
        submitted_at: new Date().toISOString(),
      };

      console.log(
        '🔍 [PAYMENT SUBMISSION] Transaction record to create:',
        transactionRecord
      );

      const { data: transactionData, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert([transactionRecord])
        .select()
        .single();

      console.log('🔍 [PAYMENT SUBMISSION] Transaction creation result:', {
        transactionData,
        transactionError,
      });

      if (transactionError) {
        console.log(
          '❌ [PAYMENT SUBMISSION] Error creating transaction record:',
          transactionError
        );
        Logger.getInstance().error('Failed to create transaction record', {
          error: transactionError,
          submission,
        });
        // Don't throw here as the payment record was created successfully
      } else {
        console.log(
          '✅ [PAYMENT SUBMISSION] Transaction created successfully:',
          transactionData
        );
      }

      Logger.getInstance().info('Payment submission completed successfully', {
        studentPaymentId,
        amount: submission.amount,
      });

      console.log(
        '✅ [PAYMENT SUBMISSION] Payment submission completed successfully:',
        {
          studentPaymentId,
          transactionId: transactionData?.id,
          amount: submission.amount,
          installment_id: paymentId,
          semester_number: semesterNumber,
        }
      );

      toast.success(
        'Payment submitted successfully! Your payment is now pending verification.'
      );

      // Clear the submission
      setPaymentSubmissions(prev => {
        const newMap = new Map(prev);
        newMap.delete(paymentId);
        return newMap;
      });

      // Refresh payment data to show updated status
      // This will trigger a re-fetch of payment breakdown and transactions
      if (window.location.pathname.includes('/dashboard/fee-payment')) {
        // If on fee payment dashboard, trigger a page refresh to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // If on student payment details page, trigger a refetch
        // Note: This would need to be passed down from parent component
        console.log(
          'Payment submitted - dashboard should refresh to show updated status'
        );

        // For now, trigger a page refresh to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      Logger.getInstance().error('Error submitting payment', {
        error,
        submission,
      });
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setSubmittingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const canSubmitPayment = (paymentId: string): boolean => {
    const submission = paymentSubmissions.get(paymentId);
    return !!(submission?.paymentMethod && submission?.amount > 0);
  };

  return {
    loading,
    studentData,
    cohortData,
    feeStructure,
    scholarships,
    selectedPaymentPlan,
    expandedSemesters,
    expandedInstallments,
    paymentSubmissions,
    submittingPayments,
    generatePaymentBreakdown,
    handleBackToDashboard,
    toggleSemester,
    toggleInstallment,
    handlePaymentMethodChange,
    handleAmountChange,
    handleReceiptUpload,
    handleNotesChange,
    handlePaymentSubmission,
    canSubmitPayment,
  };
};
