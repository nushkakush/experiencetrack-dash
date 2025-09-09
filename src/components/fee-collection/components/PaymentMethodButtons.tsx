import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Building2,
  FileText,
  QrCode,
  IndianRupee,
} from 'lucide-react';

export interface PaymentMethodButtonsProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
  availableMethods: string[];
}

export const PaymentMethodButtons: React.FC<PaymentMethodButtonsProps> = ({
  selectedMethod,
  onMethodSelect,
  availableMethods,
}) => {
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <IndianRupee className='h-5 w-5' />;
      case 'bank_transfer':
        return <Building2 className='h-5 w-5' />;
      case 'cheque':
        return <FileText className='h-5 w-5' />;
      case 'dd':
        return <Building2 className='h-5 w-5' />;
      case 'scan_to_pay':
        return <QrCode className='h-5 w-5' />;
      case 'razorpay':
        return <CreditCard className='h-5 w-5' />;
      default:
        return <CreditCard className='h-5 w-5' />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cheque':
        return 'Cheque';
      case 'dd':
        return 'Demand Draft';
      case 'scan_to_pay':
        return 'Scan to Pay';
      case 'razorpay':
        return 'Online Payment';
      default:
        return method;
    }
  };

  return (
    <div className='space-y-4'>
      <Label className='text-left block'>Select Payment Method *</Label>
      {availableMethods.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {availableMethods.map(method => (
            <Button
              key={method}
              variant={selectedMethod === method ? 'default' : 'outline'}
              className='h-auto p-4 flex flex-col items-center gap-2'
              onClick={() => onMethodSelect(method)}
            >
              {getPaymentMethodIcon(method)}
              <span>{getPaymentMethodLabel(method)}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className='text-center py-4 text-muted-foreground'>
          No payment methods available. Please contact support.
        </div>
      )}
    </div>
  );
};
