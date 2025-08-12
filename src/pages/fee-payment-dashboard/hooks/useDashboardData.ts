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
      const studentsResult = await studentPaymentsService.getStudentPaymentSummary(cohortId!);
      if (studentsResult.success && studentsResult.data) {
        setStudents(studentsResult.data);
      } else {
        setStudents([]);
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
    loadData
  };
};
