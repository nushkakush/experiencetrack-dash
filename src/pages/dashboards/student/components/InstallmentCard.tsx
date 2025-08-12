import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import PaymentSubmissionForm from './PaymentSubmissionFormV2';
import { FeeBreakdown } from './FeeBreakdown';
import { Installment, PaymentSubmissionData, StudentData, PaymentBreakdown } from '@/types/payments';

export interface InstallmentCardProps {
  installment: Installment;
  semesterNumber: number;
  installmentIndex: number;
  selectedPaymentPlan: PaymentPlan;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: StudentData;
  paymentBreakdown?: PaymentBreakdown;
  onInstallmentClick: (installment: Installment, semesterNumber: number, installmentIndex: number) => void;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({
  installment,
  semesterNumber,
  installmentIndex,
  selectedPaymentPlan,
  selectedInstallmentKey,
  showPaymentForm,
  paymentSubmissions,
  submittingPayments,
  studentData,
  paymentBreakdown,
  onInstallmentClick,
  onPaymentSubmission
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const currentKey = `${semesterNumber}-${installmentIndex}`;
  const isSelected = selectedInstallmentKey === currentKey;

  const getInstallmentLabel = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'Full Payment';
      case 'sem_wise':
        return `Semester ${semesterNumber} Payment`;
      case 'instalment_wise':
        return `Installment ${installmentIndex + 1}`;
      default:
        return `Installment ${installmentIndex + 1}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Installment Header */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant={isSelected ? "default" : "outline"}
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => onInstallmentClick(installment, semesterNumber, installmentIndex)}
            >
              {getInstallmentLabel()}
              {isSelected ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(installment.amountPayable)} • {formatDate(installment.paymentDate)}
            </div>
          </div>
        </div>

        {/* Payment Form - Inside the installment card */}
        {isSelected && showPaymentForm && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <PaymentSubmissionForm
              paymentSubmissions={paymentSubmissions || new Map()}
              submittingPayments={submittingPayments || new Set()}
              onPaymentSubmission={onPaymentSubmission}
              studentData={studentData}
              selectedPaymentPlan={selectedPaymentPlan}
              paymentBreakdown={paymentBreakdown}
              selectedInstallment={installment}
            />
          </div>
        )}

        {/* Fee Breakdown - Below the form */}
        <div className="mt-4">
          <FeeBreakdown
            baseAmount={installment.baseAmount}
            gstAmount={installment.gstAmount}
            discountAmount={installment.discountAmount}
            amountPayable={installment.amountPayable}
          />
        </div>
      </div>
    </div>
  );
};
