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
import { FeeStructureService } from '@/services/feeStructure.service';
import { toast } from 'sonner';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';

interface FeeCollectionSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortStartDate: string;
  onSetupComplete: () => void;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  // New: student customization mode
  variant?: 'cohort' | 'student-custom';
  studentId?: string;
  initialSelectedPlan?: 'one_shot' | 'sem_wise' | 'instalment_wise';
  hideScholarships?: boolean;
  restrictPaymentPlanToSelected?: boolean;
  hideScholarshipControls?: boolean;
}

export const FeeCollectionSetupModal: React.FC<FeeCollectionSetupModalProps> = ({
  open,
  onOpenChange,
  cohortId,
  cohortStartDate,
  onSetupComplete,
  mode = 'edit',
  onModeChange,
  variant = 'cohort',
  studentId,
  initialSelectedPlan,
  hideScholarships = false,
  restrictPaymentPlanToSelected = false,
  hideScholarshipControls = false,
}) => {
  const { hasPermission } = useFeaturePermissions();
  
  // Check if user can edit fee structure (only super admins)
  const canEditFeeStructure = hasPermission('fees.setup_structure');
  
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
    // In student-custom mode, load the student's existing custom structure for editing
    studentId,
    onComplete: onSetupComplete,
  });

  // Force view mode for non-super admins
  const effectiveMode = canEditFeeStructure ? mode : 'view';
  
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'one_shot' | 'sem_wise' | 'instalment_wise'>(initialSelectedPlan || 'one_shot');

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
    console.log('🔄 FeeCollectionSetupModal: handleDatesChange called', {
      newDatesByPlan: datesByPlan,
      currentEditedDates: editedDates
    });
    // Store all plans' dates, not just the current plan
    setEditedDates(datesByPlan);
  }, [setEditedDates, editedDates]);

  const handleSaveClick = async () => {
    if (variant === 'student-custom') {
      // Save student-specific custom plan
      try {
        const plan = (restrictPaymentPlanToSelected ? selectedPaymentPlan : selectedPaymentPlan) || 'instalment_wise';
        const datesForSelected = (editedDates as any)[plan] || {};

        const saved = await FeeStructureService.upsertCustomPlanForStudent({
          cohortId,
          studentId: studentId || '',
          baseFields: {
            admission_fee: feeStructureData.admission_fee,
            total_program_fee: feeStructureData.total_program_fee,
            number_of_semesters: feeStructureData.number_of_semesters,
            instalments_per_semester: feeStructureData.instalments_per_semester,
            one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage,
          },
          selectedPlan: plan,
          editedDates: datesForSelected,
        });

        if (!saved) throw new Error('Failed to save custom plan');
        toast.success('Custom plan saved');
        onOpenChange(false);
        onSetupComplete();
      } catch (e) {
        console.error(e);
        toast.error('Failed to save custom plan');
      }
      return;
    }
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
              isReadOnly={effectiveMode === 'view'}
              selectedPaymentPlan={selectedPaymentPlan}
              isStudentCustomMode={variant === 'student-custom'}
            />
          );
        case 2:
          if (hideScholarships) {
            return (
              <div className="text-sm text-muted-foreground">
                Scholarships are managed at the cohort level and are not editable in this flow.
              </div>
            );
          }
          return (
            <Step2Scholarships
              scholarships={memoizedScholarships}
              onScholarshipsChange={setScholarships}
              errors={{}}
              isReadOnly={variant === 'student-custom' || effectiveMode === 'view'}
            />
          );
              case 3:
          return (
            <Step3Review
              feeStructure={memoizedFeeStructure}
              scholarships={memoizedScholarships}
              onDatesChange={handleDatesChange}
              isReadOnly={effectiveMode === 'view'}
              onPaymentPlanChange={handlePaymentPlanChangeCallback}
              selectedPaymentPlan={selectedPaymentPlan}
              restrictToPlan={restrictPaymentPlanToSelected ? selectedPaymentPlan : undefined}
              hideScholarshipControls={hideScholarshipControls}
              initialScholarshipId={'no_scholarship'}
            />
          );
      default:
        return null;
    }
  };

  // Auto-skip Step 2 only if scholarships are completely hidden
  React.useEffect(() => {
    if (hideScholarships && currentStep === 2) {
      handleNext();
    }
  }, [hideScholarships, currentStep, handleNext]);

  const totalSteps = hideScholarships ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {`Configure Fee Structure - Step ${Math.min(currentStep, totalSteps)} of ${totalSteps}`}
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
              ...(hideScholarships ? [] as any : [{ id: 2, title: 'Scholarships' }]),
              { id: 3, title: 'Review' },
            ]}
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSave={effectiveMode === 'edit' ? handleSaveClick : undefined}
            onEdit={effectiveMode === 'view' && canEditFeeStructure ? () => onModeChange?.('edit') : undefined}
            onCancelEdit={effectiveMode === 'edit' ? () => onModeChange?.('view') : undefined}
            onClose={() => onOpenChange(false)}
            isComplete={effectiveMode === 'view'}
            isEditMode={effectiveMode === 'edit'}
            showNavigationButtons={true}
            showProgressBar={false}
            saveButtonText={variant === 'student-custom' ? 'Save Custom Plan' : undefined}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
