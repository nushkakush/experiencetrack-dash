import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { NewFeeStructureInput, Scholarship } from '@/types/fee';
import { FeeStructureService } from '@/services/feeStructure.service';
import Step1FeeStructure from './Step1FeeStructure';
import Step2Scholarships from './Step2Scholarships';
import Step3Review from './Step3Review';

interface FeeCollectionSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortStartDate: string;
  onSetupComplete: () => void;
}

const STEPS = [
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form data
  const [feeStructureData, setFeeStructureData] = useState<NewFeeStructureInput>({
    cohort_id: cohortId,
    admission_fee: 0,
    total_program_fee: 0,
    number_of_semesters: 4,
    instalments_per_semester: 3,
    one_shot_discount_percentage: 0
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFeeStructureComplete, setIsFeeStructureComplete] = useState(false);

  // Load existing data if available
  useEffect(() => {
    if (open && cohortId) {
      loadExistingData();
    }
  }, [open, cohortId]);

  const loadExistingData = async () => {
    setLoading(true);
    try {
      const { feeStructure, scholarships: existingScholarships } = 
        await FeeStructureService.getCompleteFeeStructure(cohortId);
      
      if (feeStructure) {
        setFeeStructureData({
          cohort_id: cohortId,
          admission_fee: feeStructure.admission_fee,
          total_program_fee: feeStructure.total_program_fee,
          number_of_semesters: feeStructure.number_of_semesters,
          instalments_per_semester: feeStructure.instalments_per_semester,
          one_shot_discount_percentage: feeStructure.one_shot_discount_percentage
        });
        
        // If fee structure is complete, go directly to Step 3 (Review)
        if (feeStructure.is_setup_complete) {
          setIsFeeStructureComplete(true);
          setCurrentStep(3);
        } else {
          setIsFeeStructureComplete(false);
        }
      }
      
      setScholarships(existingScholarships);
    } catch (error) {
      console.error('Error loading existing data:', error);
      toast.error('Failed to load existing fee structure');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    // Check if all scholarships have required fields
    const newErrors: Record<string, string> = {};

    scholarships.forEach((scholarship, index) => {
      if (!scholarship.name.trim()) {
        newErrors[`scholarship-${index}-name`] = 'Scholarship name is required';
      }
      if (scholarship.amount_percentage < 0 || scholarship.amount_percentage > 100) {
        newErrors[`scholarship-${index}-amount`] = 'Amount percentage must be between 0 and 100';
      }
      if (scholarship.start_percentage < 0 || scholarship.start_percentage > 100) {
        newErrors[`scholarship-${index}-start`] = 'Start percentage must be between 0 and 100';
      }
      if (scholarship.end_percentage < 0 || scholarship.end_percentage > 100) {
        newErrors[`scholarship-${index}-end`] = 'End percentage must be between 0 and 100';
      }
      if (scholarship.start_percentage >= scholarship.end_percentage) {
        newErrors[`scholarship-${index}-end`] = 'End percentage must be greater than start percentage';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = true; // Step 3 is review only
        break;
    }

    if (isValid && currentStep < 3) {
      // Additional validation before moving to Step 3
      if (currentStep === 2) {
        // Ensure fee structure has valid data for Step 3
        if (feeStructureData.total_program_fee <= 0) {
          toast.error('Please complete Step 1 with valid fee structure before proceeding');
          return;
        }
      }
      
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save fee structure
      const savedFeeStructure = await FeeStructureService.upsertFeeStructure(feeStructureData);
      if (!savedFeeStructure) {
        throw new Error('Failed to save fee structure');
      }

      // Save scholarships
      const scholarshipPromises = scholarships.map(scholarship => {
        const scholarshipData = {
          cohort_id: cohortId,
          name: scholarship.name,
          description: scholarship.description,
          start_percentage: scholarship.start_percentage,
          end_percentage: scholarship.end_percentage,
          amount_percentage: scholarship.amount_percentage
        };

        if (scholarship.id.startsWith('temp-')) {
          // New scholarship
          return FeeStructureService.createScholarship(scholarshipData);
        } else {
          // Update existing scholarship
          return FeeStructureService.updateScholarship(scholarship.id, scholarshipData);
        }
      });

      await Promise.all(scholarshipPromises);

      // Mark setup as complete
      await FeeStructureService.markFeeStructureComplete(cohortId);

      toast.success('Fee structure setup completed successfully!');
      onSetupComplete();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      toast.error('Failed to save fee structure. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFeeStructureData({
      cohort_id: cohortId,
      admission_fee: 0,
      total_program_fee: 0,
      number_of_semesters: 4,
      instalments_per_semester: 3,
      one_shot_discount_percentage: 0
    });
    setScholarships([]);
    setErrors({});
  };

  const renderCurrentStep = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading existing data...</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <Step1FeeStructure
            data={feeStructureData}
            onChange={setFeeStructureData}
            errors={errors}
          />
        );
      case 2:
        return (
          <Step2Scholarships
            scholarships={scholarships}
            onScholarshipsChange={setScholarships}
            errors={errors}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isFeeStructureComplete ? 'Review Fee Structure' : `Configure Fee Structure - Step ${currentStep} of 3`}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={step.id <= currentStep ? 'text-primary font-medium' : ''}
              >
                {step.title}
              </span>
            ))}
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : isFeeStructureComplete ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsFeeStructureComplete(false);
                    setCurrentStep(1);
                  }}
                >
                  Edit Configuration
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
