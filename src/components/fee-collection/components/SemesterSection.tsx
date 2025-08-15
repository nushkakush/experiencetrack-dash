import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scholarship } from '@/types/fee';
import { formatCurrency } from '../utils/currencyUtils';
import { format } from 'date-fns';

interface SemesterInstalment {
  paymentDate: string;
  scholarshipAmount: number;
  baseAmount: number;
  gstAmount: number;
  amountPayable: number;
}

interface SemesterTotal {
  scholarshipAmount: number;
  baseAmount: number;
  gstAmount: number;
  totalPayable: number;
}

interface SemesterData {
  semesterNumber: number;
  instalments: SemesterInstalment[];
  total: SemesterTotal;
}

interface SemesterSectionProps {
  semester: SemesterData;
  scholarships: Scholarship[];
  selectedScholarshipId: string;
  editablePaymentDates: Record<string, string>;
  onPaymentDateChange: (key: string, value: string) => void;
  isReadOnly?: boolean;
}

export const SemesterSection: React.FC<SemesterSectionProps> = ({
  semester,
  scholarships,
  selectedScholarshipId,
  editablePaymentDates,
  onPaymentDateChange,
  isReadOnly = false
}) => {
  return (
    <Card key={semester.semesterNumber}>
      <CardHeader>
        <CardTitle className="text-blue-600">Semester {String(semester.semesterNumber).padStart(2, '0')}</CardTitle>
      </CardHeader>
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
            {semester.instalments.map((instalment: SemesterInstalment, index: number) => {
              const dateKey = `semester-${semester.semesterNumber}-instalment-${index}`;
              const currentDate = editablePaymentDates[dateKey] || instalment.paymentDate;
              const scholarshipPercentage = instalment.scholarshipAmount > 0 
                ? selectedScholarshipId !== 'no_scholarship' 
                  ? scholarships.find(s => s.id === selectedScholarshipId)?.amount_percentage || 0
                  : 0
                : 0;
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    {isReadOnly ? (
                      <span className="text-sm font-medium">
                        {format(new Date(currentDate), 'MMM dd, yyyy')}
                      </span>
                    ) : (
                      <Input
                        type="date"
                        value={currentDate}
                        onChange={(e) => onPaymentDateChange(dateKey, e.target.value)}
                        className="w-40"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {instalment.scholarshipAmount > 0 ? formatCurrency(instalment.scholarshipAmount) : '--'}
                  </TableCell>
                  <TableCell>{formatCurrency(instalment.baseAmount)}</TableCell>
                  <TableCell>{formatCurrency(instalment.gstAmount)}</TableCell>
                  <TableCell>{formatCurrency(instalment.amountPayable)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Semester summary */}
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Instalment Amount:</span>
              <span>{formatCurrency(semester.total.baseAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span>{formatCurrency(semester.total.gstAmount)}</span>
            </div>
            {semester.total.scholarshipAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Scholarship Amount ({selectedScholarshipId !== 'no_scholarship' ? scholarships.find(s => s.id === selectedScholarshipId)?.amount_percentage || 0 : 0}%):</span>
                <span>- {formatCurrency(semester.total.scholarshipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>Total Amount Payable:</span>
              <span>{formatCurrency(semester.total.totalPayable)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
