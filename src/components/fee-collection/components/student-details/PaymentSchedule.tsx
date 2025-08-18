import React, { useState, useEffect, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign, Plus } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { supabase } from '@/integrations/supabase/client';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { PaymentForm } from '@/components/common/payments/PaymentForm';
import { usePaymentSubmissions } from '@/pages/dashboards/student/hooks/usePaymentSubmissions';
import { useAuth } from '@/hooks/useAuth';
import { SemesterBreakdown } from '@/pages/dashboards/student/components/SemesterBreakdown';
import type { PaymentBreakdown as StudentPaymentBreakdown } from '@/types/components/PaymentFormTypes';
import type {
  PaymentBreakdown,
  Instalment,
} from '@/types/components/PaymentFormTypes';
import type {
  PaymentSubmissionData,
  StudentData,
} from '@/types/components/PaymentFormTypes';

interface PaymentScheduleProps {
  student: StudentPaymentSummary;
}

interface PaymentScheduleItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'verification_pending' | 'paid' | 'overdue';
  paymentDate?: string;
  verificationStatus?: string;
  semesterNumber?: number;
  installmentNumber?: number;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({
  student,
}) => {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [recordingPayment, setRecordingPayment] = useState<string | null>(null); // Track which payment is being recorded inline
  const [selectedPaymentItem, setSelectedPaymentItem] =
    useState<PaymentScheduleItem | null>(null);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [adminPaymentBreakdown, setAdminPaymentBreakdown] = useState<{
    baseAmount: number;
    gstAmount: number;
    discountAmount: number;
    scholarshipAmount: number;
    totalAmount: number;
  } | null>(null);
  const [studentPaymentBreakdown, setStudentPaymentBreakdown] =
    useState<StudentPaymentBreakdown | null>(null);

  // Check if user can record payments (admin/fee_collector permissions)
  const { canCollectFees } = useFeaturePermissions();
  const { profile } = useAuth();
  const paymentSubmissionsHook = usePaymentSubmissions();

  const calculatePaymentSchedule = useCallback(async (): Promise<
    PaymentScheduleItem[]
  > => {
    if (
      !student.student_id ||
      !student.payment_plan ||
      student.payment_plan === 'not_selected'
    ) {
      return [];
    }

    try {
      // Determine additional discount (admin-side) to keep parity with student view
      let additionalDiscountPercentage = 0;
      let scholarshipId = null;
      try {
        // Get payment record for scholarship_id
        const { data: sp } = await supabase
          .from('student_payments')
          .select('id, scholarship_id')
          .eq('student_id', student.student_id)
          .eq('cohort_id', student.student?.cohort_id)
          .maybeSingle();

        scholarshipId = sp?.scholarship_id || null;

        // Get additional discount from student_scholarships if scholarship exists
        if (scholarshipId) {
          const { data: scholarship } = await supabase
            .from('student_scholarships')
            .select('additional_discount_percentage')
            .eq('student_id', student.student_id)
            .eq('scholarship_id', scholarshipId)
            .maybeSingle();

          if (
            scholarship &&
            typeof scholarship.additional_discount_percentage === 'number' &&
            scholarship.additional_discount_percentage > 0
          ) {
            additionalDiscountPercentage =
              scholarship.additional_discount_percentage || 0;
          }
        }
      } catch (error) {
        console.warn('Error fetching student payment/scholarship data:', error);
      }

      // Fetch canonical breakdown and fee structure from Edge Function
      const { breakdown: feeReview, feeStructure } = await getFullPaymentView({
        studentId: String(student.student_id),
        cohortId: String(student.student?.cohort_id),
        paymentPlan: student.payment_plan as
          | 'one_shot'
          | 'sem_wise'
          | 'instalment_wise',
        scholarshipId: scholarshipId || undefined,
        additionalDiscountPercentage,
      });

      if (!feeStructure) {
        throw new Error('Fee structure not found in edge function response');
      }

      // Fetch payment transactions to check verification status
      let transactions: Array<{
        verification_status?: string;
        amount?: string | number;
      }> = [];
      // Ensure we have a payment_id; fall back to querying by student/cohort if not provided
      let paymentId: string | undefined = student.student_payment_id as
        | string
        | undefined;
      if (!paymentId) {
        const { data: paymentRecord } = await supabase
          .from('student_payments')
          .select('id')
          .eq('student_id', student.student_id)
          .eq('cohort_id', student.student?.cohort_id)
          .maybeSingle();
        paymentId = paymentRecord?.id;
      }
      if (paymentId) {
        const transactionResponse =
          await paymentTransactionService.getByPaymentId(paymentId);
        if (transactionResponse.success && transactionResponse.data) {
          transactions = transactionResponse.data;
        }
      }

      const schedule: PaymentScheduleItem[] = [];

      // Add admission fee (always first) - always marked as paid since student is registered
      schedule.push({
        id: 'admission_fee',
        type: 'Admission Fee',
        amount: feeStructure.admission_fee,
        dueDate: new Date().toISOString(),
        status: 'paid',
        paymentDate: new Date().toISOString(),
      });

      // Add program fee installments based on payment plan
      if (student.payment_plan === 'one_shot') {
        const oneShot = feeReview.oneShotPayment;
        const programFeeAmount =
          (oneShot?.amountPayable ?? 0) ||
          feeReview.overallSummary.totalAmountPayable -
            feeStructure.admission_fee;
        const statusFromEngine = (oneShot as Record<string, unknown>)
          ?.status as
          | 'pending'
          | 'verification_pending'
          | 'paid'
          | 'overdue'
          | undefined;

        schedule.push({
          id: 'program_fee_one_shot',
          type: 'Program Fee (One-Shot)',
          amount: programFeeAmount,
          dueDate: oneShot?.paymentDate || new Date().toISOString(),
          status: statusFromEngine || 'pending',
          paymentDate: undefined,
          verificationStatus:
            statusFromEngine === 'verification_pending'
              ? 'verification_pending'
              : undefined,
        });
      } else if (student.payment_plan === 'sem_wise') {
        // Use engine statuses for each semester (single installment per semester)
        feeReview.semesters.forEach((semester, index) => {
          const inst = semester.instalments[0];
          const statusFromEngine = (inst as Record<string, unknown>)?.status as
            | 'pending'
            | 'verification_pending'
            | 'paid'
            | 'overdue'
            | undefined;
          schedule.push({
            id: `semester_${index + 1}`,
            type: `Program Fee (Semester ${index + 1})`,
            amount: semester.total.totalPayable,
            dueDate: inst?.paymentDate || new Date().toISOString(),
            status: statusFromEngine || 'pending',
            paymentDate: undefined,
            verificationStatus:
              statusFromEngine === 'verification_pending'
                ? 'verification_pending'
                : undefined,
            semesterNumber: semester.semesterNumber,
            installmentNumber: 1, // sem_wise always has 1 installment per semester
          });
        });
      } else if (student.payment_plan === 'instalment_wise') {
        // Use engine statuses per installment
        let installmentIndex = 1;
        feeReview.semesters.forEach(semester => {
          semester.instalments.forEach(installment => {
            const statusFromEngine = (installment as Record<string, unknown>)
              ?.status as
              | 'pending'
              | 'verification_pending'
              | 'paid'
              | 'overdue'
              | undefined;
            schedule.push({
              id: `installment_${installmentIndex}`,
              type: `Program Fee (Instalment ${installmentIndex})`,
              amount: installment.amountPayable,
              dueDate: installment.paymentDate,
              status: statusFromEngine || 'pending',
              paymentDate: undefined,
              verificationStatus:
                statusFromEngine === 'verification_pending'
                  ? 'verification_pending'
                  : undefined,
              semesterNumber: semester.semesterNumber,
              installmentNumber:
                installment.installmentNumber || installmentIndex,
            });
            installmentIndex++;
          });
        });
      }

      return schedule;
    } catch (error) {
      console.error('Error calculating payment schedule:', error);
      try {
        (await import('sonner')).toast?.error?.(
          'Failed to load payment schedule.'
        );
      } catch (error) {
        console.warn('Error showing toast:', error);
      }
      return [];
    }
  }, [student]);

  const fetchPaymentSchedule = useCallback(async () => {
    try {
      setLoading(true);
      const schedule = await calculatePaymentSchedule();
      setPaymentSchedule(schedule);
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [calculatePaymentSchedule]);

  useEffect(() => {
    fetchPaymentSchedule();
  }, [fetchPaymentSchedule]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string, verificationStatus?: string) => {
    if (verificationStatus === 'verification_pending') {
      return (
        <Badge className='bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs'>
          Verification Pending
        </Badge>
      );
    }

    switch (status) {
      case 'paid':
        return (
          <Badge className='bg-green-500/20 text-green-600 border-green-500/30 text-xs'>
            Paid
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className='bg-red-500/20 text-red-600 border-red-500/30 text-xs'>
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className='bg-muted text-muted-foreground border-border text-xs'>
            Pending
          </Badge>
        );
    }
  };

  // Function to handle recording payment for an installment
  const handleRecordPayment = async (paymentItem: PaymentScheduleItem) => {
    console.log('🔍 [PaymentSchedule] handleRecordPayment called with:', {
      paymentItem,
      amount: paymentItem.amount,
      type: paymentItem.type,
      semesterNumber: paymentItem.semesterNumber,
      installmentNumber: paymentItem.installmentNumber,
      status: paymentItem.status,
    });

    setRecordingPayment(paymentItem.id);
    setSelectedPaymentItem(paymentItem);

    // Fetch payment breakdown for this specific item
    await fetchPaymentBreakdownForItem(paymentItem);

    setShowInlineForm(true);
    setRecordingPayment(null);
  };

  // Function to fetch payment breakdown for a specific item
  const fetchPaymentBreakdownForItem = async (
    paymentItem: PaymentScheduleItem
  ) => {
    if (!student.student_id || !student.student?.cohort_id) return;

    try {
      console.log('🔍 [PaymentSchedule] Fetching payment breakdown for item:', {
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        paymentItemType: paymentItem.type,
      });

      // Get the full payment breakdown from the payment engine
      const response = await getFullPaymentView({
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
      });

      if (response.success && response.breakdown) {
        // Store the full payment breakdown for the SemesterBreakdown component
        setStudentPaymentBreakdown(response.breakdown);

        // Find the specific installment breakdown for the admin form
        let breakdown: {
          baseAmount: number;
          gstAmount: number;
          discountAmount: number;
          scholarshipAmount: number;
          totalAmount: number;
        } | null = null;

        if (paymentItem.type === 'Admission Fee') {
          breakdown = {
            baseAmount: response.breakdown.admissionFee.baseAmount || 0,
            gstAmount: response.breakdown.admissionFee.gstAmount || 0,
            discountAmount: response.breakdown.admissionFee.discountAmount || 0,
            scholarshipAmount:
              response.breakdown.admissionFee.scholarshipAmount || 0,
            totalAmount: response.breakdown.admissionFee.totalPayable || 0,
          };
        } else if (paymentItem.type?.includes('One-Shot')) {
          const oneShotPayment = response.breakdown.oneShotPayment;
          if (oneShotPayment) {
            breakdown = {
              baseAmount: oneShotPayment.baseAmount || 0,
              gstAmount: oneShotPayment.gstAmount || 0,
              discountAmount: oneShotPayment.discountAmount || 0,
              scholarshipAmount: oneShotPayment.scholarshipAmount || 0,
              totalAmount: oneShotPayment.amountPayable || 0,
            };
          }
        } else if (
          paymentItem.semesterNumber &&
          paymentItem.installmentNumber
        ) {
          // Find the specific semester and installment
          const semester = response.breakdown.semesters?.find(
            s => s.semesterNumber === paymentItem.semesterNumber
          );
          const installment = semester?.instalments?.find(
            i => i.installmentNumber === paymentItem.installmentNumber
          );

          if (installment) {
            breakdown = {
              baseAmount: installment.baseAmount || 0,
              gstAmount: installment.gstAmount || 0,
              discountAmount: installment.discountAmount || 0,
              scholarshipAmount: installment.scholarshipAmount || 0,
              totalAmount: installment.amountPayable || 0,
            };
          }
        }

        setAdminPaymentBreakdown(breakdown);
      }
    } catch (error) {
      console.error('Error fetching payment breakdown for item:', error);
    }
  };

  // Function to handle payment recording completion
  const handlePaymentRecorded = () => {
    // Refresh the payment schedule and close the form
    fetchPaymentSchedule();
    setShowInlineForm(false);
    setSelectedPaymentItem(null);
    setAdminPaymentBreakdown(null);
    setStudentPaymentBreakdown(null);
  };

  // Function to close the inline form
  const handleCloseInlineForm = () => {
    setShowInlineForm(false);
    setSelectedPaymentItem(null);
    setAdminPaymentBreakdown(null);
    setStudentPaymentBreakdown(null);
  };

  // Function to handle payment submission from inline form
  const handlePaymentSubmission = async (
    paymentData: PaymentSubmissionData
  ) => {
    if (!selectedPaymentItem) return;

    try {
      // Transform student data for payment submission
      const studentData: StudentData = {
        id: student.student_id,
        email: student.student?.email || '',
        first_name: student.student?.first_name || null,
        last_name: student.student?.last_name || null,
        phone: student.student?.phone || null,
        avatar_url: student.student?.avatar_url || null,
        cohort_id: student.student?.cohort_id || '',
        user_id: student.student?.user_id || null,
        invite_status: 'accepted',
        invited_at: null,
        accepted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add admin-specific fields - convert to PaymentMethods PaymentSubmissionData
      const adminPaymentData = {
        ...paymentData,
        paymentId: selectedPaymentItem.id, // Required field for PaymentMethods
        studentId: studentData.id,
        cohortId: studentData.cohort_id,
        installmentId: selectedPaymentItem.id,
        semesterNumber: selectedPaymentItem.semesterNumber,
        isAdminRecorded: true,
        recordedByUserId: profile?.user_id,
      };

      await paymentSubmissionsHook.handlePaymentSubmission(adminPaymentData);
      handlePaymentRecorded();
    } catch (error) {
      console.error('Error submitting admin payment:', error);
    }
  };

  // Helper to determine if a payment can be recorded by admin
  const canRecordPayment = (status: string, verificationStatus?: string) => {
    // Admin can record payments for pending/overdue payments only
    // Don't allow recording for already paid or verification pending payments
    return (
      canCollectFees &&
      (status === 'pending' || status === 'overdue') &&
      !verificationStatus
    );
  };

  // Check if payment plan is selected
  const hasPaymentPlan =
    student.payment_plan && student.payment_plan !== 'not_selected';

  if (loading) {
    return (
      <div className='space-y-3'>
        <div className='animate-pulse'>
          <div className='h-20 bg-muted rounded mb-2'></div>
          <div className='h-20 bg-muted rounded mb-2'></div>
          <div className='h-20 bg-muted rounded mb-2'></div>
        </div>
      </div>
    );
  }

  // Empty state when no payment plan is selected
  if (!hasPaymentPlan) {
    return (
      <>
        <div className='text-center py-8'>
          <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
            <Calendar className='h-8 w-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold text-foreground mb-2'>
            No Payment Schedule Available
          </h3>
          <p className='text-sm text-muted-foreground mb-4 max-w-sm mx-auto'>
            Payment schedule will be generated once the student selects a
            payment plan. This will show all upcoming payments and due dates.
          </p>

          {/* Schedule Preview */}
          <div className='grid grid-cols-1 gap-3 max-w-xs mx-auto'>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <DollarSign className='h-5 w-5 text-green-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>One-Shot Payment</p>
                <p className='text-xs text-muted-foreground'>
                  Single payment due immediately
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <Clock className='h-5 w-5 text-blue-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>Semester-wise</p>
                <p className='text-xs text-muted-foreground'>
                  Payments due at semester start
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
              <Calendar className='h-5 w-5 text-purple-600' />
              <div className='text-left'>
                <p className='text-sm font-medium'>Installment-wise</p>
                <p className='text-xs text-muted-foreground'>
                  Regular monthly payments
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator className='bg-border' />
      </>
    );
  }

  return (
    <>
      <div>
        {paymentSchedule.length > 0 ? (
          <div className='space-y-3'>
            {paymentSchedule.map(item => (
              <div
                key={item.id}
                className='border border-border rounded-lg p-4 bg-card'
              >
                <div className='flex items-center justify-between mb-3'>
                  <span className='font-medium text-sm text-foreground'>
                    {item.type}
                  </span>
                  <div className='flex items-center gap-2'>
                    {getStatusBadge(item.status, item.verificationStatus)}
                    {canRecordPayment(item.status, item.verificationStatus) && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleRecordPayment(item)}
                        disabled={recordingPayment === item.id}
                        className='h-6 px-2 text-xs'
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        {recordingPayment === item.id
                          ? 'Recording...'
                          : 'Record Payment'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className='space-y-2 text-xs text-muted-foreground'>
                  <div className='flex justify-between'>
                    <span>Amount Payable:</span>
                    <span className='text-foreground'>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Due:</span>
                    <span className='text-foreground'>
                      {formatDate(item.dueDate)}
                    </span>
                  </div>
                  {item.paymentDate && (
                    <div className='flex justify-between'>
                      <span>Paid:</span>
                      <span className='text-foreground'>
                        {formatDate(item.paymentDate)}
                      </span>
                    </div>
                  )}
                  {item.verificationStatus === 'verification_pending' && (
                    <div className='text-yellow-600 text-xs mt-2'>
                      Payment proof submitted, awaiting verification
                    </div>
                  )}
                </div>

                {/* Inline Payment Form - Show when this specific item is selected for recording */}
                {showInlineForm && selectedPaymentItem?.id === item.id && (
                  <div className='mt-4 border-t border-border pt-4'>
                    <div className='mb-4'>
                      <h4 className='font-semibold text-sm text-foreground mb-2'>
                        Record Payment for {selectedPaymentItem.type}
                      </h4>
                      <div className='text-xs text-muted-foreground'>
                        Amount: {formatCurrency(selectedPaymentItem.amount)}
                      </div>
                    </div>

                    {/* Payment Form */}
                    {adminPaymentBreakdown && (
                      <div className='space-y-4'>
                        {/* Payment Form Component */}
                        <PaymentForm
                          paymentSubmissions={new Map()}
                          submittingPayments={
                            paymentSubmissionsHook.submittingPayments
                          }
                          onPaymentSubmission={handlePaymentSubmission}
                          studentData={{
                            id: student.student_id,
                            email: student.student?.email || '',
                            first_name: student.student?.first_name || null,
                            last_name: student.student?.last_name || null,
                            phone: student.student?.phone || null,
                            avatar_url: student.student?.avatar_url || null,
                            cohort_id: student.student?.cohort_id || '',
                            user_id: student.student?.user_id || null,
                            invite_status: 'accepted',
                            invited_at: null,
                            accepted_at: null,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          }}
                          selectedPaymentPlan={student.payment_plan}
                          paymentBreakdown={{
                            totalAmount: adminPaymentBreakdown.totalAmount,
                            paidAmount: 0,
                            pendingAmount: adminPaymentBreakdown.totalAmount,
                            instalmentPayments: [
                              {
                                id: selectedPaymentItem.id,
                                installmentNumber:
                                  selectedPaymentItem.installmentNumber || 1,
                                amount: adminPaymentBreakdown.totalAmount,
                                dueDate: selectedPaymentItem.dueDate,
                                status:
                                  selectedPaymentItem.status ===
                                  'verification_pending'
                                    ? 'pending'
                                    : (selectedPaymentItem.status as
                                        | 'pending'
                                        | 'paid'
                                        | 'overdue'),
                                paidAmount: 0,
                              },
                            ],
                          }}
                          selectedInstallment={{
                            id: selectedPaymentItem.id,
                            installmentNumber:
                              selectedPaymentItem.installmentNumber || 1,
                            amount: adminPaymentBreakdown.totalAmount,
                            dueDate: selectedPaymentItem.dueDate,
                            status:
                              selectedPaymentItem.status ===
                              'verification_pending'
                                ? 'pending'
                                : (selectedPaymentItem.status as
                                    | 'pending'
                                    | 'paid'
                                    | 'overdue'),
                            paidAmount: 0,
                            paidDate: selectedPaymentItem.paymentDate,
                          }}
                          isAdminMode={true}
                        />

                        {/* Cancel Button */}
                        <div className='flex justify-end pt-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={handleCloseInlineForm}
                            disabled={
                              paymentSubmissionsHook.submittingPayments.size > 0
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Loading state while fetching breakdown */}
                    {!adminPaymentBreakdown && (
                      <div className='flex items-center justify-center py-4'>
                        <div className='text-sm text-muted-foreground'>
                          Loading payment details...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8'>
            <div className='mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4'>
              <Calendar className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No Payments Scheduled
            </h3>
            <p className='text-sm text-muted-foreground'>
              Payment schedule is being generated. Please check back later.
            </p>
          </div>
        )}
      </div>
      <Separator className='bg-border' />
    </>
  );
};
