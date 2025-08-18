import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { FeeStructureService } from '@/services/feeStructure.service';
import { PaymentScheduleOverrides } from '@/services/payments/PaymentScheduleOverrides';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { Scholarship } from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';

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
      // First, save the fee structure
      const feeStructureToSave = {
        cohort_id: cohortId,
        structure_type: 'cohort' as const,
        total_program_fee: feeStructureData.total_program_fee,
        admission_fee: feeStructureData.admission_fee,
        number_of_semesters: feeStructureData.number_of_semesters,
        instalments_per_semester: feeStructureData.instalments_per_semester,
        one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage,
        is_setup_complete: false,
        custom_dates_enabled: false,
        one_shot_dates: {},
        sem_wise_dates: {},
        instalment_wise_dates: {},
      };

      const savedFeeStructure = await FeeStructureService.upsertFeeStructure(feeStructureToSave);
      if (!savedFeeStructure) {
        throw new Error('Failed to save fee structure');
      }

      // Persist scholarships (create/update/delete to mirror UI)
      if (scholarships && scholarships.length >= 0) {
        // Create new ones
        const createPayloads = scholarships
          .filter(s => String(s.id || '').startsWith('temp-'))
          .map(s => ({
            cohort_id: cohortId,
            name: s.name || '',
            description: s.description || '',
            amount_percentage: s.amount_percentage || 0,
            start_percentage: s.start_percentage || 0,
            end_percentage: s.end_percentage || 0,
          }));
        if (createPayloads.length > 0) {
          const { error: createErr } = await supabase
            .from('cohort_scholarships')
            .insert(createPayloads);
          if (createErr) throw createErr;
        }

        // Update existing ones
        const updateTargets = scholarships.filter(s => !String(s.id || '').startsWith('temp-'));
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
          if (updErr) throw updErr;
        }

        // Delete removed ones
        const currentIds = scholarships.filter(s => !String(s.id || '').startsWith('temp-')).map(s => s.id);
        const toDelete = originalScholarshipIds.filter(id => !currentIds.includes(id));
        if (toDelete.length > 0) {
          const { error: delErr } = await supabase
            .from('cohort_scholarships')
            .delete()
            .in('id', toDelete);
          if (delErr) throw delErr;
        }
      }

      // Then, save the custom dates for ALL plans that have edits
      const planTypes: Array<'one_shot' | 'sem_wise' | 'instalment_wise'> = ['one_shot', 'sem_wise', 'instalment_wise'];
      
      for (const planType of planTypes) {
        const planDates = editedDates[planType];
        if (planDates && Object.keys(planDates).length > 0) {

          const success = await FeeStructureService.updateCohortPlanDates(
            cohortId,
            planDates,
            planType
          );
          if (!success) {
            throw new Error(`Failed to save custom dates for ${planType}`);
          }
        }
      }

      // Mark as complete
      await FeeStructureService.markFeeStructureComplete(cohortId);

      toast.success('Fee structure saved successfully!');
      onComplete?.();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      toast.error('Failed to save fee structure');
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, feeStructureData, editedDates, onComplete]);

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
