import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PaymentPlan } from '@/types/fee';
import { StudentPaymentData } from '@/types/payments';

interface PaymentPlanSelectorProps {
  selectedPaymentPlan: PaymentPlan;
  onPaymentPlanSelection: (plan: PaymentPlan) => void;
  studentPayments?: StudentPaymentData[];
}

export const PaymentPlanSelector: React.FC<PaymentPlanSelectorProps> = ({
  selectedPaymentPlan,
  onPaymentPlanSelection,
  studentPayments
}) => {
  // Check if any payments have been made
  const hasMadePayments = studentPayments?.some((payment: StudentPaymentData) => 
    payment.amount_paid > 0 || payment.status === 'paid' || payment.status === 'complete'
  );

  const getPaymentPlanDisplayName = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot': return 'One Shot Payment';
      case 'sem_wise': return 'Semester Wise';
      case 'instalment_wise': return 'Installment Wise';
      default: return plan;
    }
  };

  if (hasMadePayments) {
    // Payment plan is locked after first payment
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Payment Plan</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <span className="text-sm font-medium">
              {getPaymentPlanDisplayName(selectedPaymentPlan)}
            </span>
            <Badge variant="secondary" className="text-xs">Locked</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Your payment plan has been locked because you have already made payments. To change your plan, please contact the administration.
          </div>
        </div>
      </div>
    );
  }

  // Payment plan can still be changed
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Payment Plan</label>
      <div className="space-y-2">
        <Select value={selectedPaymentPlan} onValueChange={onPaymentPlanSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_shot">One Shot Payment</SelectItem>
            <SelectItem value="sem_wise">Semester Wise</SelectItem>
            <SelectItem value="instalment_wise">Installment Wise</SelectItem>
          </SelectContent>
        </Select>
        {selectedPaymentPlan !== 'not_selected' && (
          <div className="text-xs text-muted-foreground">
            You can change your payment plan until you make your first payment.
          </div>
        )}
      </div>
    </div>
  );
};
