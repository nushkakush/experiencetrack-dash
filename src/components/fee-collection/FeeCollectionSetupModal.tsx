import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NewFeeStructureInput, Scholarship } from '@/types/fee';
import Step1FeeStructure from './Step1FeeStructure';
import Step2Scholarships from './Step2Scholarships';
import Step3Review from './Step3Review';
import { StepNavigation, Step } from './components/StepNavigation';
import { LoadingState } from './components/LoadingState';
import { useFeeCollectionSetup } from './hooks/useFeeCollectionSetup';

interface FeeCollectionSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortStartDate: string;
  onSetupComplete: () => void;
}

const STEPS: Step[] = [
  { id: 1, title: 'Fee Structure' },
  { id: 2, title: 'Scholarships' },
  { id: 3, title: 'Review' }
];

export default function FeeCollectionSetupModal({
  open,
  onOpenChange,
  cohortId,
  cohortStartDate,
  onSetupComplete
}: FeeCollectionSetupModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  
  const {
    currentStep,
    loading,
    saving,
    feeStructureData,
    scholarships,
    errors,
    isFeeStructureComplete,
    loadExistingData,
    handleNext,
    handlePrevious,
    handleSave,
    updateState
  } = useFeeCollectionSetup({ cohortId, onSetupComplete });

  // Load existing data when modal opens
  useEffect(() => {
    if (open && cohortId) {
      loadExistingData();
      setIsEditMode(false); // Reset edit mode when modal opens
    }
  }, [open, cohortId, loadExistingData]);

  const handleEditConfiguration = () => {
    setIsEditMode(true);
    updateState({
      isFeeStructureComplete: false,
      currentStep: 1
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    loadExistingData(); // Reload original data
  };

  // Determine if we should show read-only view
  const isReadOnly = isFeeStructureComplete && !isEditMode;

  const renderCurrentStep = () => {
    if (loading) {
      return <LoadingState message="Loading existing data..." />;
    }

    switch (currentStep) {
      case 1:
        return (
          <Step1FeeStructure
            data={feeStructureData}
            onChange={(data: NewFeeStructureInput) => updateState({ feeStructureData: data })}
            errors={errors}
            isReadOnly={isReadOnly}
          />
        );
      case 2:
        return (
          <Step2Scholarships
            scholarships={scholarships}
            onScholarshipsChange={(scholarships: Scholarship[]) => updateState({ scholarships })}
            errors={errors}
            isReadOnly={isReadOnly}
          />
        );
      case 3:
        return (
          <Step3Review
            feeStructure={{
              id: '',
              cohort_id: cohortId,
              admission_fee: feeStructureData.admission_fee || 0,
              total_program_fee: feeStructureData.total_program_fee || 0,
              number_of_semesters: feeStructureData.number_of_semesters || 4,
              instalments_per_semester: feeStructureData.instalments_per_semester || 3,
              one_shot_discount_percentage: feeStructureData.one_shot_discount_percentage || 0,
              is_setup_complete: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }}
            scholarships={scholarships}
            cohortStartDate={cohortStartDate}
            isReadOnly={isReadOnly}
            onDatesChange={(dates) => updateState({ editedDates: dates as any })}
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
            {isReadOnly 
              ? 'Fee Structure Settings' 
              : isEditMode
              ? `Edit Fee Structure - Step ${currentStep} of 3`
              : `Configure Fee Structure - Step ${currentStep} of 3`
            }
          </DialogTitle>
          <DialogDescription>
            Configure your cohort's fee structure, define scholarships, and preview the resulting payment plans.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar Only */}
        <div className="px-6">
          <StepNavigation
            steps={STEPS}
            currentStep={currentStep}
            onNext={() => {}} // Empty functions since we only want the progress bar
            onPrevious={() => {}}
            showNavigationButtons={false}
          />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons at Bottom */}
        <div className="px-6 py-4 border-t bg-background">
          <StepNavigation
            steps={STEPS}
            currentStep={currentStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSave={handleSave}
            onEdit={handleEditConfiguration}
            onCancelEdit={handleCancelEdit}
            onClose={() => onOpenChange(false)}
            isComplete={isFeeStructureComplete}
            isEditMode={isEditMode}
            saving={saving}
            canProceed={!loading}
            showProgressBar={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
