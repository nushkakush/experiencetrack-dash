import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { cohortsService } from '@/services/cohorts.service';
import { studentPaymentsService } from '@/services/studentPayments.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { CohortStudent, Cohort } from '@/types/cohort';
import { logger } from '@/lib/logging/Logger';

import { CohortScholarshipRow, StudentPaymentRow } from '@/types/payments/DatabaseAlignedTypes';

interface StudentData {
  studentData: CohortStudent | null;
  cohortData: Cohort | null;
  feeStructure: any | null;
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
  const [cohortData, setCohortData] = useState<Cohort | null>(null);
  const [feeStructure, setFeeStructure] = useState<any | null>(null);
  const [scholarships, setScholarships] = useState<CohortScholarshipRow[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentPaymentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use localStorage to persist data loaded state across component re-mounts
  const getDataLoadedKey = (userId: string) => `studentDataLoaded_${userId}`;
  const getLastProfileIdKey = (userId: string) => `lastProfileId_${userId}`;
  
  const dataLoadedRef = React.useRef(false);
  const lastProfileIdRef = React.useRef<string | null>(null);
  
  // Initialize from localStorage (only once when profile changes)
  React.useEffect(() => {
    if (profile?.user_id) {
      const dataLoadedKey = getDataLoadedKey(profile.user_id);
      const lastProfileIdKey = getLastProfileIdKey(profile.user_id);
      
      const storedDataLoaded = localStorage.getItem(dataLoadedKey);
      const storedLastProfileId = localStorage.getItem(lastProfileIdKey);
      
      // Only restore dataLoaded if we actually have data in state
      const hasDataInState = !!studentData && !!cohortData;
      
      dataLoadedRef.current = storedDataLoaded === 'true' && hasDataInState;
      lastProfileIdRef.current = storedLastProfileId;
      
      console.log('🔄 [DEBUG] Initialized from localStorage:', {
        dataLoaded: dataLoadedRef.current,
        lastProfileId: lastProfileIdRef.current,
        userId: profile.user_id,
        hasDataInState,
        storedDataLoaded: storedDataLoaded === 'true'
      });
    }
  }, [profile?.user_id]); // Remove studentData and cohortData dependencies

  const loadStudentData = React.useCallback(async () => {
    console.log('🔄 [DEBUG] loadStudentData called');
    
    // Check if data is already loaded
    if (dataLoadedRef.current) {
      console.log('🔄 [DEBUG] Data already loaded, skipping');
      return;
    }
    
    // Prevent multiple simultaneous loads by checking if already loading
    setLoading(prevLoading => {
      if (prevLoading) {
        console.log('🔄 [DEBUG] Already loading, skipping');
        return prevLoading; // Don't change loading state if already loading
      }
      console.log('🔄 [DEBUG] Starting to load student data');
      return true;
    });
    
    setError(null);
    // Don't reset the data loaded flag here - it should only be set to true when data is successfully loaded
    
    try {
      if (!profile?.user_id) {
        throw new Error('No user profile available');
      }

      logger.info('Loading student data for user:', { userId: profile.user_id });

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
            logger.info(`No student data found, retrying in ${(retryCount + 1) * 2} seconds...`, { retryCount });
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          }
        } catch (err) {
          logger.warn(`Attempt ${retryCount + 1} failed:`, { error: err });
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
      logger.info('Student data loaded:', { student });
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
      setScholarships(scholarshipData as CohortScholarshipRow[]);

      // Get student payment record for this specific student
      const paymentsResult = await studentPaymentsService.getStudentPaymentByStudentId(student.id, student.cohort_id);
      if (paymentsResult.success) {
        setStudentPayments(paymentsResult.data || []);
      } else {
        logger.error('Failed to load student payments:', { error: paymentsResult.error });
      }

      dataLoadedRef.current = true;
      if (profile?.user_id) {
        const dataLoadedKey = getDataLoadedKey(profile.user_id);
        localStorage.setItem(dataLoadedKey, 'true');
      }
      console.log('🔄 [DEBUG] Data loaded flag set to true and saved to localStorage');
    } catch (err) {
      logger.error('Error loading student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]); // Remove loading dependency to prevent circular dependency

  useEffect(() => {
    // Only load data if we have a profile and haven't loaded data yet
    // Don't reload when route changes, only when auth state changes
    console.log('🔄 [DEBUG] useStudentData useEffect triggered', {
      hasProfile: !!profile?.user_id,
      authLoading,
      profileLoading,
      dataLoaded: dataLoadedRef.current,
      lastProfileId: lastProfileIdRef.current,
      currentProfileId: profile?.user_id
    });
    
    // Check if profile ID has changed
    const profileIdChanged = profile?.user_id !== lastProfileIdRef.current;
    
    // Check if this is a fresh page load (no data in state)
    const isFreshPageLoad = !studentData && !cohortData;
    
    // Check if we should load data
    const shouldLoadData = profile?.user_id && 
                          !authLoading && 
                          !profileLoading && 
                          !dataLoadedRef.current && 
                          (profileIdChanged || isFreshPageLoad);
    
    if (shouldLoadData) {
      console.log('🔄 [DEBUG] Loading student data...', {
        reason: profileIdChanged ? 'profile changed' : 'fresh page load',
        dataLoadedRef: dataLoadedRef.current,
        hasStudentData: !!studentData,
        hasCohortData: !!cohortData
      });
      lastProfileIdRef.current = profile.user_id;
      if (profile?.user_id) {
        const lastProfileIdKey = getLastProfileIdKey(profile.user_id);
        localStorage.setItem(lastProfileIdKey, profile.user_id);
      }
      loadStudentData();
    } else {
      console.log('🔄 [DEBUG] Skipping student data load', {
        reason: !profile?.user_id ? 'no profile' : 
                authLoading ? 'auth loading' : 
                profileLoading ? 'profile loading' : 
                dataLoadedRef.current ? 'already loaded' : 
                !profileIdChanged && !isFreshPageLoad ? 'profile not changed and not fresh load' :
                'unknown'
      });
    }
  }, [profile?.user_id, authLoading, profileLoading]); // Simplified dependencies

  return {
    studentData,
    cohortData,
    feeStructure,
    scholarships,
    studentPayments,
    loading,
    error,
    refetch: () => {
      console.log('🔄 [DEBUG] Refetching student data after payment submission');
      return loadStudentData();
    }
  };
};
