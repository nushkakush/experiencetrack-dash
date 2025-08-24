import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { PaymentPlan, PaymentStatus } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { CohortStudent, Cohort } from '@/types/cohort';
import { PaymentSubmissionData } from '@/types/payments';
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

interface SemesterCardProps {
  semester: EngineSemester;
  selectedPaymentPlan: PaymentPlan;
  expandedSemesters: Set<number>;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: CohortStudent;
  cohortData?: Cohort;
  studentPayments?: StudentPaymentRow[];
  paymentTransactions?: PaymentTransactionRow[];
  paymentBreakdown: any;
  isSemesterCompleted: (semester: EngineSemester) => boolean;
  formatCurrency: (amount: number) => string;
  computeInstallmentStatus: (
    inst: DatabaseInstallment,
    txForInstall: PaymentTransactionRow[],
    totalPayable: number,
    allocatedPaid: number,
    due: string
  ) => PaymentStatus;
  onToggleSemester: (semesterNumber: number) => void;
  onInstallmentClick: (
    installment: DatabaseInstallment,
    semesterNumber: number,
    installmentIndex: number
  ) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const SemesterCard: React.FC<SemesterCardProps> = ({
  semester,
  selectedPaymentPlan,
  expandedSemesters,
  selectedInstallmentKey,
  showPaymentForm,
  paymentSubmissions,
  submittingPayments,
  studentData,
  cohortData,
  paymentTransactions,
  paymentBreakdown,
  isSemesterCompleted,
  formatCurrency,
  computeInstallmentStatus,
  onToggleSemester,
  onInstallmentClick,
  onPaymentSubmission,
}) => {
  const isCompleted = isSemesterCompleted(semester);
  const isExpanded = expandedSemesters.has(semester.semesterNumber);

  return (
    <Card
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
                  {semester.instalments?.every(inst => inst.status === 'waived') 
                    ? 'Waived' 
                    : semester.instalments?.some(inst => inst.status === 'waived')
                      ? 'Mixed'
                      : 'Paid'
                  }
                </p>
              </div>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => onToggleSemester(semester.semesterNumber)}
            >
              {isExpanded ? (
                <ChevronUp className='h-4 w-4' />
              ) : (
                <ChevronDown className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
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
                        tx.verification_status === 'verification_pending';
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
                const allocatedPaid = Math.min(amountPaidRaw, totalPayable);
                const due = String(inst.paymentDate ?? '');

                const status = computeInstallmentStatus(
                  inst,
                  txForInstall,
                  totalPayable,
                  allocatedPaid,
                  due
                );

                const dbInst: DatabaseInstallment = {
                  installmentNumber: Number(
                    inst.installmentNumber ?? index + 1
                  ),
                  dueDate: due,
                  amount: totalPayable,
                  status,
                  amountPaid: allocatedPaid,
                  amountPending: Math.max(0, totalPayable - allocatedPaid),
                  semesterNumber: Number(
                    inst.semesterNumber ?? semester.semesterNumber ?? 1
                  ),
                  baseAmount: Number(inst.baseAmount ?? 0),
                  scholarshipAmount: Number(inst.scholarshipAmount ?? 0),
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
                    cohortData={cohortData}
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
};
