import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { InstallmentCard } from './InstallmentCard';
import { PaymentBreakdown, PaymentSubmissionData, StudentData, Installment } from '@/types/payments';

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
  onInstallmentClick: (installment: Installment, semesterNumber: number, installmentIndex: number) => void;
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Payment Breakdown</h2>
      {paymentBreakdown.semesters?.map((semester: Semester) => (
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
                    {formatCurrency(semester.total?.totalPayable || 0)}
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
                {semester.instalments?.map((installment: Installment, index: number) => (
                  <InstallmentCard
                    key={index}
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
