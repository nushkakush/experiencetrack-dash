import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StudentPaymentSummary } from '@/types/fee';
import { getScholarshipPercentageForDisplay } from '@/utils/scholarshipUtils';

interface FinancialSummaryProps {
  student: StudentPaymentSummary;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ student }) => {
  const [scholarshipPercentage, setScholarshipPercentage] = useState<number>(0);

  useEffect(() => {
    const fetchScholarshipPercentage = async () => {
      if (student.scholarship_id) {
        const percentage = await getScholarshipPercentageForDisplay(student.scholarship_id);
        setScholarshipPercentage(percentage);
      }
    };

    fetchScholarshipPercentage();
  }, [student.scholarship_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentPlanDisplay = () => {
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return 'Not Selected';
    }
    
    switch (student.payment_plan) {
      case 'one_shot':
        return 'One-Shot Payment';
      case 'sem_wise':
        return 'Semester-wise Payment';
      case 'instalment_wise':
        return 'Installment-wise Payment';
      default:
        return student.payment_plan;
    }
  };

  const getPaymentProgress = () => {
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      return null;
    }

    const paidInstallments = student.payments?.filter(p => 
      p.status === 'paid' || p.status === 'complete'
    ).length || 0;

    const totalInstallments = student.payments?.length || 0;

    if (totalInstallments === 0) return null;

    return { 
      paidInstallments, 
      totalInstallments, 
      percentage: Math.round((paidInstallments / totalInstallments) * 100) 
    };
  };

  return (
    <>
      <div>
        <h4 className="font-semibold mb-4 text-foreground">Financial Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span className="font-medium text-foreground">{formatCurrency(student.total_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Paid Amount:</span>
            <span className="font-medium text-green-400">{formatCurrency(student.paid_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Plan:</span>
            <span className="font-medium text-blue-400">{getPaymentPlanDisplay()}</span>
          </div>
          {student.scholarship_name && scholarshipPercentage > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scholarship:</span>
              <span className="font-medium text-blue-400">
                {student.scholarship_name} ({scholarshipPercentage}%)
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Token Fee:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">₹25,000</span>
              {student.token_fee_paid ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Paid</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground border-border text-xs">Pending</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          {getPaymentProgress() ? (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">{formatCurrency(student.paid_amount)} / {formatCurrency(student.total_amount)}</span>
                <span className="text-foreground">{getPaymentProgress()?.percentage}%</span>
              </div>
              <Progress value={getPaymentProgress()?.percentage || 0} className="h-2 bg-muted" />
              <div className="text-xs text-muted-foreground mt-1">
                {getPaymentProgress()?.paidInstallments} of {getPaymentProgress()?.totalInstallments} installments paid
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Payment plan not selected</p>
              <p className="text-xs text-muted-foreground">Student needs to choose a payment plan</p>
            </div>
          )}
        </div>
      </div>
      <Separator className="bg-border" />
    </>
  );
};
