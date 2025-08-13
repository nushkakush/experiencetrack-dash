import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { SemesterTable } from './SemesterTable';
import { PaymentSubmissionData, StudentData } from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { Logger } from '@/lib/logging/Logger';

// Define the installment type that includes scholarship amounts
interface DatabaseInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
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
  onToggleSemester: (semesterNumber: number) => void;
  onInstallmentClick: (installment: DatabaseInstallment, semesterNumber: number, installmentIndex: number) => void;
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
  onToggleSemester,
  onInstallmentClick,
  onPaymentSubmission
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  Logger.getInstance().debug('SemesterBreakdown render', {
    hasPaymentBreakdown: !!paymentBreakdown,
    semestersCount: paymentBreakdown?.semesters?.length || 0,
    selectedPaymentPlan,
    expandedSemestersCount: expandedSemesters.size
  });

  if (!paymentBreakdown?.semesters || paymentBreakdown.semesters.length === 0) {
    Logger.getInstance().debug('SemesterBreakdown - no semesters available');
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Payment Breakdown</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No payment schedule available. Please select a payment plan first.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payment Breakdown</h2>
      
      {/* Admission Fee Card */}
      <Card className="border-green-200 bg-green-600/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {formatCurrency(paymentBreakdown.admissionFee?.totalPayable || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Admission Fee</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-xs text-green-600 font-medium">Paid</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Semester Cards */}
      {paymentBreakdown.semesters?.map((semester: any) => (
        <Card key={semester.semesterNumber} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {selectedPaymentPlan === 'one_shot' ? 'Program Fee' : `Semester ${semester.semesterNumber}`}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(semester.total?.totalPayable || semester.totalPayable || 0)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleSemester(semester.semesterNumber)}
              >
                {expandedSemesters.has(semester.semesterNumber) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          {expandedSemesters.has(semester.semesterNumber) && (
            <CardContent className="pt-0">
              <Separator className="my-4" />
              <div className="space-y-4">
                {semester.instalments?.map((installment: DatabaseInstallment, index: number) => (
                  <InstallmentCard
                    key={`${semester.semesterNumber}-${index}`}
                    installment={installment}
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
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
