import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaymentPlan } from '@/types/fee';

interface Installment {
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  amountPayable: number;
}

interface InstallmentItemProps {
  installment: Installment;
  index: number;
  semesterNumber: number;
  selectedPaymentPlan: PaymentPlan;
  onPayNow?: (installment: Installment) => void;
}

export const InstallmentItem: React.FC<InstallmentItemProps> = ({
  installment,
  index,
  semesterNumber,
  selectedPaymentPlan,
  onPayNow
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getInstallmentTitle = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot': return 'Full Payment';
      case 'sem_wise': return `Semester ${semesterNumber} Payment`;
      case 'instalment_wise': return `Installment ${index + 1}`;
      default: return `Installment ${index + 1}`;
    }
  };

  const getPaymentStatus = () => {
    return installment.amountPayable > 0 ? 'Pending' : 'Paid';
  };

  const getPaymentStatusVariant = () => {
    return installment.amountPayable > 0 ? 'secondary' : 'default';
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="font-medium">{getInstallmentTitle()}</h4>
          <Badge variant="outline" className="text-xs">
            Due: {new Date(installment.paymentDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </Badge>
        </div>
        <Badge variant={getPaymentStatusVariant()} className="text-xs">
          {getPaymentStatus()}
        </Badge>
      </div>
      
      <div className="grid gap-3 md:grid-cols-4 mb-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Base Amount</p>
          <p className="font-semibold">{formatCurrency(installment.baseAmount)}</p>
        </div>
        {installment.discountAmount > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="font-semibold text-green-600">-{formatCurrency(installment.discountAmount)}</p>
          </div>
        )}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">GST</p>
          <p className="font-semibold">{formatCurrency(installment.gstAmount)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total Payable</p>
          <p className="font-semibold text-green-600">{formatCurrency(installment.amountPayable)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="text-xs text-muted-foreground">
          {installment.amountPayable > 0 ? 
            `Payment due on ${new Date(installment.paymentDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}` : 
            'Payment completed'
          }
        </div>
        {installment.amountPayable > 0 && onPayNow && (
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onPayNow(installment)}
          >
            Pay Now
          </Button>
        )}
      </div>
    </div>
  );
};
