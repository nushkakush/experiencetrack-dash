import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Award } from 'lucide-react';
import { PaymentPlan } from '@/types/fee';
import { PaymentBreakdown } from '@/types/payments/PaymentCalculationTypes';
import { calculateTotalScholarshipAmount } from '@/utils/scholarshipUtils';
import { useStudentData } from '../hooks/useStudentData';

export interface PaymentSummaryCardsProps {
  paymentBreakdown: PaymentBreakdown;
  selectedPaymentPlan: PaymentPlan;
}

export const PaymentSummaryCards: React.FC<PaymentSummaryCardsProps> = ({
  paymentBreakdown,
  selectedPaymentPlan
}) => {
  const { studentData } = useStudentData();
  const [scholarshipInfo, setScholarshipInfo] = useState<{
    baseScholarshipAmount: number;
    additionalDiscountAmount: number;
    totalScholarshipAmount: number;
    basePercentage: number;
    additionalPercentage: number;
    totalPercentage: number;
  } | null>(null);
  const [loadingScholarship, setLoadingScholarship] = useState(false);

  // Load comprehensive scholarship information
  useEffect(() => {
    const loadScholarshipInfo = async () => {
      if (!studentData?.id || !paymentBreakdown?.overallSummary?.totalProgramFee) {
        return;
      }

      setLoadingScholarship(true);
      try {
        const info = await calculateTotalScholarshipAmount(
          studentData.id, 
          paymentBreakdown.overallSummary.totalProgramFee
        );
        setScholarshipInfo(info);
      } catch (error) {
        console.error('Error loading scholarship info:', error);
      } finally {
        setLoadingScholarship(false);
      }
    };

    loadScholarshipInfo();
  }, [studentData?.id, paymentBreakdown?.overallSummary?.totalProgramFee]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getPaymentPlanDescription = () => {
    switch (selectedPaymentPlan) {
      case 'one_shot':
        return 'One-time payment for the entire program';
      case 'sem_wise':
        return 'Payments divided by semesters';
      case 'instalment_wise':
        return 'Payments divided into monthly installments';
      default:
        return 'Payment plan not selected';
    }
  };

  const getScholarshipAmount = () => {
    return scholarshipInfo?.totalScholarshipAmount || 0;
  };

  const getScholarshipPercentage = () => {
    if (!paymentBreakdown?.overallSummary?.totalProgramFee || !scholarshipInfo) {
      return 0;
    }
    const totalAmount = paymentBreakdown.overallSummary.totalProgramFee;
    const discountAmount = scholarshipInfo.totalScholarshipAmount;
    return Math.round((discountAmount / totalAmount) * 100);
  };

  const getScholarshipMessage = () => {
    if (loadingScholarship) return 'Calculating your scholarship...';
    
    const percentage = getScholarshipPercentage();
    if (percentage === 0) return 'Your scholarship results are still pending';
    
    // Create exciting, congratulatory messages based on scholarship percentage
    if (percentage >= 50) {
      return `🎉 Outstanding! You've earned a ${percentage}% scholarship!`;
    } else if (percentage >= 30) {
      return `🎊 Congratulations! You've earned a ${percentage}% scholarship!`;
    } else if (percentage >= 20) {
      return `🎈 Great job! You've earned a ${percentage}% scholarship!`;
    } else if (percentage >= 10) {
      return `✨ Congratulations! You've earned a ${percentage}% scholarship!`;
    } else {
      return `🎯 Well done! You've earned a ${percentage}% scholarship!`;
    }
  };

  const hasScholarship = scholarshipInfo && scholarshipInfo.totalPercentage > 0;

  return (
    <div className="space-y-4">
      {/* Enhanced Scholarship Card */}
      <Card className="border-purple-200 bg-purple-600/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {loadingScholarship ? 'Loading...' : 
                   hasScholarship ? formatCurrency(getScholarshipAmount()) : 'Pending'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getScholarshipMessage()}
                </p>
                {hasScholarship && scholarshipInfo && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Fee reduced from ₹{formatCurrency(paymentBreakdown.overallSummary?.totalProgramFee || 0)} to ₹{formatCurrency((paymentBreakdown.overallSummary?.totalProgramFee || 0) - getScholarshipAmount())} + GST
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      💡 Scholarship waiver applied from last semesters to first
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {hasScholarship ? 'Active' : 'Pending'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Payment Summary Card */}
      <Card className="border-2 border-blue-200 bg-blue-600/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">
                You are required to make a total payment of {formatCurrency(paymentBreakdown.overallSummary?.totalAmountPayable || 0)} (includes GST)
              </p>
              <p className="text-sm text-muted-foreground">
                {getPaymentPlanDescription()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
