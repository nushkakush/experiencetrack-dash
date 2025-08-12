import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { NewFeeStructureInput, Scholarship } from '@/types/fee';
import { FeeStructureService } from '@/services/feeStructure.service';

interface UseFeeCollectionSetupProps {
  cohortId: string;
  onSetupComplete: () => void;
}

interface FeeCollectionSetupState {
  currentStep: number;
  loading: boolean;
  saving: boolean;
  feeStructureData: NewFeeStructureInput;
  scholarships: Scholarship[];
  errors: Record<string, string>;
  isFeeStructureComplete: boolean;
}

export const useFeeCollectionSetup = ({ cohortId, onSetupComplete }: UseFeeCollectionSetupProps) => {
  const [state, setState] = useState<FeeCollectionSetupState>({
    currentStep: 1,
    loading: false,
    saving: false,
    feeStructureData: {
      cohort_id: cohortId,
      admission_fee: 0,
      total_program_fee: 0,
      number_of_semesters: 4,
      instalments_per_semester: 3,
      one_shot_discount_percentage: 0
    },
    scholarships: [],
    errors: {},
    isFeeStructureComplete: false
  });

  const updateState = useCallback((updates: Partial<FeeCollectionSetupState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadExistingData = useCallback(async () => {
    updateState({ loading: true });
    try {
      const { feeStructure, scholarships: existingScholarships } = 
        await FeeStructureService.getCompleteFeeStructure(cohortId);
      
      if (feeStructure) {
        const feeStructureData = {
          cohort_id: cohortId,
          admission_fee: feeStructure.admission_fee,
          total_program_fee: feeStructure.total_program_fee,
          number_of_semesters: feeStructure.number_of_semesters,
          instalments_per_semester: feeStructure.instalments_per_semester,
          one_shot_discount_percentage: feeStructure.one_shot_discount_percentage
        };
        
        const isFeeStructureComplete = feeStructure.is_setup_complete;
        
        updateState({
          feeStructureData,
          scholarships: existingScholarships,
          isFeeStructureComplete,
          currentStep: isFeeStructureComplete ? 3 : 1
        });
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast.error('Failed to load existing fee structure');
    } finally {
      updateState({ loading: false });
    }
  }, [cohortId, updateState]);

  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const { feeStructureData } = state;

    if (feeStructureData.admission_fee < 0) {
      newErrors.admission_fee = 'Admission fee cannot be negative';
    }

    if (feeStructureData.total_program_fee <= 0) {
      newErrors.total_program_fee = 'Total program fee must be greater than 0';
    }

    if (feeStructureData.number_of_semesters < 1 || feeStructureData.number_of_semesters > 12) {
      newErrors.number_of_semesters = 'Number of semesters must be between 1 and 12';
    }

    if (feeStructureData.instalments_per_semester < 1 || feeStructureData.instalments_per_semester > 12) {
      newErrors.instalments_per_semester = 'Instalments per semester must be between 1 and 12';
    }

    if (feeStructureData.one_shot_discount_percentage < 0 || feeStructureData.one_shot_discount_percentage > 100) {
      newErrors.one_shot_discount_percentage = 'Discount percentage must be between 0 and 100';
    }

    updateState({ errors: newErrors });
    return Object.keys(newErrors).length === 0;
  }, [state.feeStructureData, updateState]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const { scholarships } = state;

    if (scholarships.length === 0) {
      newErrors.step2 = 'At least one scholarship is required';
      updateState({ errors: newErrors });
      return false;
    }

    // Check for overlapping scholarships
    for (let i = 0; i < scholarships.length; i++) {
      const current = scholarships[i];
      
      for (let j = 0; j < scholarships.length; j++) {
        if (i === j) continue;
        
        const other = scholarships[j];
        const currentStart = current.start_percentage;
        const currentEnd = current.end_percentage;
        const otherStart = other.start_percentage;
        const otherEnd = other.end_percentage;
        
        if (currentStart <= otherEnd && otherStart <= currentEnd) {
          newErrors.step2 = `Overlapping scholarships detected: "${current.name}" (${current.start_percentage}%-${current.end_percentage}%) overlaps with "${other.name}" (${other.start_percentage}%-${other.end_percentage}%). Scholarship ranges cannot overlap.`;
          updateState({ errors: newErrors });
          return false;
        }
      }
    }

    // Validate individual scholarship fields
    scholarships.forEach((scholarship, index) => {
      if (!scholarship.name?.trim()) {
        newErrors[`scholarship-${index}-name`] = 'Scholarship name is required';
      }
      
      if (!scholarship.amount_percentage || scholarship.amount_percentage <= 0) {
        newErrors[`scholarship-${index}-amount`] = 'Amount percentage must be greater than 0';
      }
      
      if (scholarship.amount_percentage > 100) {
        newErrors[`scholarship-${index}-amount`] = 'Amount percentage cannot exceed 100%';
      }
      
      if (scholarship.start_percentage >= scholarship.end_percentage) {
        newErrors[`scholarship-${index}-range`] = 'Start percentage must be less than end percentage';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      updateState({ errors: newErrors });
      return false;
    }

    updateState({ errors: {} });
    return true;
  }, [state.scholarships, updateState]);

  const handleNext = useCallback(() => {
    let isValid = false;

    switch (state.currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = true;
        break;
    }

    if (isValid && state.currentStep < 3) {
      if (state.currentStep === 2 && state.feeStructureData.total_program_fee <= 0) {
        toast.error('Please complete Step 1 with valid fee structure before proceeding');
        return;
      }
      
      updateState({ 
        currentStep: state.currentStep + 1,
        errors: {}
      });
    }
  }, [state.currentStep, state.feeStructureData.total_program_fee, validateStep1, validateStep2, updateState]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > 1) {
      updateState({ 
        currentStep: state.currentStep - 1,
        errors: {}
      });
    }
  }, [state.currentStep, updateState]);

  const handleSave = useCallback(async () => {
    updateState({ saving: true });
    try {
      const savedFeeStructure = await FeeStructureService.upsertFeeStructure(state.feeStructureData);
      if (!savedFeeStructure) {
        throw new Error('Failed to save fee structure');
      }

      const scholarshipPromises = state.scholarships.map(scholarship => {
        const scholarshipData = {
          cohort_id: cohortId,
          name: scholarship.name,
          description: scholarship.description,
          start_percentage: scholarship.start_percentage,
          end_percentage: scholarship.end_percentage,
          amount_percentage: scholarship.amount_percentage
        };

        if (scholarship.id.startsWith('temp-')) {
          return FeeStructureService.createScholarship(scholarshipData);
        } else {
          return FeeStructureService.updateScholarship(scholarship.id, scholarshipData);
        }
      });

      await Promise.all(scholarshipPromises);
      await FeeStructureService.markFeeStructureComplete(cohortId);

      toast.success('Fee structure setup completed successfully!');
      onSetupComplete();
      
      // Reset form
      updateState({
        currentStep: 1,
        feeStructureData: {
          cohort_id: cohortId,
          admission_fee: 0,
          total_program_fee: 0,
          number_of_semesters: 4,
          instalments_per_semester: 3,
          one_shot_discount_percentage: 0
        },
        scholarships: [],
        errors: {},
        isFeeStructureComplete: false
      });
    } catch (error) {
      console.error('Error saving fee structure:', error);
      toast.error('Failed to save fee structure. Please try again.');
    } finally {
      updateState({ saving: false });
    }
  }, [state.feeStructureData, state.scholarships, cohortId, onSetupComplete, updateState]);

  const resetForm = useCallback(() => {
    updateState({
      currentStep: 1,
      feeStructureData: {
        cohort_id: cohortId,
        admission_fee: 0,
        total_program_fee: 0,
        number_of_semesters: 4,
        instalments_per_semester: 3,
        one_shot_discount_percentage: 0
      },
      scholarships: [],
      errors: {}
    });
  }, [cohortId, updateState]);

  return {
    ...state,
    loadExistingData,
    handleNext,
    handlePrevious,
    handleSave,
    resetForm,
    updateState
  };
};
