import React, { useState, useEffect } from 'react';
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
import {
  StudentData,
  PaymentBreakdown,
  Instalment,
  PaymentSubmissionData,
} from '@/types/components/PaymentFormTypes';
import { SemesterBreakdown } from '@/pages/dashboards/student/components/SemesterBreakdown';
import { PaymentBreakdown as StudentPaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';

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

interface AdminPaymentRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPaymentSummary;
  paymentItem: PaymentScheduleItem | null;
  onPaymentRecorded?: () => void; // Callback to refresh the payment schedule
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
> = ({ open, onOpenChange, student, paymentItem, onPaymentRecorded }) => {
  const [adminPaymentBreakdown, setAdminPaymentBreakdown] =
    useState<AdminPaymentBreakdown | null>(null);
  const [studentPaymentBreakdown, setStudentPaymentBreakdown] =
    useState<StudentPaymentBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { handleRegularPayment, isSubmitting } = usePaymentSubmissions();

  // 🔍 DEBUG LOGGING - Track initial props
  useEffect(() => {
    console.log('🔍 [AdminPaymentDialog] Props received:', {
      paymentItem,
      paymentItemAmount: paymentItem?.amount,
      studentData: {
        student_id: student.student_id,
        cohort_id: student.student?.cohort_id,
        payment_plan: student.payment_plan,
      },
    });
  }, [paymentItem, student]);

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

  // Transform payment item for PaymentForm
  const selectedInstallment: Instalment | undefined = paymentItem
    ? {
        id: paymentItem.id,
        installmentNumber: paymentItem.installmentNumber || 1,
        amount: adminPaymentBreakdown?.totalAmount || paymentItem.amount, // Use breakdown amount or fallback to paymentItem amount
        dueDate: paymentItem.dueDate,
        status: paymentItem.status as 'pending' | 'paid' | 'overdue',
        paidAmount: 0,
        paidDate: paymentItem.paymentDate,
      }
    : undefined;

  // 🔍 DEBUG LOGGING - Track selectedInstallment creation
  useEffect(() => {
    console.log('🔍 [AdminPaymentDialog] selectedInstallment created:', {
      selectedInstallment,
      breakdown: adminPaymentBreakdown,
      paymentItemAmount: paymentItem?.amount,
      calculatedAmount:
        adminPaymentBreakdown?.totalAmount || paymentItem?.amount,
    });
  }, [selectedInstallment, adminPaymentBreakdown, paymentItem]);

  // Payment form props
  const paymentSubmissions = new Map<string, PaymentSubmissionData>();
  const submittingPayments = new Set<string>();
  if (isSubmitting) {
    submittingPayments.add('admin-payment');
  }

  // Handle payment submission with admin context
  const handlePaymentSubmission = async (
    paymentData: PaymentSubmissionData
  ) => {
    try {
      // Add admin-specific fields
      const adminPaymentData: PaymentSubmissionData = {
        ...paymentData,
        studentId: studentData.id,
        cohortId: studentData.cohort_id,
        installmentId: paymentItem?.id,
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

  const fetchPaymentBreakdown = async () => {
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

      // Get the full payment breakdown from the payment engine
      const response = await getFullPaymentView({
        studentId: student.student_id,
        cohortId: student.student?.cohort_id,
        paymentPlan: student.payment_plan,
      });

      console.log('🔍 [AdminPaymentDialog] Payment engine response:', {
        success: response.success,
        hasBreakdown: !!response.breakdown,
        breakdown: response.breakdown,
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
        } else if (paymentItem.type === 'One-Shot Payment') {
          const oneShotPayment = response.breakdown.oneShotPayment;
          console.log('🔍 [AdminPaymentDialog] Processing One-Shot Payment:', {
            oneShotPayment,
          });
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
  };

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

  // Create PaymentBreakdown for PaymentForm component
  const paymentBreakdownForForm: PaymentBreakdown | undefined =
    paymentItem && selectedInstallment
      ? {
          totalAmount: adminPaymentBreakdown?.totalAmount || paymentItem.amount,
          paidAmount: 0,
          pendingAmount:
            adminPaymentBreakdown?.totalAmount || paymentItem.amount,
          // Create a basic semester structure if needed
          instalmentPayments: [
            {
              id: selectedInstallment.id,
              installmentNumber: selectedInstallment.installmentNumber,
              amount: adminPaymentBreakdown?.totalAmount || paymentItem.amount,
              dueDate: selectedInstallment.dueDate,
              status: selectedInstallment.status,
              paidAmount: 0,
            },
          ],
        }
      : undefined;

  // 🔍 DEBUG LOGGING - Track paymentBreakdownForForm creation
  useEffect(() => {
    console.log('🔍 [AdminPaymentDialog] paymentBreakdownForForm created:', {
      paymentBreakdownForForm,
      hasPaymentItem: !!paymentItem,
      hasSelectedInstallment: !!selectedInstallment,
      totalAmount: adminPaymentBreakdown?.totalAmount || paymentItem?.amount,
    });
  }, [
    paymentBreakdownForForm,
    adminPaymentBreakdown,
    paymentItem,
    selectedInstallment,
  ]);

  const handlePaymentSuccess = () => {
    // Close the dialog and refresh the payment schedule
    onOpenChange(false);
    onPaymentRecorded?.();
  };

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
          ) : studentPaymentBreakdown ? (
            <SemesterBreakdown
              paymentBreakdown={studentPaymentBreakdown}
              selectedPaymentPlan={student.payment_plan}
              expandedSemesters={new Set([paymentItem.semesterNumber || 1])} // Auto-expand current semester
              selectedInstallmentKey={null}
              showPaymentForm={false} // Don't show the payment form here, we have our own below
              paymentSubmissions={new Map()}
              submittingPayments={new Set()}
              onPaymentSubmission={() => {}}
              toggleSemester={() => {}}
              onInstallmentClick={() => {}}
              studentData={studentData}
              paymentTransactions={[]}
            />
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
