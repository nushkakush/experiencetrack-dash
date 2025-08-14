import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { SemesterTable } from './SemesterTable';
import { PaymentSubmissionData, StudentData } from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';

// Define the installment type that includes scholarship amounts
interface DatabaseInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  amountPaid: number;
  amountPending: number;
  semesterNumber?: number;
  baseAmount: number;
  scholarshipAmount: number;
  discountAmount: number;
  gstAmount: number;
  amountPayable: number;
  totalPayable: number;
  paymentDate: string | null;
}

// Define the semester type that matches our database structure
interface DatabaseSemester {
  semesterNumber: number;
  total: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
  };
  instalments: DatabaseInstallment[];
}

export interface SemesterBreakdownProps {
  paymentBreakdown: PaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  expandedSemesters: Set<number>;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: StudentData;
  studentPayments?: StudentPaymentRow[];
  onToggleSemester: (semesterNumber: number) => void;
  onInstallmentClick: (
    installment: DatabaseInstallment,
    semesterNumber: number,
    installmentIndex: number
  ) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const SemesterBreakdown: React.FC<SemesterBreakdownProps> = ({
  paymentBreakdown,
  selectedPaymentPlan,
  expandedSemesters,
  selectedInstallmentKey,
  showPaymentForm,
  paymentSubmissions,
  submittingPayments,
  studentData,
  studentPayments,
  onToggleSemester,
  onInstallmentClick,
  onPaymentSubmission,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Check if all installments in a semester are completed
  const isSemesterCompleted = (semester: DatabaseSemester) => {
    if (!semester.instalments || semester.instalments.length === 0) {
      return false;
    }

    return semester.instalments.every((installment: DatabaseInstallment) => {
      return (
        installment.status === 'paid' ||
        installment.amountPaid >= installment.amount
      );
    });
  };

  Logger.getInstance().debug('SemesterBreakdown render', {
    hasPaymentBreakdown: !!paymentBreakdown,
    semestersCount: paymentBreakdown?.semesters?.length || 0,
    selectedPaymentPlan,
    expandedSemestersCount: expandedSemesters.size,
  });

  if (!paymentBreakdown?.semesters || paymentBreakdown.semesters.length === 0) {
    Logger.getInstance().debug('SemesterBreakdown - no semesters available');

    // For one-shot payments, show the one-shot payment card
    if (
      selectedPaymentPlan === 'one_shot' &&
      paymentBreakdown?.oneShotPayment
    ) {
      return (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold'>Payment Breakdown</h2>

          {/* Admission Fee Card */}
          <Card className='border-green-200 bg-green-600/10'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-600'>
                    <CheckCircle className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-lg font-semibold'>
                      {formatCurrency(
                        paymentBreakdown.admissionFee?.totalPayable || 0
                      )}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Admission Fee
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-muted-foreground'>Status</p>
                  <p className='text-xs text-green-600 font-medium'>Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* One-Shot Payment Card */}
          <Card className='border-blue-200 bg-blue-600/10'>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600'>
                    <Calendar className='h-5 w-5 text-white' />
                  </div>
                  <div>
                    <p className='text-lg font-semibold'>
                      Program Fee (One-Shot)
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {formatCurrency(
                        paymentBreakdown.oneShotPayment.amountPayable
                      )}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-muted-foreground'>Due Date</p>
                  <p className='text-xs text-blue-600 font-medium'>
                    {new Date(
                      paymentBreakdown.oneShotPayment.paymentDate
                    ).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Payment Breakdown</h2>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center text-muted-foreground'>
              No payment schedule available. Please select a payment plan first.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>Payment Breakdown</h2>

      {/* Admission Fee Card */}
      <Card className='border-green-200 bg-green-600/10'>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-600'>
                <CheckCircle className='h-5 w-5 text-white' />
              </div>
              <div>
                <p className='text-lg font-semibold'>
                  {formatCurrency(
                    paymentBreakdown.admissionFee?.totalPayable || 0
                  )}
                </p>
                <p className='text-sm text-muted-foreground'>Admission Fee</p>
              </div>
            </div>
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>Status</p>
              <p className='text-xs text-green-600 font-medium'>Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Cards */}
      {paymentBreakdown.semesters?.map((semester: DatabaseSemester) => {
        const isCompleted = isSemesterCompleted(semester);

        return (
          <Card
            key={semester.semesterNumber}
            className={`overflow-hidden transition-all duration-300 ${
              isCompleted ? 'border-green-200 bg-green-600/10' : ''
            }`}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isCompleted ? 'bg-green-600' : 'bg-yellow-100'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className='h-5 w-5 text-white' />
                    ) : (
                      <Calendar className='h-5 w-5 text-yellow-600' />
                    )}
                  </div>
                  <div>
                    <CardTitle className='text-lg'>
                      {selectedPaymentPlan === 'one_shot'
                        ? 'Program Fee'
                        : `Semester ${semester.semesterNumber}`}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      {formatCurrency(
                        semester.total?.totalPayable ||
                          semester.totalPayable ||
                          0
                      )}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {isCompleted && (
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>Status</p>
                      <p className='text-xs text-green-600 font-medium'>Paid</p>
                    </div>
                  )}
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onToggleSemester(semester.semesterNumber)}
                  >
                    {expandedSemesters.has(semester.semesterNumber) ? (
                      <ChevronUp className='h-4 w-4' />
                    ) : (
                      <ChevronDown className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedSemesters.has(semester.semesterNumber) && (
              <CardContent className='pt-0'>
                <Separator className='my-4' />
                <div className='space-y-4'>
                  {semester.instalments?.map(
                    (inst: DatabaseInstallment, index: number) => {
                      const totalPayable = Number(
                        inst.totalPayable ??
                          inst.amountPayable ??
                          inst.amount ??
                          0
                      );
                      // If we have live DB summary, prefer it to reflect verification-pending state
                      const amountPaid = Number(
                        inst.amountPaid ??
                          studentPayments?.[0]?.total_amount_paid ??
                          0
                      );
                      const due = String(
                        inst.paymentDate ?? inst.due_date ?? ''
                      );

                      // Derive a consistent status if not provided
                      const computeStatus = (): string => {
                        const hasProvided =
                          typeof inst.status === 'string' &&
                          inst.status.length > 0;
                        if (hasProvided) return String(inst.status);

                        if (!due) return 'pending';
                        const dueDate = new Date(due);
                        const today = new Date();
                        // normalize to date only
                        const d0 = new Date(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate()
                        ).getTime();
                        const d1 = new Date(
                          dueDate.getFullYear(),
                          dueDate.getMonth(),
                          dueDate.getDate()
                        ).getTime();
                        const daysUntilDue = Math.ceil(
                          (d1 - d0) / (1000 * 60 * 60 * 24)
                        );

                        if (amountPaid >= totalPayable) return 'paid';
                        if (daysUntilDue < 0) {
                          // Past due
                          return amountPaid > 0
                            ? 'partially_paid_overdue'
                            : 'overdue';
                        }
                        // Upcoming
                        // If there is any submitted transaction awaiting verification, reflect that
                        const hasVerificationPending = Array.isArray(
                          studentPayments?.[0]?.payment_transactions
                        )
                          ? studentPayments![0].payment_transactions.some(
                              (t: { verification_status?: string }) =>
                                t.verification_status === 'verification_pending'
                            )
                          : false;
                        if (hasVerificationPending && amountPaid > 0)
                          return 'partially_paid_verification_pending';
                        if (amountPaid > 0) return 'partially_paid_days_left';
                        if (daysUntilDue >= 10) return 'pending_10_plus_days';
                        return 'pending';
                      };

                      const status = computeStatus();
                      const dbInst: DatabaseInstallment = {
                        installmentNumber: Number(
                          inst.installmentNumber ?? index + 1
                        ),
                        dueDate: due,
                        amount: totalPayable,
                        status,
                        amountPaid: amountPaid,
                        amountPending: Math.max(0, totalPayable - amountPaid),
                        semesterNumber: Number(
                          semester.semesterNumber ?? inst.semester_number ?? 1
                        ),
                        baseAmount: Number(inst.baseAmount ?? 0),
                        scholarshipAmount: Number(inst.scholarshipAmount ?? 0),
                        discountAmount: Number(inst.discountAmount ?? 0),
                        gstAmount: Number(inst.gstAmount ?? 0),
                        amountPayable: totalPayable,
                        totalPayable: totalPayable,
                        paymentDate: inst.paymentDate ?? null,
                      };
                      return (
                        <InstallmentCard
                          key={`${semester.semesterNumber}-${index}`}
                          installment={dbInst}
                          semesterNumber={semester.semesterNumber}
                          installmentIndex={index}
                          selectedPaymentPlan={selectedPaymentPlan}
                          selectedInstallmentKey={selectedInstallmentKey}
                          showPaymentForm={showPaymentForm}
                          paymentSubmissions={paymentSubmissions}
                          submittingPayments={submittingPayments}
                          studentData={studentData}
                          paymentBreakdown={paymentBreakdown}
                          onInstallmentClick={onInstallmentClick}
                          onPaymentSubmission={onPaymentSubmission}
                        />
                      );
                    }
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
