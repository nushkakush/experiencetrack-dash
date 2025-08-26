import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeeStructure, Scholarship } from '@/types/fee';
import { formatCurrency } from '../utils/currencyUtils';

interface OverallSummaryData {
  totalProgramFee: number;
  totalGST: number;
  totalDiscount: number;
  totalScholarship: number;
  totalAmountPayable: number;
  admissionFee?: number;
}

interface OverallSummaryProps {
  overallSummary: OverallSummaryData;
  feeStructure: FeeStructure;
  selectedPaymentPlan: string;
  scholarships: Scholarship[];
  selectedScholarshipId: string;
}

export const OverallSummary: React.FC<OverallSummaryProps> = ({
  overallSummary,
  feeStructure,
  selectedPaymentPlan,
  scholarships,
  selectedScholarshipId,
}) => {
  if (!overallSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-orange-600'>Overall Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='h-24 bg-muted rounded animate-pulse' />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-orange-600'>Overall Fee</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <div className='flex justify-between'>
            <span>Total Fee Amount:</span>
            <span>{formatCurrency(overallSummary.totalProgramFee)}</span>
          </div>
          {selectedPaymentPlan === 'one_shot' &&
            feeStructure.one_shot_discount_percentage > 0 && (
              <div className='flex justify-between text-red-600'>
                <span>One Shot Discount:</span>
                <span>- {formatCurrency(overallSummary.totalDiscount)}</span>
              </div>
            )}
          {selectedScholarshipId !== 'no_scholarship' &&
            overallSummary.totalScholarship > 0 && (
              <div className='flex justify-between text-red-600'>
                <span>
                  Total Scholarship Amount (
                  {Math.round(
                    (overallSummary.totalScholarship /
                      overallSummary.totalProgramFee) *
                      100
                  )}
                  %):
                </span>
                <span>- {formatCurrency(overallSummary.totalScholarship)}</span>
              </div>
            )}
          <div className='flex justify-between'>
            <span>GST:</span>
            <span>{formatCurrency(overallSummary.totalGST)}</span>
          </div>
          <div className='flex justify-between font-bold text-lg border-t pt-2'>
            <span>Total Fees:</span>
            <span>
              {formatCurrency(
                overallSummary.totalProgramFee -
                  overallSummary.totalDiscount -
                  overallSummary.totalScholarship +
                  overallSummary.totalGST
              )}
            </span>
          </div>
          {overallSummary.admissionFee && overallSummary.admissionFee > 0 && (
            <div className='flex justify-between text-red-600'>
              <span>Admission Fee (including GST):</span>
              <span>- {formatCurrency(overallSummary.admissionFee)}</span>
            </div>
          )}
          <div className='flex justify-between font-bold text-lg border-t pt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded'>
            <span className='text-foreground'>Total Amount Payable:</span>
            <span className='text-foreground'>
              {formatCurrency(
                Math.max(
                  0,
                  overallSummary.totalProgramFee -
                    overallSummary.totalDiscount -
                    overallSummary.totalScholarship +
                    overallSummary.totalGST -
                    (overallSummary.admissionFee || 0)
                )
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
