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
  selectedScholarshipId
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-600">Overall Fee</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Fee Amount:</span>
            <span>{formatCurrency(overallSummary.totalProgramFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST:</span>
            <span>{formatCurrency(overallSummary.totalGST)}</span>
          </div>
          {selectedPaymentPlan === 'one_shot' && feeStructure.one_shot_discount_percentage > 0 && (
            <div className="flex justify-between text-red-600">
              <span>One Shot Discount:</span>
              <span>- {formatCurrency(overallSummary.totalDiscount)}</span>
            </div>
          )}
          {selectedScholarshipId !== 'no_scholarship' && overallSummary.totalScholarship > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Total Scholarship Amount ({scholarships.find(s => s.id === selectedScholarshipId)?.amount_percentage || 0}%):</span>
              <span>- {formatCurrency(overallSummary.totalScholarship)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total Amount Payable:</span>
            <span>{formatCurrency(overallSummary.totalAmountPayable)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
