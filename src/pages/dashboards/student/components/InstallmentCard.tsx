import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import PaymentSubmissionForm from './PaymentSubmissionFormV2';
import { FeeBreakdown } from './FeeBreakdown';
import { PaymentSubmissionData, StudentData } from '@/types/payments';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { PaymentStatusBadge } from '@/components/fee-collection/PaymentStatusBadge';

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

export interface InstallmentCardProps {
  installment: DatabaseInstallment;
  semesterNumber: number;
  installmentIndex: number;
  selectedPaymentPlan: PaymentPlan;
  selectedInstallmentKey: string;
  showPaymentForm: boolean;
  paymentSubmissions?: Map<string, PaymentSubmissionData>;
  submittingPayments?: Set<string>;
  studentData?: StudentData;
  paymentBreakdown?: PaymentBreakdown;
  onInstallmentClick: (installment: DatabaseInstallment, semesterNumber: number, installmentIndex: number) => void;
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
        return `Installment ${installment.installmentNumber}`;
      default:
        return `Installment ${installment.installmentNumber}`;
    }
  };

  // Convert database installment to the format expected by PaymentSubmissionForm
  const convertedInstallment = {
    id: `${semesterNumber}-${installment.installmentNumber}`,
    installmentNumber: installment.installmentNumber,
    amount: installment.amount,
    dueDate: installment.dueDate,
    status: installment.status as any,
    amountPaid: installment.amountPaid,
    amountRemaining: installment.amountPending,
    isOverdue: new Date(installment.dueDate) < new Date(),
    originalAmount: installment.amount,
    // Use the actual calculated values from admin logic
    baseAmount: installment.baseAmount,
    gstAmount: installment.gstAmount,
    discountAmount: installment.discountAmount,
    amountPayable: installment.amountPayable,
    paymentDate: installment.dueDate,
  };

  return (
    <div className="space-y-4">
      {/* Installment Header */}
      <div className="p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-3">
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
              {formatCurrency(installment.amount)} • {formatDate(installment.dueDate)}
            </div>
          </div>
          <PaymentStatusBadge status={installment.status as any} />
        </div>

        {/* Payment Amount Information */}
        <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(installment.amountPaid)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount Pending</p>
            <p className="text-sm font-semibold text-orange-600">
              {formatCurrency(installment.amountPending)}
            </p>
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
              selectedInstallment={convertedInstallment as any}
            />
          </div>
        )}

        {/* Fee Breakdown - Below the form */}
        <div className="mt-4">
          <FeeBreakdown
            baseAmount={convertedInstallment.baseAmount}
            gstAmount={convertedInstallment.gstAmount}
            discountAmount={convertedInstallment.discountAmount}
            amountPayable={convertedInstallment.amountPayable}
          />
        </div>
      </div>
    </div>
  );
};
