import React from 'react';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '../../PaymentStatusBadge';
import { Eye, Download } from 'lucide-react';

interface PaymentData {
  payment_type: 'admission_fee' | 'instalments' | 'sem_plan' | 'one_shot';
  installment_number?: number;
  semester_number?: number;
  status: string;
  amount_payable: number;
  scholarship_amount: number;
  due_date: string;
  payment_date?: string;
}

interface PaymentItemProps {
  payment: PaymentData;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const PaymentItem: React.FC<PaymentItemProps> = ({
  payment,
  formatCurrency,
  formatDate
}) => {
  const getPaymentTypeDisplay = () => {
    switch (payment.payment_type) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'instalments':
        return `Instalment ${payment.installment_number}`;
      case 'sem_plan':
        return `Semester ${payment.semester_number}`;
      default:
        return 'One-Shot Payment';
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm text-foreground">
          {getPaymentTypeDisplay()}
        </span>
        <PaymentStatusBadge status={payment.status} />
      </div>
      
      <div className="space-y-2 text-xs text-muted-foreground mb-3">
        <div className="flex justify-between">
          <span>Amount Payable:</span>
          <span className="text-foreground">{formatCurrency(payment.amount_payable)}</span>
        </div>
        {payment.scholarship_amount > 0 && (
          <div className="flex justify-between">
            <span>Scholarship Waiver:</span>
            <span className="text-blue-400">-{formatCurrency(payment.scholarship_amount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Due:</span>
          <span className="text-foreground">{formatDate(payment.due_date)}</span>
        </div>
        {payment.payment_date && (
          <div className="flex justify-between">
            <span>Paid:</span>
            <span className="text-foreground">{formatDate(payment.payment_date)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {payment.status === 'paid' ? (
          <Button variant="outline" size="sm" className="text-xs h-8 bg-background border-border hover:bg-muted">
            <Download className="h-3 w-3 mr-1" />
            Download Receipt
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="text-xs h-8 bg-background border-border hover:bg-muted">
            <Eye className="h-3 w-3 mr-1" />
            Upload Receipt
          </Button>
        )}
      </div>
    </div>
  );
};
