import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';

interface RazorpayFieldsProps {
  onRazorpayPayment: () => void;
}

export const RazorpayFields: React.FC<RazorpayFieldsProps> = ({
  onRazorpayPayment
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50">
        <h4 className="font-semibold mb-2">Razorpay Payment</h4>
        <p className="text-sm text-muted-foreground mb-4">
          You will be redirected to Razorpay's secure payment gateway to complete your transaction.
        </p>
        <Button 
          onClick={onRazorpayPayment}
          className="w-full"
          size="lg"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Make Payment via Razorpay
        </Button>
      </div>
    </div>
  );
};
