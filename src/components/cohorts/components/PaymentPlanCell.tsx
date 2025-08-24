import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { StudentPaymentPlan } from '@/services/studentPaymentPlan.service';
import PaymentPlanDialog from '../PaymentPlanDialog';

interface PaymentPlanCellProps {
  student: CohortStudent;
  hasPaymentPlan: boolean;
  paymentPlanDetails?: StudentPaymentPlan;
  customFeeStructure: boolean;
  loading: boolean;
  isFeeSetupComplete: boolean;
  onPaymentPlanUpdated: (studentId: string) => void;
}

export const PaymentPlanCell: React.FC<PaymentPlanCellProps> = ({
  student,
  hasPaymentPlan,
  paymentPlanDetails,
  customFeeStructure,
  loading,
  isFeeSetupComplete,
  onPaymentPlanUpdated,
}) => {
  const getPaymentPlanDisplayName = () => {
    if (!hasPaymentPlan || !paymentPlanDetails?.payment_plan) return '';
    
    const plan = paymentPlanDetails.payment_plan;
    const planName = 
      plan === 'one_shot' ? 'One Shot Payment' :
      plan === 'sem_wise' ? 'Semester Wise' :
      plan === 'instalment_wise' ? 'Instalment Wise' :
      plan === 'not_selected' ? 'Not Selected' : '';
    
    return customFeeStructure ? `Custom ${planName}` : planName;
  };

  return (
    <div className='space-y-3'>
      {/* Payment Plan Section */}
      <div className='flex items-center justify-between'>
        {hasPaymentPlan ? (
          <div className='min-w-0'>
            <div className='text-sm font-medium text-blue-700 dark:text-blue-300'>
              {getPaymentPlanDisplayName()}
            </div>
          </div>
        ) : (
          <div className='text-sm text-muted-foreground'>
            {!isFeeSetupComplete ? 'Fee setup required' : 'No payment plan'}
          </div>
        )}
        <PaymentPlanDialog
          student={student}
          onPaymentPlanUpdated={() => onPaymentPlanUpdated(student.id)}
        >
          <Button
            variant='ghost'
            size='sm'
            className={`h-8 w-8 p-0 hover:bg-primary/10 ${
              hasPaymentPlan
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-primary hover:text-primary/80'
            }`}
            title={
              !isFeeSetupComplete
                ? 'Complete fee setup first'
                : hasPaymentPlan
                  ? 'Edit payment plan'
                  : 'Select payment plan'
            }
            disabled={loading || !isFeeSetupComplete}
          >
            {hasPaymentPlan ? (
              <CheckCircle className='h-4 w-4' />
            ) : (
              <CreditCard className='h-4 w-4' />
            )}
          </Button>
        </PaymentPlanDialog>
      </div>
    </div>
  );
};
