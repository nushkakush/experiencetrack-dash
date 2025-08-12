import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  CreditCard, 
  DollarSign,
  Edit
} from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { StudentPaymentData } from '@/types/payments';

export interface PaymentOptionsSectionProps {
  selectedPaymentPlan: PaymentPlan;
  studentPayments?: StudentPaymentData[];
}

export const PaymentOptionsSection: React.FC<PaymentOptionsSectionProps> = ({
  selectedPaymentPlan,
  studentPayments
}) => {
  const getPaymentPlanColor = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sem_wise':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'instalment_wise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentPlanIcon = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return <DollarSign className="h-4 w-4" />;
      case 'sem_wise':
        return <Building2 className="h-4 w-4" />;
      case 'instalment_wise':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentPlanLabel = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'One Shot';
      case 'sem_wise':
        return 'Semester Plan';
      case 'instalment_wise':
        return 'Installment Plan';
      default:
        return 'Not Selected';
    }
  };

  const hasMadePayments = studentPayments?.some((payment: StudentPaymentData) => 
    payment.amount_paid > 0 || payment.status === 'paid' || payment.status === 'complete'
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LIT School Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            LIT School Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Account Holder</p>
            <p className="font-medium">Disruptive Edu Private Limited</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bank Name</p>
            <p className="font-medium">HDFC Bank Limited</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Number</p>
            <p className="font-medium">50200082405270</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Branch & IFSC</p>
            <p className="font-medium">Sadashivanagar & HDFC0001079</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${getPaymentPlanColor()}`}>
              {getPaymentPlanIcon()}
              <span className="font-medium">
                {getPaymentPlanLabel()}
              </span>
            </div>
            {/* Check if student has made any payments */}
            {hasMadePayments ? (
              <Badge variant="secondary" className="text-xs">
                Locked
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => {
                  // Navigate back to payment plan selection
                  window.location.reload(); // Simple approach for now
                }}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
