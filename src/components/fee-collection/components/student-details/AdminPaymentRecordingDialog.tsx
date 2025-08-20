import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, DollarSign, Calendar, Info } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { getFullPaymentView } from '@/services/payments/paymentEngineClient';
import { PaymentForm } from '@/components/common/payments/PaymentForm';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentSubmissions } from '@/pages/dashboards/student/hooks/usePaymentSubmissions';
import { FeeStructureService } from '@/services/feeStructure.service';
import {
  StudentData,
  PaymentBreakdown,
  Instalment,
  PaymentSubmissionData,
} from '@/types/components/PaymentFormTypes';

import { PaymentBreakdown as StudentPaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';

interface PaymentScheduleItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'pending_10_plus_days' | 'verification_pending' | 'paid' | 'overdue' | 'partially_paid_days_left' | 'partially_paid_overdue' | 'partially_paid_verification_pending';
  paymentDate?: string;
  verificationStatus?: string;
  semesterNumber?: number;
  installmentNumber?: number;
}

interface AdminPaymentRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPaymentSummary;
  paymentItem: PaymentScheduleItem | null;
  onPaymentRecorded?: () => void; // Callback to refresh the payment schedule
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

interface AdminPaymentBreakdown {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  totalAmount: number;
}

export const AdminPaymentRecordingDialog: React.FC<
  AdminPaymentRecordingDialogProps
> = ({ open, onOpenChange, student, paymentItem, onPaymentRecorded, feeStructure }) => {
  const [adminPaymentBreakdown, setAdminPaymentBreakdown] =
    useState<AdminPaymentBreakdown | null>(null);
  const [studentPaymentBreakdown, setStudentPaymentBreakdown] =
    useState<StudentPaymentBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  
  const { handlePaymentSubmission: handleRegularPayment, submittingPayments } =
    usePaymentSubmissions(undefined, async () => {
      // Close the dialog and refresh the payment schedule
      onOpenChange(false);
      onPaymentRecorded?.();
    });

  // 🔍 DEBUG LOGGING - Track initial props (only on dialog open)

  useEffect(() => {
    if (open) {
      console.log('🔍 [AdminPaymentDialog] Dialog opened with props:', {
        paymentItem,
        paymentItemAmount: paymentItem?.amount,
        studentData: {
          student_id: student.student_id,
          cohort_id: student.student?.cohort_id,
          payment_plan: student.payment_plan,
        },
      });
    }
  }, [open]); // Only run when dialog opens/closes

  // Transform student data for PaymentForm
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

  // Transform payment item for PaymentForm - MEMOIZED to prevent infinite re-renders
  const selectedInstallment: Instalment | undefined = useMemo(() => {
    if (!paymentItem) return undefined;

    // Calculate the amount - prefer breakdown total, fallback to paymentItem amount
    const calculatedAmount =
      adminPaymentBreakdown?.totalAmount ?? paymentItem.amount;

    console.log(
      '🔍 [AdminPaymentDialog] selectedInstallment amount calculation:',
      {
        adminBreakdownTotal: adminPaymentBreakdown?.totalAmount,
        paymentItemAmount: paymentItem.amount,
        calculatedAmount,
        isNaN: isNaN(calculatedAmount),
        paymentItemSemesterNumber: paymentItem.semesterNumber,
        paymentItemInstallmentNumber: paymentItem.installmentNumber,
      }
    );

    return {
      id: paymentItem.id,
      installmentNumber: paymentItem.installmentNumber || 1,
      semesterNumber: paymentItem.semesterNumber || 1, // Add semesterNumber for targeting validation
      amount: calculatedAmount,
      dueDate: paymentItem.dueDate,
      status: paymentItem.status as 'pending' | 'paid' | 'overdue',
      paidAmount: 0,
      paidDate: paymentItem.paymentDate,
    };
  }, [paymentItem, adminPaymentBreakdown?.totalAmount]);

  // 🔍 DEBUG LOGGING - Track selectedInstallment creation (DISABLED to prevent infinite loop)
  // useEffect(() => {
  //   console.log('🔍 [AdminPaymentDialog] selectedInstallment created:', {
  //     selectedInstallment,
  //     breakdown: adminPaymentBreakdown,
  //     paymentItemAmount: paymentItem?.amount,
  //     calculatedAmount:
  //       adminPaymentBreakdown?.totalAmount || paymentItem?.amount,
  //   });
  // }, [selectedInstallment, adminPaymentBreakdown, paymentItem]);

  // Payment form props
  const paymentSubmissions = new Map<string, PaymentSubmissionData>();
  // submittingPayments comes from usePaymentSubmissions hook

  // Handle payment submission with admin context
  const handlePaymentSubmission = async (
    paymentData: PaymentSubmissionData
  ) => {
    try {
      // Convert PaymentFormTypes.PaymentSubmissionData to PaymentMethods.PaymentSubmissionData
      const adminPaymentData = {
        paymentId: `student-payment-${Date.now()}`,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        receiptFile: paymentData.receiptFile,
        studentId: studentData.id,
        cohortId: studentData.cohort_id,
        studentUserId: studentData.user_id,
        // Construct installmentId in the same format as usePaymentForm
        installmentId: paymentItem?.semesterNumber && paymentItem?.installmentNumber 
          ? `${paymentItem.semesterNumber}-${paymentItem.installmentNumber}`
          : paymentItem?.id, // Fallback to original id for one-shot payments
        semesterNumber: paymentItem?.semesterNumber,
        isAdminRecorded: true,
        recordedByUserId: profile?.user_id,
      };

      await handleRegularPayment(adminPaymentData);
      onPaymentRecorded?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting admin payment:', error);
    }
  };

  const fetchPaymentBreakdown = useCallback(async () => {
    if (!paymentItem || !student.student_id || !student.student?.cohort_id) {
      console.log(
        '🔍 [AdminPaymentDialog] fetchPaymentBreakdown skipped - missing data:',
        {
          paymentItem: !!paymentItem,
          student_id: student.student_id,
          cohort_id: student.student?.cohort_id,
        }
      );
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [AdminPaymentDialog] Fetching payment breakdown:', {
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        paymentItemType: paymentItem.type,
      });

      // First, try to get the student's custom fee structure
      const customFeeStructure = await FeeStructureService.getFeeStructure(
        String(student.student?.cohort_id),
        String(student.student_id)
      );
      
      // Use custom structure if it exists, otherwise use the provided cohort structure
      const feeStructureToUse = customFeeStructure || feeStructure;
      

      
      // Get the full payment breakdown from the payment engine
      // Use the correct fee structure (custom if exists, cohort otherwise)
      const response = await getFullPaymentView({
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
        feeStructureData: {
          total_program_fee: feeStructureToUse.total_program_fee,
          admission_fee: feeStructureToUse.admission_fee,
          number_of_semesters: feeStructureToUse.number_of_semesters,
          instalments_per_semester: feeStructureToUse.instalments_per_semester,
          one_shot_discount_percentage: feeStructureToUse.one_shot_discount_percentage,
          one_shot_dates: feeStructureToUse.one_shot_dates,
          sem_wise_dates: feeStructureToUse.sem_wise_dates,
          instalment_wise_dates: feeStructureToUse.instalment_wise_dates,
        }
      });

      console.log('🔍 [AdminPaymentDialog] Payment engine response:', {
        success: response.success,
        hasBreakdown: !!response.breakdown,
        overallSummary: response.breakdown?.overallSummary,
        feeStructure: feeStructure,
      });

      if (response.success && response.breakdown) {
        // Find the specific installment breakdown
        let breakdown: AdminPaymentBreakdown | null = null;

        console.log('🔍 [AdminPaymentDialog] Determining breakdown type:', {
          type: paymentItem.type,
          semesterNumber: paymentItem.semesterNumber,
          installmentNumber: paymentItem.installmentNumber,
        });

        if (paymentItem.type === 'Admission Fee') {
          console.log('🔍 [AdminPaymentDialog] Processing Admission Fee:', {
            admissionFee: response.breakdown.admissionFee,
          });
          breakdown = {
            baseAmount: response.breakdown.admissionFee.baseAmount || 0,
            gstAmount: response.breakdown.admissionFee.gstAmount || 0,
            discountAmount: response.breakdown.admissionFee.discountAmount || 0,
            scholarshipAmount:
              response.breakdown.admissionFee.scholarshipAmount || 0,
            totalAmount: response.breakdown.admissionFee.totalPayable || 0,
          };
        } else if (paymentItem.type === 'Program Fee (One-Shot)') {
          const oneShotPayment = response.breakdown.oneShotPayment;
          console.log('🔍 [AdminPaymentDialog] Processing One-Shot Payment:', {
            oneShotPayment,
            baseAmount: oneShotPayment?.baseAmount,
            gstAmount: oneShotPayment?.gstAmount,
            discountAmount: oneShotPayment?.discountAmount,
            scholarshipAmount: oneShotPayment?.scholarshipAmount,
            amountPayable: oneShotPayment?.amountPayable,
          });
          if (oneShotPayment) {
            // For one-shot payments, use the overall summary to show the correct breakdown
            // The payment engine calculates the remaining fee breakdown, but we want to show the full breakdown
            const overallSummary = response.breakdown.overallSummary;
            
            breakdown = {
              baseAmount: overallSummary.totalProgramFee, // Full program fee
              gstAmount: overallSummary.totalGST, // Total GST
              discountAmount: overallSummary.totalDiscount, // Total discount
              scholarshipAmount: overallSummary.totalScholarship, // Total scholarship
              totalAmount: paymentItem.amount || 0, // Use the actual payment item amount
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

          console.log(
            '🔍 [AdminPaymentDialog] Processing Installment Payment:',
            {
              targetSemester: paymentItem.semesterNumber,
              targetInstallment: paymentItem.installmentNumber,
              foundSemester: !!semester,
              foundInstallment: !!installment,
              availableSemesters: response.breakdown.semesters?.map(s => ({
                semesterNumber: s.semesterNumber,
                installmentCount: s.instalments?.length,
              })),
              installment,
            }
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

        console.log('🔍 [AdminPaymentDialog] Final breakdown calculated:', {
          breakdown,
          totalAmount: breakdown?.totalAmount,
          baseAmount: breakdown?.baseAmount,
          gstAmount: breakdown?.gstAmount,
          discountAmount: breakdown?.discountAmount,
          scholarshipAmount: breakdown?.scholarshipAmount,
        });

        setAdminPaymentBreakdown(breakdown);
        // Also store the full payment breakdown for the SemesterBreakdown component
        setStudentPaymentBreakdown(response.breakdown);
      }
    } catch (error) {
      console.error('Error fetching payment breakdown:', error);
    } finally {
      setLoading(false);
    }
  }, [
    paymentItem,
    student.student_id,
    student.student?.cohort_id,
    student.payment_plan,
  ]);

  useEffect(() => {
    if (open && paymentItem && student) {
      fetchPaymentBreakdown();
    }
  }, [open, paymentItem, student, fetchPaymentBreakdown]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className='bg-green-500/20 text-green-600 border-green-500/30'>
            Paid
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className='bg-red-500/20 text-red-600 border-red-500/30'>
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className='bg-muted text-muted-foreground border-border'>
            Pending
          </Badge>
        );
    }
  };

  // Create PaymentBreakdown for PaymentForm component - MEMOIZED to prevent infinite re-renders
  const paymentBreakdownForForm: PaymentBreakdown | undefined = useMemo(() => {
    if (!paymentItem || !selectedInstallment) return undefined;

    // Use the same amount calculation as selectedInstallment
    const calculatedAmount =
      adminPaymentBreakdown?.totalAmount ?? paymentItem.amount;

    console.log(
      '🔍 [AdminPaymentDialog] paymentBreakdownForForm amount calculation:',
      {
        adminBreakdownTotal: adminPaymentBreakdown?.totalAmount,
        paymentItemAmount: paymentItem.amount,
        calculatedAmount,
        selectedInstallmentAmount: selectedInstallment.amount,
      }
    );

    return {
      totalAmount: calculatedAmount,
      paidAmount: 0,
      pendingAmount: calculatedAmount,
      // Create a basic semester structure if needed
      instalmentPayments: [
        {
          id: selectedInstallment.id,
          installmentNumber: selectedInstallment.installmentNumber,
          amount: calculatedAmount,
          dueDate: selectedInstallment.dueDate,
          status: selectedInstallment.status,
          paidAmount: 0,
        },
      ],
    };
  }, [paymentItem, selectedInstallment, adminPaymentBreakdown?.totalAmount]);

  // 🔍 DEBUG LOGGING - Track paymentBreakdownForForm creation (DISABLED to prevent infinite loop)
  // useEffect(() => {
  //   console.log('🔍 [AdminPaymentDialog] paymentBreakdownForForm created:', {
  //     paymentBreakdownForForm,
  //     hasPaymentItem: !!paymentItem,
  //     hasSelectedInstallment: !!selectedInstallment,
  //     totalAmount: adminPaymentBreakdown?.totalAmount || paymentItem?.amount,
  //   });
  // }, [
  //   paymentBreakdownForForm,
  //   adminPaymentBreakdown,
  //   paymentItem,
  //   selectedInstallment,
  // ]);



  if (!paymentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-lg font-semibold'>
              Record Payment for {student.student?.first_name || ''}{' '}
              {student.student?.last_name || ''} - {paymentItem.type}
            </DialogTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onOpenChange(false)}
              className='h-6 w-6 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Payment Breakdown - Using Student Component */}
          {loading ? (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='h-4 bg-muted rounded animate-pulse'></div>
                  <div className='h-4 bg-muted rounded animate-pulse w-3/4'></div>
                  <div className='h-4 bg-muted rounded animate-pulse w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ) : adminPaymentBreakdown ? (
            <Card className='border-border'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  {paymentItem.type} - Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Base Fee:</span>
                      <span>
                        ₹{adminPaymentBreakdown.baseAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>GST:</span>
                      <span>
                        ₹{adminPaymentBreakdown.gstAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    {adminPaymentBreakdown.discountAmount > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Discount:</span>
                        <span className='text-green-600'>
                          -₹
                          {adminPaymentBreakdown.discountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {adminPaymentBreakdown.scholarshipAmount > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Scholarship:
                        </span>
                        <span className='text-green-600'>
                          -₹
                          {adminPaymentBreakdown.scholarshipAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className='flex justify-between text-lg font-semibold'>
                  <span>Total Amount:</span>
                  <span>
                    ₹{adminPaymentBreakdown.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className='text-xs text-muted-foreground'>
                  {paymentItem.semesterNumber &&
                    paymentItem.installmentNumber && (
                      <>
                        Semester {paymentItem.semesterNumber} • Installment{' '}
                        {paymentItem.installmentNumber}
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Payment Form */}
          <div className='space-y-4'>
            <PaymentForm
              paymentSubmissions={paymentSubmissions}
              submittingPayments={submittingPayments}
              onPaymentSubmission={handlePaymentSubmission}
              studentData={studentData}
              selectedPaymentPlan={student.payment_plan}
              paymentBreakdown={paymentBreakdownForForm}
              selectedInstallment={selectedInstallment}
              isAdminMode={true} // Enable admin mode to show payment ID fields for online payments
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
