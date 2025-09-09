import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, IndianRupee } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { InstallmentItem } from './InstallmentItem';

interface SemesterInstalment {
  paymentDate: string;
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  amountPayable: number;
}

interface SemesterTotal {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  totalPayable: number;
}

interface SemesterData {
  semesterNumber: number;
  instalments: SemesterInstalment[];
  total: SemesterTotal;
}

interface SemesterCardProps {
  semester: SemesterData;
  selectedPaymentPlan: PaymentPlan;
  isExpanded: boolean;
  onToggleExpansion: (semesterNumber: number) => void;
  onPayNow?: (installment: SemesterInstalment) => void;
}

export const SemesterCard: React.FC<SemesterCardProps> = ({
  semester,
  selectedPaymentPlan,
  isExpanded,
  onToggleExpansion,
  onPayNow,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getSemesterTitle = () => {
    return selectedPaymentPlan === 'one_shot'
      ? 'Program Fee'
      : `Semester ${semester.semesterNumber}`;
  };

  const getPaymentTypeBadge = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'Full Payment';
      case 'sem_wise':
        return 'Semester Payment';
      case 'instalment_wise':
        return `${semester.instalments.length} Installments`;
      default:
        return 'Payment';
    }
  };

  const getPaymentTypeDescription = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'One-time payment';
      case 'sem_wise':
        return 'Due at semester start';
      case 'instalment_wise':
        return 'Monthly installments';
      default:
        return 'Payment';
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <IndianRupee className='h-5 w-5' />
            {getSemesterTitle()}
          </CardTitle>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onToggleExpansion(semester.semesterNumber)}
          >
            {isExpanded ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4'>
          <div>
            <p className='text-sm text-muted-foreground'>Base Amount</p>
            <p className='text-lg font-semibold'>
              {formatCurrency(semester.total.baseAmount)}
            </p>
          </div>
          {semester.total.discountAmount > 0 && (
            <div>
              <p className='text-sm text-muted-foreground'>Discount</p>
              <p className='text-lg font-semibold text-green-600'>
                -{formatCurrency(semester.total.discountAmount)}
              </p>
            </div>
          )}
          <div>
            <p className='text-sm text-muted-foreground'>GST</p>
            <p className='text-lg font-semibold'>
              {formatCurrency(semester.total.gstAmount)}
            </p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Total Payable</p>
            <p className='text-lg font-semibold text-green-600'>
              {formatCurrency(semester.total.totalPayable)}
            </p>
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <Badge variant='outline' className='w-fit'>
            {getPaymentTypeBadge()}
          </Badge>
          <div className='text-sm text-muted-foreground'>
            {getPaymentTypeDescription()}
          </div>
        </div>
      </CardContent>

      {isExpanded && (
        <div className='space-y-4 mt-4'>
          {semester.instalments.map(
            (installment: SemesterInstalment, index: number) => (
              <InstallmentItem
                key={index}
                installment={installment}
                index={index}
                semesterNumber={semester.semesterNumber}
                selectedPaymentPlan={selectedPaymentPlan}
                onPayNow={onPayNow}
              />
            )
          )}
        </div>
      )}
    </Card>
  );
};
