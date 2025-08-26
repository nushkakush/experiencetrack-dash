import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Logger } from '@/lib/logging/Logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CohortStudent } from '@/types/cohort';
import {
  CreditCard,
  CheckCircle,
  Calendar,
  DollarSign,
  Edit2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  studentPaymentPlanService,
  PaymentPlan,
  StudentPaymentPlan,
} from '@/services/studentPaymentPlan.service';
import { FeeCollectionSetupModal } from '@/components/fee-collection/FeeCollectionSetupModal';
import { FeeStructureService } from '@/services/feeStructure.service';

interface PaymentPlanDialogProps {
  student: CohortStudent;
  onPaymentPlanUpdated: () => void;
  children: React.ReactNode;
}

const PAYMENT_PLAN_OPTIONS = [
  {
    value: 'one_shot' as PaymentPlan,
    label: 'One Shot Payment',
    description: 'Full amount due at once',
    icon: DollarSign,
  },
  {
    value: 'sem_wise' as PaymentPlan,
    label: 'Semester Wise',
    description: 'Split across semesters',
    icon: Calendar,
  },
  {
    value: 'instalment_wise' as PaymentPlan,
    label: 'Instalment Wise',
    description: 'Monthly installments',
    icon: CreditCard,
  },
];

export default function PaymentPlanDialog({
  student,
  onPaymentPlanUpdated,
  children,
}: PaymentPlanDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPaymentPlan, setCurrentPaymentPlan] =
    useState<StudentPaymentPlan | null>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<
    PaymentPlan | ''
  >('');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [hasCustomPlan, setHasCustomPlan] = useState(false);

  const selectedOption = PAYMENT_PLAN_OPTIONS.find(
    option => option.value === selectedPaymentPlan
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setSelectedPaymentPlan('');
        setIsEditing(false);
      }
    }
  };

  const loadCurrentPaymentPlan = useCallback(async () => {
    try {
      const logger = new Logger('PaymentPlanDialog');
      logger.info('Loading current payment plan for student', {
        studentId: student.id,
      });

      const result = await studentPaymentPlanService.getByStudent(student.id);
      logger.info('Current payment plan result', {
        success: result.success,
        hasData: !!result.data,
        data: result.data,
      });

      if (result.success && result.data) {
        setCurrentPaymentPlan(result.data);
        logger.info('Set current payment plan', {
          paymentPlan: result.data.payment_plan,
        });

        // Check if student has a custom fee structure
        try {
          const customStructure = await FeeStructureService.getFeeStructure(
            student.cohort_id,
            student.id
          );
          const hasCustom =
            !!customStructure && customStructure.structure_type === 'custom';
          logger.info('Custom fee structure check', {
            studentId: student.id,
            cohortId: student.cohort_id,
            customStructure: customStructure
              ? {
                  id: customStructure.id,
                  structure_type: customStructure.structure_type,
                  student_id: customStructure.student_id,
                }
              : null,
            hasCustom,
          });
          setHasCustomPlan(hasCustom);
        } catch (error) {
          logger.error(
            'Error checking custom fee structure',
            { studentId: student.id },
            error as Error
          );
          setHasCustomPlan(false);
        }
        // Only set form values if we're editing
        if (isEditing) {
          setSelectedPaymentPlan(result.data.payment_plan);
        }
      } else {
        setCurrentPaymentPlan(null);
        logger.info('No current payment plan found');
        if (isEditing) {
          setSelectedPaymentPlan('');
        }
      }
    } catch (error) {
      const logger = new Logger('PaymentPlanDialog');
      logger.error(
        'Error loading current payment plan',
        { studentId: student.id },
        error as Error
      );
      console.error('Error loading current payment plan:', error);
      setCurrentPaymentPlan(null);
      if (isEditing) {
        setSelectedPaymentPlan('');
      }
    }
  }, [student.id, isEditing]);

  useEffect(() => {
    if (open) {
      loadCurrentPaymentPlan();
    }
  }, [open, student.id, loadCurrentPaymentPlan]);

  const handleSetPaymentPlan = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }

      if (!selectedPaymentPlan) {
        toast.error('Please select a payment plan');
        return;
      }

      const logger = new Logger('PaymentPlanDialog');
      logger.info('Admin: Attempting to set payment plan', {
        studentId: student.id,
        cohortId: student.cohort_id,
        paymentPlan: selectedPaymentPlan,
        isEditing,
        currentPaymentPlan: currentPaymentPlan?.id,
      });

      // If user has a custom plan and is setting a plan (without customization),
      // delete the custom plan to switch back to cohort plan
      if (currentPaymentPlan && hasCustomPlan) {
        logger.info('Admin: Deleting custom plan due to plan selection', {
          studentId: student.id,
          currentPlan: currentPaymentPlan.payment_plan,
          selectedPlan: selectedPaymentPlan,
          reason:
            currentPaymentPlan.payment_plan !== selectedPaymentPlan
              ? 'plan_change'
              : 'same_plan_no_customization',
        });

        await FeeStructureService.deleteCustomPlanForStudent(
          student.cohort_id,
          student.id
        );
        setHasCustomPlan(false);

        // Reload current payment plan data to ensure UI reflects the cohort plan
        await loadCurrentPaymentPlan();

        logger.info('Admin: Custom plan deleted, refreshing parent component', {
          studentId: student.id,
        });

        // Refresh parent component to update the table display
        onPaymentPlanUpdated();
      }

      const result = await studentPaymentPlanService.setPaymentPlan(
        student.id,
        student.cohort_id,
        selectedPaymentPlan,
        user.id
      );

      if (result.success) {
        const message = isEditing
          ? 'Payment plan updated successfully!'
          : 'Payment plan set successfully!';
        toast.success(message);
        logger.info('Admin: Payment plan operation successful', {
          studentId: student.id,
          paymentPlan: selectedPaymentPlan,
          operation: isEditing ? 'update' : 'set',
        });

        // Refresh the current payment plan data before closing
        await loadCurrentPaymentPlan();

        // Small delay to show the updated data before closing
        setTimeout(() => {
          setOpen(false);
          setIsEditing(false);
          onPaymentPlanUpdated();
        }, 500);
      } else {
        logger.error('Admin: Failed to set payment plan', {
          error: result.error,
        });
        toast.error(result.error || 'Failed to set payment plan');
      }
    } catch (error) {
      const logger = new Logger('PaymentPlanDialog');
      logger.error(
        'Admin: Exception while setting payment plan',
        {
          studentId: student.id,
          paymentPlan: selectedPaymentPlan,
        },
        error as Error
      );
      console.error('Error setting payment plan:', error);
      toast.error('Failed to set payment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save handler invoked from the customization modal (student-custom variant)
  const handleSaveCustomPlan = async (
    baseFields: {
      admission_fee: number;
      total_program_fee: number;
      number_of_semesters: number;
      instalments_per_semester: number;
      one_shot_discount_percentage: number;
      program_fee_includes_gst: boolean;
      equal_scholarship_distribution: boolean;
    },
    editedDates: Record<string, string>
  ) => {
    if (!selectedPaymentPlan) {
      toast.error('Please select a payment plan');
      return false;
    }
    try {
      setCustomizing(true);
      const res = await FeeStructureService.upsertCustomPlanForStudent({
        cohortId: student.cohort_id,
        studentId: student.id,
        baseFields,
        selectedPlan: selectedPaymentPlan,
        editedDates,
      });
      if (!res) {
        toast.error('Failed to save custom plan');
        return false;
      }
      toast.success('Custom plan saved');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Error saving custom plan');
      return false;
    } finally {
      setCustomizing(false);
    }
  };

  const handleRemovePaymentPlan = async () => {
    if (!currentPaymentPlan) return;

    setLoading(true);
    try {
      const logger = new Logger('PaymentPlanDialog');
      logger.info('Admin: Attempting to remove payment plan', {
        studentId: student.id,
        cohortId: student.cohort_id,
        paymentPlanId: currentPaymentPlan.id,
        hasCustomPlan,
        currentPaymentPlan: currentPaymentPlan.payment_plan,
      });

      // If student has a custom plan, delete it first
      if (hasCustomPlan) {
        logger.info(
          'Admin: Deleting custom plan before removing payment plan',
          {
            studentId: student.id,
          }
        );

        const deleteResult =
          await FeeStructureService.deleteCustomPlanForStudent(
            student.cohort_id,
            student.id
          );

        logger.info('Admin: Custom plan deletion result', {
          studentId: student.id,
          deleteResult,
        });

        setHasCustomPlan(false);
      } else {
        logger.info('Admin: No custom plan to delete', {
          studentId: student.id,
        });
      }

      const result = await studentPaymentPlanService.removePaymentPlan(
        student.id
      );

      logger.info('Admin: removePaymentPlan result', { result });

      if (result.success) {
        toast.success('Payment plan removed successfully!');
        logger.info('Admin: Payment plan removed, refreshing UI', {
          studentId: student.id,
        });
        setOpen(false);
        setIsEditing(false);
        onPaymentPlanUpdated();
      } else {
        logger.error('Admin: Failed to remove payment plan', {
          error: result.error,
        });
        toast.error(result.error || 'Failed to remove payment plan');
      }
    } catch (error) {
      const logger = new Logger('PaymentPlanDialog');
      logger.error(
        'Admin: Exception while removing payment plan',
        { studentId: student.id },
        error as Error
      );
      console.error('Error removing payment plan:', error);
      toast.error('Failed to remove payment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentOptionDisplay = () => {
    if (!currentPaymentPlan || !currentPaymentPlan.payment_plan) return null;
    return PAYMENT_PLAN_OPTIONS.find(
      option => option.value === currentPaymentPlan.payment_plan
    );
  };

  const currentOption = getCurrentOptionDisplay();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {currentPaymentPlan && !isEditing ? (
              <CheckCircle className='h-5 w-5 text-green-600' />
            ) : (
              <CreditCard className='h-5 w-5' />
            )}
            {currentPaymentPlan && !isEditing
              ? 'Payment Plan Details'
              : isEditing
                ? 'Edit Payment Plan'
                : 'Select Payment Plan'}
          </DialogTitle>
          <DialogDescription>
            {currentPaymentPlan && !isEditing
              ? 'View the payment plan assigned to this student.'
              : 'Choose how this student will pay their fees.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {currentPaymentPlan && !isEditing ? (
            // Read-only view when payment plan is set
            <div className='space-y-4'>
              {/* Payment Plan Status */}
              <div className='p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800'>
                <div className='flex items-center gap-3'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <div>
                    <p className='font-medium text-green-900 dark:text-green-100'>
                      {hasCustomPlan
                        ? `Custom ${currentOption?.label}`
                        : currentOption?.label}
                    </p>
                    <p className='text-sm text-green-700 dark:text-green-300'>
                      {currentOption?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='space-y-2'>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsEditing(true)}
                    className='flex-1'
                  >
                    <CreditCard className='h-4 w-4 mr-2' />
                    Change Plan
                  </Button>
                  <Button
                    variant='outline'
                    onClick={handleRemovePaymentPlan}
                    disabled={loading}
                    className='text-red-600 hover:text-red-700 border-red-200 hover:border-red-300'
                  >
                    Remove
                  </Button>
                </div>

                {hasCustomPlan && (
                  <Button
                    variant='default'
                    onClick={() => setCustomizeOpen(true)}
                    className='w-full'
                  >
                    <Edit2 className='h-4 w-4 mr-2' />
                    Edit Customization
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Edit form when no payment plan or editing
            <div className='space-y-4'>
              {/* Current Payment Plan Display (when editing) */}
              {currentPaymentPlan && isEditing && currentOption && (
                <div className='p-3 bg-muted/50 rounded-lg'>
                  <p className='text-sm text-muted-foreground'>
                    Current:{' '}
                    {hasCustomPlan
                      ? `Custom ${currentOption.label}`
                      : currentOption.label}
                  </p>
                </div>
              )}

              {/* Payment Plan Selection */}
              <div className='space-y-3'>
                <p className='text-sm font-medium'>Choose payment structure:</p>
                <div className='grid gap-2'>
                  {PAYMENT_PLAN_OPTIONS.map(option => {
                    const IconComponent = option.icon;
                    const isSelected = selectedPaymentPlan === option.value;

                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentPlan(option.value)}
                        className='justify-start h-auto p-3'
                      >
                        <div className='flex items-center gap-3'>
                          <IconComponent className='h-4 w-4' />
                          <div className='text-left'>
                            <div className='font-medium'>{option.label}</div>
                            <div className='text-sm opacity-70'>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {currentPaymentPlan && !isEditing ? (
            // Read-only view footer
            <div className='flex gap-2 w-full'>
              <Button
                variant='outline'
                onClick={() => setOpen(false)}
                className='ml-auto'
              >
                Close
              </Button>
            </div>
          ) : (
            // Edit form footer
            <>
              <Button
                variant='outline'
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    // Reset form to current values
                    if (currentPaymentPlan) {
                      setSelectedPaymentPlan(currentPaymentPlan.payment_plan);
                    }
                  } else {
                    setOpen(false);
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  if (!selectedPaymentPlan) {
                    toast.error('Select a payment plan first');
                    return;
                  }
                  setCustomizeOpen(true);
                }}
                disabled={loading || !selectedPaymentPlan}
              >
                Customize Plan
              </Button>
              <Button
                onClick={handleSetPaymentPlan}
                disabled={loading || !selectedPaymentPlan}
              >
                {loading
                  ? 'Processing...'
                  : isEditing
                    ? 'Update Payment Plan'
                    : 'Set Payment Plan'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      {/* Customization modal reusing FeeCollectionSetupModal */}
      {customizeOpen && (
        <FeeCollectionSetupModal
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          cohortId={student.cohort_id}
          cohortStartDate={
            (student as { cohort_start_date?: string }).cohort_start_date ||
            new Date().toISOString()
          }
          onSetupComplete={async () => {
            // After saving custom plan, assign the chosen plan to the student
            try {
              if (!selectedPaymentPlan) return setCustomizeOpen(false);
              if (!user?.id) {
                toast.error('User not authenticated');
                return;
              }
              const result = await studentPaymentPlanService.setPaymentPlan(
                student.id,
                student.cohort_id,
                selectedPaymentPlan,
                user.id
              );
              if (result.success) {
                toast.success('Custom plan applied to student');
                await loadCurrentPaymentPlan();
                onPaymentPlanUpdated();
              } else {
                toast.error(result.error || 'Failed to assign payment plan');
              }
            } finally {
              setCustomizeOpen(false);
            }
          }}
          mode='edit'
          variant='student-custom'
          studentId={student.id}
          initialSelectedPlan={selectedPaymentPlan as string}
          restrictPaymentPlanToSelected
        />
      )}
    </Dialog>
  );
}
