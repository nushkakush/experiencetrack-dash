import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { cohortsService } from '@/services/cohorts.service';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { CohortStudent } from '@/types/cohort';
import { logger } from '@/lib/logging/Logger';

import { CohortRow, FeeStructureRow, CohortScholarshipRow, StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';

interface StudentData {
  studentData: CohortStudent | null;
  cohortData: CohortRow | null;
  feeStructure: FeeStructureRow | null;
  scholarships: CohortScholarshipRow[];
  studentPayments: StudentPaymentRow[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudentData = (): StudentData => {
  const { profile, user, session, loading: authLoading, profileLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<CohortStudent | null>(null);
  const [cohortData, setCohortData] = useState<CohortRow | null>(null);
  const [feeStructure, setFeeStructure] = useState<FeeStructureRow | null>(null);
  const [scholarships, setScholarships] = useState<CohortScholarshipRow[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentPaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if data has been loaded to prevent duplicate loads
  const dataLoadedRef = React.useRef(false);

  const loadStudentData = async () => {
    // Prevent multiple simultaneous loads
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!profile?.user_id) {
        throw new Error('No user profile available');
      }

      logger.info('Loading student data for user:', profile.user_id);

      // Get student data with retry logic
      let studentResult;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          studentResult = await cohortStudentsService.getByUserId(profile.user_id);
          if (studentResult.success && studentResult.data) {
            break; // Success, exit retry loop
          }
          
          // If no data found, wait a bit and retry (for newly created users)
          if (retryCount < maxRetries - 1) {
            logger.info(`No student data found, retrying in ${(retryCount + 1) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          }
        } catch (err) {
          logger.warn(`Attempt ${retryCount + 1} failed:`, err);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          }
        }
        retryCount++;
      }

      if (!studentResult?.success || !studentResult?.data) {
        logger.error('Failed to load student data after retries');
        throw new Error('Student data not found. Please ensure you have accepted your invitation and try again.');
      }

      const student = studentResult.data;
      logger.info('Student data loaded:', student);
      setStudentData(student);

      // Get cohort data using the correct service and method
      const cohortResult = await cohortsService.getById(student.cohort_id);
      if (!cohortResult.success || !cohortResult.data) {
        throw new Error('Failed to load cohort data');
      }

      setCohortData(cohortResult.data);

      // Get fee structure
      const { feeStructure: feeData, scholarships: scholarshipData } = 
        await FeeStructureService.getCompleteFeeStructure(student.cohort_id);
      
      setFeeStructure(feeData);
      setScholarships(scholarshipData);

      // Get student payments
      const paymentsResult = await studentPaymentsService.getStudentPayments(student.cohort_id);
      if (paymentsResult.success) {
        setStudentPayments(paymentsResult.data);
      }

      dataLoadedRef.current = true;
    } catch (err) {
      logger.error('Error loading student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load data if we have a profile and haven't loaded data yet
    // Don't reload when route changes, only when auth state changes
    if (profile?.user_id && !studentData && !loading && !authLoading && !profileLoading && !dataLoadedRef.current) {
      loadStudentData();
    }
  }, [profile?.user_id, authLoading, profileLoading]); // Remove location dependency to prevent reloads

  return {
    studentData,
    cohortData,
    feeStructure,
    scholarships,
    studentPayments,
    loading,
    error,
    refetch: loadStudentData
  };
};
