import React from 'react';
import { Button } from '@/components/ui/button';
import { PaymentForm } from './PaymentForm';
import { formatCurrency, formatDate } from '../utils/paymentUtils';
import { 
  PaymentBreakdown, 
  PaymentMethod, 
  PaymentSubmission 
} from '@/types/payments/StudentPaymentDetailsTypes';

interface OneShotPaymentSectionProps {
  paymentBreakdown: PaymentBreakdown;
  paymentSubmissions: Map<string, PaymentSubmission>;
  submittingPayments: Set<string>;
  paymentMethods: PaymentMethod[];
  onPaymentMethodChange: (paymentId: string, method: string) => void;
  onAmountChange: (paymentId: string, amount: number) => void;
  onReceiptUpload: (paymentId: string, file: File) => void;
  onNotesChange: (paymentId: string, notes: string) => void;
  onSubmitPayment: (paymentId: string) => void;
  canSubmitPayment: (paymentId: string) => boolean;
}

export const OneShotPaymentSection: React.FC<OneShotPaymentSectionProps> = ({
  paymentBreakdown,
  paymentSubmissions,
  submittingPayments,
  paymentMethods,
  onPaymentMethodChange,
  onAmountChange,
  onReceiptUpload,
  onNotesChange,
  onSubmitPayment,
  canSubmitPayment
}) => {
  if (!paymentBreakdown.oneShotPayment) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* One-shot payment details */}
      <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <span className="text-purple-600">💳</span>
          </div>
          <div>
            <p className="font-semibold">One-Shot Payment</p>
            <p className="text-sm text-muted-foreground">
              Due: {formatDate(paymentBreakdown.oneShotPayment.paymentDate)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(paymentBreakdown.oneShotPayment.amountPayable)}
          </p>
        </div>
      </div>

      {/* Payment Submission Form */}
      <PaymentForm
        paymentId="one-shot"
        paymentSubmissions={paymentSubmissions}
        submittingPayments={submittingPayments}
        paymentMethods={paymentMethods}
        onPaymentMethodChange={onPaymentMethodChange}
        onAmountChange={onAmountChange}
        onReceiptUpload={onReceiptUpload}
        onNotesChange={onNotesChange}
        onSubmitPayment={onSubmitPayment}
        canSubmitPayment={canSubmitPayment}
      />
    </div>
  );
};
