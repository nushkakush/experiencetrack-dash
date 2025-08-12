import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scholarship } from '@/types/fee';
import { formatCurrency } from '../utils/currencyUtils';
import { format } from 'date-fns';

interface OneShotPaymentData {
  baseAmount: number;
  gstAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  amountPayable: number;
}

interface OneShotPaymentSectionProps {
  oneShotPayment: OneShotPaymentData;
  scholarships: Scholarship[];
  selectedScholarshipId: string;
  cohortStartDate: string;
  editablePaymentDates: Record<string, string>;
  onPaymentDateChange: (key: string, value: string) => void;
  isReadOnly?: boolean;
}

export const OneShotPaymentSection: React.FC<OneShotPaymentSectionProps> = ({
  oneShotPayment,
  scholarships,
  selectedScholarshipId,
  cohortStartDate,
  editablePaymentDates,
  onPaymentDateChange,
  isReadOnly = false
}) => {
  if (!oneShotPayment) return null;
  
  const selectedScholarship = selectedScholarshipId === 'no_scholarship' 
    ? null 
    : scholarships.find(s => s.id === selectedScholarshipId);

  const oneShotDate = editablePaymentDates['one-shot'] || cohortStartDate;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-purple-600">One Shot Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Date</TableHead>
              <TableHead>Base Amt. (₹)</TableHead>
              <TableHead>GST (18%)</TableHead>
              <TableHead>One Shot Discount</TableHead>
              <TableHead>Scholarship Amt. (₹)</TableHead>
              <TableHead>Amt. Payable (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                {isReadOnly ? (
                  <span className="text-sm font-medium">
                    {format(new Date(oneShotDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Input
                    type="date"
                    value={oneShotDate}
                    onChange={(e) => onPaymentDateChange('one-shot', e.target.value)}
                    className="w-40"
                  />
                )}
              </TableCell>
              <TableCell>{formatCurrency(oneShotPayment.baseAmount)}</TableCell>
              <TableCell>{formatCurrency(oneShotPayment.gstAmount)}</TableCell>
              <TableCell className="text-red-600">
                - {formatCurrency(oneShotPayment.discountAmount)}
              </TableCell>
              <TableCell>
                {oneShotPayment.scholarshipAmount > 0 ? formatCurrency(oneShotPayment.scholarshipAmount) : '--'}
              </TableCell>
              <TableCell>{formatCurrency(oneShotPayment.amountPayable)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
