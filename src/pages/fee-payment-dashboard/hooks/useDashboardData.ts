import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { cohortsService } from '@/services/cohorts.service';
import { StudentPaymentSummary } from '@/types/fee';
import { CohortWithCounts } from '@/types/cohort';

interface UseDashboardDataProps {
  cohortId: string | undefined;
}

export const useDashboardData = ({ cohortId }: UseDashboardDataProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cohortData, setCohortData] = useState<CohortWithCounts | null>(null);
  const [students, setStudents] = useState<StudentPaymentSummary[]>([]);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    if (cohortId) {
      loadData();
    }
  }, [cohortId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load cohort data
      const cohortResult = await cohortsService.getByIdWithCounts(cohortId!);
      if (cohortResult.success && cohortResult.data) {
        setCohortData(cohortResult.data);
      }

      // Load fee structure
      const { feeStructure: feeData, scholarships: scholarshipData } =
        await FeeStructureService.getCompleteFeeStructure(cohortId!);

      setFeeStructure(feeData);
      setScholarships(scholarshipData);

      // Load student payment summaries
      const studentsResult =
        await studentPaymentsService.getStudentPaymentSummary(cohortId!);
      console.log('🔍 [useDashboardData] Students result:', {
        success: studentsResult.success,
        hasData: !!studentsResult.data,
        dataLength: studentsResult.data?.length,
        hasStatistics: !!(studentsResult as any).statistics,
        statistics: (studentsResult as any).statistics,
      });

      if (studentsResult.success && studentsResult.data) {
        setStudents(studentsResult.data);
        // Set statistics if available from batch response
        if ((studentsResult as any).statistics) {
          const stats = (studentsResult as any).statistics;
          console.log('🔍 [useDashboardData] Setting statistics:', {
            averageScholarshipPercentage: stats.averageScholarshipPercentage,
            totalPayable: stats.totalPayable,
            totalCollected: stats.totalCollected,
            collectionRate: stats.collectionRate,
            cohortProgress: stats.cohortProgress,
            dueThisMonth: stats.dueThisMonth,
            overdue: stats.overdue,
            thisMonthCollected: stats.thisMonthCollected,
          });
          setStatistics(stats);
        } else {
          console.log('⚠️ [useDashboardData] No statistics found in response');
        }
      } else {
        setStudents([]);
        setStatistics(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    cohortData,
    students,
    feeStructure,
    scholarships,
    statistics,
    loadData,
  };
};
