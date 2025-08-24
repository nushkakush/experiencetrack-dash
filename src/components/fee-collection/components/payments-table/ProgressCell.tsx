import React, { useState, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/formatCurrency';
import type { StudentPaymentSummary } from '@/types/fee';
import { ProgressCalculator, ProgressCalculationResult } from '@/utils/progressCalculation';

interface ProgressCellProps {
  student: StudentPaymentSummary;
  feeStructure?: {
    total_program_fee: number;
    admission_fee: number;
    number_of_semesters: number;
    instalments_per_semester: number;
    one_shot_discount_percentage: number;
    one_shot_dates?: Record<string, string>;
    sem_wise_dates?: Record<string, string | Record<string, unknown>>;
    instalment_wise_dates?: Record<string, string | Record<string, unknown>>;
  };
}

export const ProgressCell: React.FC<ProgressCellProps> = ({ student, feeStructure }) => {
  const [progressData, setProgressData] = useState<ProgressCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateProgress = async () => {
      try {
        setLoading(true);
        const result = await ProgressCalculator.getProgress(student, feeStructure);
        setProgressData(result);
        
        // Debug logging
        console.log('🔍 [ProgressCell] Progress calculation result:', {
          student_id: student.student_id,
          calculation_method: result.calculationMethod,
          total_amount: result.totalAmount,
          paid_amount: result.paidAmount,
          progress_percentage: result.progressPercentage,
        });
      } catch (error) {
        console.error('Error calculating progress:', error);
        // Fallback to database calculation
        const fallback = ProgressCalculator.calculateWithDatabase(student);
        setProgressData(fallback);
      } finally {
        setLoading(false);
      }
    };

    calculateProgress();
  }, [student, feeStructure]);

  if (loading) {
    return (
      <TableCell>
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="w-24 h-2 bg-muted rounded animate-pulse" />
          <span className="text-xs text-muted-foreground">--</span>
        </div>
      </TableCell>
    );
  }

  if (!progressData || progressData.totalAmount === 0) {
    return (
      <TableCell>
        <span className="text-xs text-muted-foreground">--</span>
      </TableCell>
    );
  }

  // Debug log to verify our changes are being rendered
  console.log('🚀 [ProgressCell] Rendering with amounts:', {
    paid: progressData.paidAmount,
    total: progressData.totalAmount,
    percentage: progressData.progressPercentage
  });

  return (
    <TableCell>
      <div className="flex flex-col gap-2 min-w-[140px]">
        <div className="flex items-center gap-3">
          <Progress value={progressData.progressPercentage} className="w-24" />
          <span className="text-xs text-muted-foreground">{progressData.progressPercentage}%</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatCurrency(progressData.paidAmount)} / {formatCurrency(progressData.totalAmount)}
        </div>
      </div>
    </TableCell>
  );
};