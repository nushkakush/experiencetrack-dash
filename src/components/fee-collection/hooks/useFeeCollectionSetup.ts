import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FeeStructureService } from '@/services/feeStructure.service';
import { PaymentScheduleOverrides } from '@/services/payments/PaymentScheduleOverrides';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Scholarship } from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Logger } from '@/lib/logging/Logger';

interface UseFeeCollectionSetupProps {
  cohortId: string;
  onComplete?: () => void;
}

interface FeeStructureData {
  admission_fee: number;
  total_program_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
}

export const useFeeCollectionSetup = ({ cohortId, onComplete }: UseFeeCollectionSetupProps) => {
  const { profile } = useAuth();
  const logger = Logger.getInstance();
  const [currentStep, setCurrentStep] = useState(1);
  const [feeStructureData, setFeeStructureData] = useState<FeeStructureData>({
    admission_fee: 0,
    total_program_fee: 0,
    number_of_semesters: 4,
    instalments_per_semester: 3,
    one_shot_discount_percentage: 0,
  });
  const [editedDates, setEditedDates] = useState<{
    one_shot: Record<string, string>;
    sem_wise: Record<string, string>;
    instalment_wise: Record<string, string>;
  }>({ one_shot: {}, sem_wise: {}, instalment_wise: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [existingFeeStructure, setExistingFeeStructure] = useState<FeeStructure | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [originalScholarshipIds, setOriginalScholarshipIds] = useState<string[]>([]);

  // Load existing data when component mounts
  useEffect(() => {
    loadExistingData();
  }, [cohortId]);

  const loadExistingData = async () => {
    try {
      const feeStructure = await FeeStructureService.getFeeStructure(cohortId);
      if (feeStructure) {
        setExistingFeeStructure(feeStructure);
        setFeeStructureData({
          admission_fee: feeStructure.admission_fee,
          total_program_fee: feeStructure.total_program_fee,
          number_of_semesters: feeStructure.number_of_semesters,
          instalments_per_semester: feeStructure.instalments_per_semester,
          one_shot_discount_percentage: feeStructure.one_shot_discount_percentage,
        });

        // Note: Date loading is now handled by useFeeReview per payment plan
        // We'll pass the full fee structure so it can load plan-specific dates
      }

      // Load existing scholarships for this cohort
      const { data: schData } = await supabase
        .from('cohort_scholarships')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('start_percentage', { ascending: true });
      const list = (schData || []) as Scholarship[];
      setScholarships(list);
      setOriginalScholarshipIds(list.map(s => s.id));
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // Validate scholarships before saving
      const scholarshipsWithData = scholarships.filter(s => 
        s.name?.trim() || 
        s.amount_percentage > 0 || 
        s.start_percentage > 0 || 
        s.end_percentage > 0
      );
      
      // Check for validation errors in non-empty scholarships
      const validationErrors: string[] = [];
      scholarshipsWithData.forEach((s, index) => {
        if (!s.name?.trim()) {
          validationErrors.push(`Scholarship ${index + 1}: Name is required`);
        }
        if (!s.amount_percentage || s.amount_percentage <= 0) {
          validationErrors.push(`Scholarship ${index + 1}: Amount percentage must be greater than 0`);
        }
        if (s.amount_percentage > 100) {
          validationErrors.push(`Scholarship ${index + 1}: Amount percentage cannot exceed 100%`);
        }
        if (s.start_percentage >= s.end_percentage) {
          validationErrors.push(`Scholarship ${index + 1}: Start percentage must be less than end percentage`);
        }
      });

      if (validationErrors.length > 0) {
        const errorMessage = 'Please fix the following scholarship errors:\n' + validationErrors.join('\n');
        logger.error('useFeeCollectionSetup: Scholarship validation failed', { validationErrors });
        toast.error(errorMessage);
        return;
      }

      logger.info('useFeeCollectionSetup: Starting save process', { 
        scholarshipCount: scholarships.length,
        scholarshipsWithDataCount: scholarshipsWithData.length,
        editedDates
      });

      // Check if we have any custom dates to save
      const hasCustomDates = Object.values(editedDates).some(planDates => 
        planDates && Object.keys(planDates).length > 0
      );

      logger.info('useFeeCollectionSetup: Date saving analysis', {
        hasCustomDates,
        editedDatesKeys: Object.keys(editedDates),
        oneShotDatesCount: Object.keys(editedDates.one_shot || {}).length,
        semWiseDatesCount: Object.keys(editedDates.sem_wise || {}).length,
        instalmentWiseDatesCount: Object.keys(editedDates.instalment_wise || {}).length
      });

      // Validate that all required dates for each plan are filled
      const missingErrors: string[] = [];
      const calcExpectedCounts = (plan: 'one_shot' | 'sem_wise' | 'instalment_wise') => {
        if (plan === 'one_shot') return 1;
        if (plan === 'sem_wise') return feeStructureData.number_of_semesters;
        return feeStructureData.number_of_semesters * feeStructureData.instalments_per_semester;
      };

      const validatePlan = (plan: 'one_shot' | 'sem_wise' | 'instalment_wise', map: Record<string, string>) => {
        const expected = calcExpectedCounts(plan);
        let actual = 0;
        if (plan === 'one_shot') {
          actual = map['one-shot'] ? 1 : 0;
        } else if (plan === 'sem_wise') {
          for (let s = 1; s <= feeStructureData.number_of_semesters; s++) {
            const key = `semester-${s}-instalment-0`;
            if (map[key]) actual++;
          }
        } else {
          for (let s = 1; s <= feeStructureData.number_of_semesters; s++) {
            for (let i = 0; i < feeStructureData.instalments_per_semester; i++) {
              const key = `semester-${s}-instalment-${i}`;
              if (map[key]) actual++;
            }
          }
        }
        if (actual < expected) {
          const missing = expected - actual;
          missingErrors.push(`${plan.replace('_', ' ')}: ${missing} date(s) missing`);
        }
      };

      validatePlan('one_shot', editedDates.one_shot || {});
      validatePlan('sem_wise', editedDates.sem_wise || {});
      validatePlan('instalment_wise', editedDates.instalment_wise || {});

      if (missingErrors.length > 0) {
        const message = `Please fill all payment dates before saving:\n- ${missingErrors.join('\n- ')}`;
        logger.error('useFeeCollectionSetup: Missing dates', { missingErrors });
        toast.error(message);
        setIsLoading(false);
        return;
      }

      // First, save the fee structure with actual dates
      const feeStructureToSave = {
        cohort_id: cohortId,
        structure_type: 'cohort' as const,
        total_program_fee: feeStructureData.total_program_fee,
        admission_fee: feeStructureData.admission_fee,
        number_of_semesters: feeStructureData.number_of_semesters,
        instalments_per_semester: feeStructureData.instalments_per_semester,
        one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage,
        is_setup_complete: false,
        one_shot_dates: editedDates.one_shot || {},
        sem_wise_dates: editedDates.sem_wise || {},
        instalment_wise_dates: editedDates.instalment_wise || {},
      };

      const savedFeeStructure = await FeeStructureService.upsertFeeStructure(feeStructureToSave);
      if (!savedFeeStructure) {
        throw new Error('Failed to save fee structure');
      }

      // Persist scholarships (create/update/delete to mirror UI)
      if (scholarships && scholarships.length >= 0) {
        // Only save scholarships that have actual data
        const validScholarships = scholarships.filter(s => 
          s.name?.trim() && 
          s.amount_percentage > 0 && 
          s.start_percentage >= 0 && 
          s.end_percentage > 0 &&
          s.start_percentage < s.end_percentage
        );
        
        logger.info('useFeeCollectionSetup: Processing scholarships', { 
          totalScholarships: scholarships.length,
          validScholarships: validScholarships.length 
        });

        // Create new ones
        const createPayloads = validScholarships
          .filter(s => String(s.id || '').startsWith('temp-'))
          .map(s => ({
            cohort_id: cohortId,
            name: s.name || '',
            description: s.description || '',
            amount_percentage: s.amount_percentage || 0,
            start_percentage: s.start_percentage || 0,
            end_percentage: s.end_percentage || 0,
            created_by: profile?.user_id || null,
          }));
        if (createPayloads.length > 0) {
          logger.info('useFeeCollectionSetup: Creating scholarships', { createPayloads });
          const { error: createErr } = await supabase
            .from('cohort_scholarships')
            .insert(createPayloads);
          if (createErr) {
            logger.error('useFeeCollectionSetup: Error creating scholarships', { error: createErr });
            throw new Error(`Failed to create scholarships: ${createErr.message}`);
          }
          logger.info('useFeeCollectionSetup: Successfully created scholarships');
        }

        // Update existing ones
        const updateTargets = validScholarships.filter(s => !String(s.id || '').startsWith('temp-'));
        if (updateTargets.length > 0) {
          logger.info('useFeeCollectionSetup: Updating scholarships', { updateTargets: updateTargets.map(s => ({ id: s.id, name: s.name })) });
        }
        for (const s of updateTargets) {
          const { error: updErr } = await supabase
            .from('cohort_scholarships')
            .update({
              name: s.name || '',
              description: s.description || '',
              amount_percentage: s.amount_percentage || 0,
              start_percentage: s.start_percentage || 0,
              end_percentage: s.end_percentage || 0,
            })
            .eq('id', s.id);
          if (updErr) {
            logger.error('useFeeCollectionSetup: Error updating scholarship', { scholarshipId: s.id, error: updErr });
            throw new Error(`Failed to update scholarship "${s.name}": ${updErr.message}`);
          }
        }

        // Delete removed ones
        const currentIds = validScholarships.filter(s => !String(s.id || '').startsWith('temp-')).map(s => s.id);
        const toDelete = originalScholarshipIds.filter(id => !currentIds.includes(id));
        if (toDelete.length > 0) {
          logger.info('useFeeCollectionSetup: Deleting scholarships', { toDelete });
          const { error: delErr } = await supabase
            .from('cohort_scholarships')
            .delete()
            .in('id', toDelete);
          if (delErr) {
            logger.error('useFeeCollectionSetup: Error deleting scholarships', { toDelete, error: delErr });
            throw new Error(`Failed to delete scholarships: ${delErr.message}`);
          }
          logger.info('useFeeCollectionSetup: Successfully deleted scholarships');
        }
      }

      logger.info('useFeeCollectionSetup: Fee structure and scholarships saved successfully');

      // Mark as complete
      await FeeStructureService.markFeeStructureComplete(cohortId);

      toast.success('Fee structure saved successfully!');
      onComplete?.();
    } catch (error) {
      logger.error('useFeeCollectionSetup: Error saving fee collection setup', { error });
      console.error('Error saving fee structure:', error);
      
      // Provide specific error message based on error type
      const errorMessage = error instanceof Error ? error.message : 'Failed to save fee structure';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, feeStructureData, editedDates, scholarships, originalScholarshipIds, profile?.user_id, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  return {
    currentStep,
    feeStructureData,
    setFeeStructureData,
    scholarships,
    setScholarships,
    editedDates,
    setEditedDates,
    isLoading,
    existingFeeStructure,
    handleSave,
    handleNext,
    handlePrevious,
    handleStepChange,
  };
};
