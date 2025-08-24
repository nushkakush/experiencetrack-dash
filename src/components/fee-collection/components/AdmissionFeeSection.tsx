import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '../utils/currencyUtils';
import { format } from 'date-fns';

interface AdmissionFeeData {
  baseAmount: number;
  gstAmount: number;
  totalPayable: number;
  paymentDate?: string;
}

interface AdmissionFeeSectionProps {
  admissionFee: AdmissionFeeData;
  editablePaymentDates: Record<string, string>;
  onPaymentDateChange: (key: string, value: string) => void;
  isReadOnly?: boolean;
}

export const AdmissionFeeSection: React.FC<AdmissionFeeSectionProps> = ({
  admissionFee,
  editablePaymentDates,
  onPaymentDateChange,
  isReadOnly = false
}) => {
  // Priority: 1. Payment engine response, 2. Editable dates, 3. Default date
  const admissionDate = admissionFee?.paymentDate || 
                       editablePaymentDates['admission'] || 
                       new Date().toISOString().split('T')[0];

  console.log('🔍 AdmissionFeeSection Debug:', {
    admissionFee,
    admissionFeePaymentDate: admissionFee?.paymentDate,
    editablePaymentDates,
    editableAdmissionDate: editablePaymentDates['admission'],
    finalAdmissionDate: admissionDate,
  });

  if (!admissionFee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Admission Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">Admission Fee</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instalment Date</TableHead>
              <TableHead>Base Amt. (₹)</TableHead>
              <TableHead>GST (18%)</TableHead>
              <TableHead>Amount Payable (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>
                {isReadOnly ? (
                  <span className="text-sm font-medium">
                    {format(new Date(admissionDate), 'MMM dd, yyyy')}
                  </span>
                ) : (
                  <Input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => onPaymentDateChange('admission', e.target.value)}
                    className="w-40"
                  />
                )}
              </TableCell>
              <TableCell>{formatCurrency(admissionFee.baseAmount)}</TableCell>
              <TableCell>{formatCurrency(admissionFee.gstAmount)}</TableCell>
              <TableCell>{formatCurrency(admissionFee.totalPayable)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Detailed breakdown */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>{formatCurrency(admissionFee.baseAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span>{formatCurrency(admissionFee.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total Amount Payable:</span>
              <span>{formatCurrency(admissionFee.totalPayable)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
