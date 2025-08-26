import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Scholarship } from '@/types/fee';
import { formatCurrency } from '../utils/currencyUtils';
import { format } from 'date-fns';

interface OneShotPaymentData {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  baseDiscountAmount?: number; // Base one-shot discount only
  additionalDiscountAmount?: number; // Additional discount only
  scholarshipAmount: number;
  amountPayable: number;
  paymentDate?: string;
}

interface OneShotPaymentSectionProps {
  oneShotPayment: OneShotPaymentData;
  scholarships: Scholarship[];
  selectedScholarshipId: string;
  editablePaymentDates: Record<string, string>;
  onPaymentDateChange: (key: string, value: string) => void;
  isReadOnly?: boolean;
}

export const OneShotPaymentSection: React.FC<OneShotPaymentSectionProps> = ({
  oneShotPayment,
  scholarships,
  selectedScholarshipId,
  editablePaymentDates,
  onPaymentDateChange,
  isReadOnly = false,
}) => {
  if (!oneShotPayment) return null;

  const selectedScholarship =
    selectedScholarshipId === 'no_scholarship'
      ? null
      : scholarships.find(s => s.id === selectedScholarshipId);

  const oneShotDate = isReadOnly
    ? oneShotPayment?.paymentDate || new Date().toISOString().split('T')[0]
    : Object.prototype.hasOwnProperty.call(editablePaymentDates, 'one-shot')
      ? editablePaymentDates['one-shot']
      : new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-purple-600'>One Shot Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Date</TableHead>
              <TableHead>Base Amt. (₹)</TableHead>
              <TableHead>One Shot Discount</TableHead>
              <TableHead>Scholarship Amt. (₹)</TableHead>
              <TableHead>GST (18%)</TableHead>
              <TableHead>Amt. Payable (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                {isReadOnly ? (
                  <span className='text-sm font-medium'>
                    {format(new Date(oneShotDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Input
                    type='date'
                    value={oneShotDate}
                    onChange={e =>
                      onPaymentDateChange('one-shot', e.target.value)
                    }
                    className='w-40'
                  />
                )}
              </TableCell>
              <TableCell>{formatCurrency(oneShotPayment.baseAmount)}</TableCell>
              <TableCell className='text-red-600'>
                - {formatCurrency(oneShotPayment.baseDiscountAmount || 0)}
              </TableCell>
              <TableCell className='text-red-600'>
                {oneShotPayment.scholarshipAmount > 0
                  ? `- ${formatCurrency(oneShotPayment.scholarshipAmount)}`
                  : '--'}
              </TableCell>
              <TableCell>{formatCurrency(oneShotPayment.gstAmount)}</TableCell>
              <TableCell>
                {formatCurrency(oneShotPayment.amountPayable)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
