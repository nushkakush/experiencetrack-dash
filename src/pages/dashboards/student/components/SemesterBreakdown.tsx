import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { CohortStudent } from '@/types/cohort';
import { PaymentSubmissionData } from '@/types/payments';
import { Logger } from '@/lib/logging/Logger';
import {
  StudentPaymentRow,
  PaymentTransactionRow,
} from '@/types/payments/DatabaseAlignedTypes';
import { PaymentBreakdown as PaymentBreakdownType } from '@/types/payments';

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

// Define the semester type close to engine output
type EngineSemester = {
  semesterNumber: number;
  total?: {
    totalPayable?: number;
    totalPaid?: number;
    totalPending?: number;
  };
  totalPayable?: number;
  instalments?: DatabaseInstallment[];
};

// Minimal engine breakdown shape consumed here
type EnginePaymentBreakdown = {
  admissionFee?: { totalPayable?: number } | null;
  oneShotPayment?: {
    amountPayable?: number;
    baseAmount?: number;
    discountAmount?: number;
    scholarshipAmount?: number;
    gstAmount?: number;
    paymentDate?: string;
  } | null;
  semesters?: EngineSemester[];
  overallSummary?: { totalAmountPayable?: number } | null;
};

export interface SemesterBreakdownProps {
  paymentBreakdown: EnginePaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
  expandedSemesters: Set<number>;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: CohortStudent;
  studentPayments?: StudentPaymentRow[];
  paymentTransactions?: PaymentTransactionRow[];
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
  paymentTransactions,
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
  const isSemesterCompleted = (semester: EngineSemester) => {
    if (!semester.instalments || semester.instalments.length === 0) {
      return false;
    }

    return semester.instalments.every((installment: DatabaseInstallment) => {
      return installment.status === 'paid';
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
      // Build a single synthetic installment to reuse the InstallmentCard
      const totalPayable = Number(
        paymentBreakdown.oneShotPayment.amountPayable || 0
      );
      // Support both DB row shape (total_amount_paid) and converted shape (amountPaid)
      // Calculate amount paid from payment_transactions table (pure source of truth)
      const amountPaidRaw = Array.isArray(paymentTransactions)
        ? paymentTransactions.reduce((total, tx) => {
            // Only count approved transactions or pending verification transactions
            if (
              tx.verification_status === 'approved' ||
              tx.verification_status === 'verification_pending'
            ) {
              return total + (tx.amount || 0);
            }
            return total;
          }, 0)
        : 0;

      // Clamp paid shown for this installment to not exceed its payable
      const amountPaid = Math.min(amountPaidRaw, totalPayable);
      const due = String(paymentBreakdown.oneShotPayment.paymentDate || '');

      // Derive status using payment_transactions as primary source of truth
      const computeStatus = (): PaymentStatus => {
        // Check verification status from payment_transactions table (primary source)
        const hasVerificationPendingByTx = Array.isArray(paymentTransactions)
          ? paymentTransactions.some(
              t => t.verification_status === 'verification_pending'
            )
          : false;

        const hasApprovedTransactions = Array.isArray(paymentTransactions)
          ? paymentTransactions.some(t => t.verification_status === 'approved')
          : false;

        // If no transactions exist, this is a pending payment
        if (
          !Array.isArray(paymentTransactions) ||
          paymentTransactions.length === 0
        ) {
          return 'pending';
        }

        // If there are approved transactions and amount is fully paid, it's paid
        if (hasApprovedTransactions && amountPaid >= totalPayable) {
          return 'paid';
        }

        // If there are verification pending transactions
        if (hasVerificationPendingByTx && amountPaid > 0) {
          // Check if amount is fully paid first
          if (amountPaid >= totalPayable) {
            return 'verification_pending';
          }
          return 'partially_paid_verification_pending';
        }

        // No fallback - rely purely on payment_transactions table

        if (!due) return 'pending';
        const dueDate = new Date(due);
        const today = new Date();
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
        const daysUntilDue = Math.ceil((d1 - d0) / (1000 * 60 * 60 * 24));

        // Only return 'paid' if there's no verification_pending status and amount is fully paid
        if (amountPaid >= totalPayable && !hasVerificationPendingByTx)
          return 'paid';
        if (daysUntilDue < 0) {
          return amountPaid > 0 ? 'partially_paid_overdue' : 'overdue';
        }
        if (daysUntilDue >= 10) return 'pending_10_plus_days';
        return 'pending';
      };

      const status = computeStatus();
      const dbInst: DatabaseInstallment = {
        installmentNumber: 1,
        dueDate: due,
        amount: totalPayable,
        status,
        amountPaid,
        amountPending: Math.max(0, totalPayable - amountPaid),
        semesterNumber: 1,
        baseAmount: Number(paymentBreakdown.oneShotPayment.baseAmount || 0),
        scholarshipAmount: Number(
          paymentBreakdown.oneShotPayment.scholarshipAmount || 0
        ),
        discountAmount: Number(
          paymentBreakdown.oneShotPayment.discountAmount || 0
        ),
        gstAmount: Number(paymentBreakdown.oneShotPayment.gstAmount || 0),
        amountPayable: totalPayable,
        totalPayable: totalPayable,
        paymentDate: null,
      };

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

          {/* One-Shot Installment Card with status + payment form */}
          <InstallmentCard
            installment={dbInst}
            semesterNumber={1}
            installmentIndex={0}
            selectedPaymentPlan={selectedPaymentPlan}
            selectedInstallmentKey={selectedInstallmentKey}
            showPaymentForm={showPaymentForm}
            paymentSubmissions={paymentSubmissions}
            submittingPayments={submittingPayments}
            studentData={studentData}
            paymentBreakdown={
              paymentBreakdown as unknown as PaymentBreakdownType
            }
            paymentTransactions={paymentTransactions}
            onInstallmentClick={onInstallmentClick}
            onPaymentSubmission={onPaymentSubmission}
          />
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
      {(() => {
        return paymentBreakdown.semesters?.map((semester: EngineSemester) => {
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
                          Number(
                            semester.total?.totalPayable ??
                              semester.totalPayable ??
                              0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {isCompleted && (
                      <div className='text-right'>
                        <p className='text-xs text-muted-foreground'>Status</p>
                        <p className='text-xs text-green-600 font-medium'>
                          Paid
                        </p>
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
                        const instNumber = Number(
                          inst.installmentNumber ?? index + 1
                        );
                        const instKey = `${semester.semesterNumber ?? 1}-${instNumber}`;

                        // Compute paid FOR THIS INSTALLMENT ONLY from targeted transactions
                        const txForInstall = Array.isArray(paymentTransactions)
                          ? paymentTransactions.filter(tx => {
                              if (!tx) return false;
                              const statusOk =
                                tx.verification_status === 'approved' ||
                                tx.verification_status ===
                                  'verification_pending';
                              if (!statusOk) return false;
                              const txKey =
                                typeof tx.installment_id === 'string'
                                  ? String(tx.installment_id)
                                  : '';
                              const matchesKey = txKey === instKey;
                              const matchesSemester =
                                Number(tx.semester_number) ===
                                Number(semester.semesterNumber ?? 1);
                              // Prefer exact key match; allow semester match as soft fallback if key not present
                              return (
                                matchesKey ||
                                (!!txKey === false && matchesSemester)
                              );
                            })
                          : [];

                        const amountPaidRaw = txForInstall.reduce(
                          (sum, tx) => sum + (Number(tx.amount) || 0),
                          0
                        );
                        const allocatedPaid = Math.min(
                          amountPaidRaw,
                          totalPayable
                        );
                        const due = String(inst.paymentDate ?? '');

                        // Derive a consistent status using payment_transactions as primary source of truth
                        const computeStatus = (): PaymentStatus => {
                          const hasProvided =
                            typeof inst.status === 'string' &&
                            inst.status.length > 0;
                          if (hasProvided)
                            return String(inst.status) as PaymentStatus;

                          // Check verification status from payment_transactions table (primary source)
                          const hasVerificationPendingByTx = txForInstall.some(
                            t =>
                              t.verification_status === 'verification_pending'
                          );
                          const hasApprovedTransactions = txForInstall.some(
                            t => t.verification_status === 'approved'
                          );

                          // If no transactions exist, this is a pending payment
                          if (
                            !Array.isArray(paymentTransactions) ||
                            paymentTransactions.length === 0
                          ) {
                            return 'pending';
                          }

                          // If there are approved transactions and amount is fully paid, it's paid
                          if (
                            hasApprovedTransactions &&
                            allocatedPaid >= totalPayable
                          ) {
                            return 'paid';
                          }

                          // If there are verification pending transactions
                          if (hasVerificationPendingByTx && allocatedPaid > 0) {
                            // Check if amount is fully paid first
                            if (allocatedPaid >= totalPayable) {
                              return 'verification_pending';
                            }
                            return 'partially_paid_verification_pending';
                          }

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

                          // No fallback - rely purely on payment_transactions table
                          const hasVerificationPending =
                            hasVerificationPendingByTx;

                          // Only return 'paid' if there's no verification_pending status and amount is fully paid
                          if (
                            allocatedPaid >= totalPayable &&
                            !hasVerificationPending
                          )
                            return 'paid';
                          if (daysUntilDue < 0) {
                            // Past due
                            return allocatedPaid > 0
                              ? 'partially_paid_overdue'
                              : 'overdue';
                          }

                          if (hasVerificationPending && allocatedPaid > 0) {
                            // Check if amount is fully paid first
                            if (allocatedPaid >= totalPayable) {
                              return 'verification_pending';
                            }
                            return 'partially_paid_verification_pending';
                          }
                          if (allocatedPaid > 0)
                            return 'partially_paid_days_left';
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
                          amountPaid: allocatedPaid,
                          amountPending: Math.max(
                            0,
                            totalPayable - allocatedPaid
                          ),
                          semesterNumber: Number(
                            inst.semesterNumber ?? semester.semesterNumber ?? 1
                          ),
                          baseAmount: Number(inst.baseAmount ?? 0),
                          scholarshipAmount: Number(
                            inst.scholarshipAmount ?? 0
                          ),
                          discountAmount: Number(inst.discountAmount ?? 0),
                          gstAmount: Number(inst.gstAmount ?? 0),
                          amountPayable: Number(
                            inst.amountPayable ?? totalPayable
                          ),
                          totalPayable: totalPayable,
                          paymentDate: null,
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
                            paymentBreakdown={
                              paymentBreakdown as unknown as PaymentBreakdownType
                            }
                            paymentTransactions={paymentTransactions}
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
        });
      })()}
    </div>
  );
};
