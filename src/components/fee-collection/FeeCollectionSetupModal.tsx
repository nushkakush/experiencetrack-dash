import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Step1FeeStructure from './Step1FeeStructure';
import Step2Scholarships from './Step2Scholarships';
import Step3Review from './Step3Review';
import { useFeeCollectionSetup } from './hooks/useFeeCollectionSetup';
import { Scholarship } from '@/types/fee';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StepNavigation } from './components/StepNavigation';
import { AddScholarshipButton } from './components/AddScholarshipButton';

interface FeeCollectionSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortStartDate: string;
  onSetupComplete: () => void;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
}

export const FeeCollectionSetupModal: React.FC<FeeCollectionSetupModalProps> = ({
  open,
  onOpenChange,
  cohortId,
  cohortStartDate,
  onSetupComplete,
  mode = 'view',
  onModeChange,
}) => {
  const {
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
  } = useFeeCollectionSetup({
    cohortId,
    onComplete: onSetupComplete,
  });

  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'one_shot' | 'sem_wise' | 'instalment_wise'>('instalment_wise');

  // Memoize the fee structure object to prevent unnecessary re-renders
  // Use existing fee structure if available (includes saved custom dates), otherwise create new one
  const memoizedFeeStructure = useMemo(() => {
    if (existingFeeStructure) {
      return {
        ...existingFeeStructure,
        admission_fee: feeStructureData.admission_fee || existingFeeStructure.admission_fee,
        total_program_fee: feeStructureData.total_program_fee || existingFeeStructure.total_program_fee,
        number_of_semesters: feeStructureData.number_of_semesters || existingFeeStructure.number_of_semesters,
        instalments_per_semester: feeStructureData.instalments_per_semester || existingFeeStructure.instalments_per_semester,
        one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage || existingFeeStructure.one_shot_discount_percentage,
      };
    }

    return {
      id: '',
      cohort_id: cohortId,
      admission_fee: feeStructureData.admission_fee || 0,
      total_program_fee: feeStructureData.total_program_fee || 0,
      number_of_semesters: feeStructureData.number_of_semesters || 4,
      instalments_per_semester: feeStructureData.instalments_per_semester || 3,
      one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage || 0,
      is_setup_complete: false,
      structure_type: 'cohort' as const,
      custom_dates_enabled: false,
      one_shot_dates: {},
      sem_wise_dates: {},
      instalment_wise_dates: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [
    existingFeeStructure,
    cohortId,
    feeStructureData.admission_fee,
    feeStructureData.total_program_fee,
    feeStructureData.number_of_semesters,
    feeStructureData.instalments_per_semester,
    feeStructureData.one_shot_discount_percentage
  ]);

  // Load cohort scholarships (restore previous behavior)
  const memoizedScholarships = useMemo(() => scholarships, [scholarships]);

  // Memoize the dates change handler to prevent unnecessary re-renders
  const handleDatesChange = React.useCallback((datesByPlan: {
    one_shot: Record<string, string>;
    sem_wise: Record<string, string>;
    instalment_wise: Record<string, string>;
  }) => {
    // Store all plans' dates, not just the current plan
    setEditedDates(datesByPlan);
  }, [setEditedDates]);

  const handleSaveClick = async () => {
    await handleSave();
  };

  // Create stable handler outside of renderStep to avoid Rules of Hooks violation
  const handlePaymentPlanChangeCallback = React.useCallback((plan) => {
    if (plan !== 'not_selected') {
      setSelectedPaymentPlan(plan);
    }
  }, []);

  const renderStep = () => {
    switch (currentStep) {
              case 1:
          return (
            <Step1FeeStructure
              data={{
                cohort_id: cohortId,
                admission_fee: feeStructureData.admission_fee,
                total_program_fee: feeStructureData.total_program_fee,
                number_of_semesters: feeStructureData.number_of_semesters,
                instalments_per_semester: feeStructureData.instalments_per_semester,
                one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage,
              }}
              onChange={(data) => setFeeStructureData(data)}
              errors={{}}
              isReadOnly={mode === 'view'}
            />
          );
        case 2:
          return (
            <Step2Scholarships
              scholarships={memoizedScholarships}
              onScholarshipsChange={setScholarships}
              errors={{}}
              isReadOnly={mode === 'view'}
            />
          );
              case 3:
          return (
            <Step3Review
              feeStructure={memoizedFeeStructure}
              scholarships={memoizedScholarships}
              onDatesChange={handleDatesChange}
              isReadOnly={mode === 'view'}
              onPaymentPlanChange={handlePaymentPlanChangeCallback}
              selectedPaymentPlan={selectedPaymentPlan}
            />
          );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {`Configure Fee Structure - Step ${currentStep} of 3`}
          </DialogTitle>
          <DialogDescription>
            Configure your cohort's fee structure, define scholarships, and preview the resulting payment plans.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">{renderStep()}</div>

        <div className="px-6 py-4 border-t bg-background">
          <StepNavigation
            steps={[
              { id: 1, title: 'Fee Structure' },
              { id: 2, title: 'Scholarships' },
              { id: 3, title: 'Review' },
            ]}
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSave={mode === 'edit' ? handleSaveClick : undefined}
            onEdit={mode === 'view' ? () => onModeChange?.('edit') : undefined}
            onCancelEdit={mode === 'edit' ? () => onModeChange?.('view') : undefined}
            onClose={() => onOpenChange(false)}
            isComplete={mode === 'view'}
            isEditMode={mode === 'edit'}
            showNavigationButtons={true}
            showProgressBar={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
