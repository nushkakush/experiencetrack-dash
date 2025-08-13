import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface SemesterTableProps {
  semester: {
    semesterNumber: number;
    baseAmount: number;
    scholarshipAmount: number;
    discountAmount: number;
    gstAmount: number;
    totalPayable: number;
    instalments: Array<{
      installmentNumber: number;
      dueDate: string;
      amount: number;
      status: string;
      amountPaid: number;
      amountPending: number;
      semesterNumber: number;
      baseAmount: number;
      scholarshipAmount: number;
      discountAmount: number;
      gstAmount: number;
      amountPayable: number;
      totalPayable: number;
      paymentDate: string | null;
    }>;
  };
}

export const SemesterTable: React.FC<SemesterTableProps> = ({ semester }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Instalment Date</TableHead>
              <TableHead>Scholarship Amt. (₹)</TableHead>
              <TableHead>Base Amt. (₹)</TableHead>
              <TableHead>GST (18%)</TableHead>
              <TableHead>Amt. Payable (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semester.instalments.map((installment, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span className="text-sm font-medium">
                    {formatDate(installment.dueDate)}
                  </span>
                </TableCell>
                <TableCell>
                  {installment.scholarshipAmount > 0 ? formatCurrency(installment.scholarshipAmount) : '--'}
                </TableCell>
                <TableCell>{formatCurrency(installment.baseAmount)}</TableCell>
                <TableCell>{formatCurrency(installment.gstAmount)}</TableCell>
                <TableCell>{formatCurrency(installment.amountPayable)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold bg-muted/50">
              <TableCell>Total</TableCell>
              <TableCell>
                {semester.scholarshipAmount > 0 ? formatCurrency(semester.scholarshipAmount) : '₹0.00'}
              </TableCell>
              <TableCell>{formatCurrency(semester.baseAmount)}</TableCell>
              <TableCell>{formatCurrency(semester.gstAmount)}</TableCell>
              <TableCell>{formatCurrency(semester.totalPayable)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        {/* Semester summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Instalment Amount:</span>
              <span>{formatCurrency(semester.baseAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span>{formatCurrency(semester.gstAmount)}</span>
            </div>
            {semester.scholarshipAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Scholarship Amount (10%):</span>
                <span>- {formatCurrency(semester.scholarshipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total Amount Payable:</span>
              <span>{formatCurrency(semester.totalPayable)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
