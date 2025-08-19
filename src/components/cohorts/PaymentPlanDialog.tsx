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
import { CreditCard, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  studentPaymentPlanService,
  PaymentPlan,
  StudentPaymentPlan,
} from '@/services/studentPaymentPlan.service';

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
  const [currentPaymentPlan, setCurrentPaymentPlan] = useState<StudentPaymentPlan | null>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan | ''>('');

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

  const handleRemovePaymentPlan = async () => {
    if (!currentPaymentPlan) return;

    setLoading(true);
    try {
      const logger = new Logger('PaymentPlanDialog');
      logger.info('Admin: Attempting to remove payment plan', {
        studentId: student.id,
        paymentPlanId: currentPaymentPlan.id,
      });

      const result = await studentPaymentPlanService.removePaymentPlan(student.id);

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
    return PAYMENT_PLAN_OPTIONS.find(option => option.value === currentPaymentPlan.payment_plan);
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
              <div className='p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800'>
                <div className='flex items-center gap-2 mb-2'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  <h3 className='font-semibold text-green-900 dark:text-green-100'>
                    Payment Plan Assigned
                  </h3>
                </div>
                {currentOption && (
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <currentOption.icon className='h-4 w-4 text-green-600' />
                      <p className='text-sm font-medium'>
                        {currentOption.label}
                      </p>
                    </div>
                    <p className='text-sm text-green-700 dark:text-green-300'>
                      {currentOption.description}
                    </p>
                  </div>
                )}
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsEditing(true)}
                  className='flex-1'
                >
                  <CreditCard className='h-4 w-4 mr-2' />
                  Edit Payment Plan
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
            </div>
          ) : (
            // Edit form when no payment plan or editing
            <div className='space-y-4'>
              {/* Current Payment Plan Display (when editing) */}
              {currentPaymentPlan && isEditing && currentOption && (
                <div className='p-3 bg-muted/50 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium'>Current Payment Plan:</p>
                      <div className='flex items-center gap-2 mt-1'>
                        <currentOption.icon className='h-4 w-4 text-muted-foreground' />
                        <p className='text-sm text-muted-foreground'>
                          {currentOption.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Plan Selection */}
              <div className='space-y-2'>
                <div className='text-sm font-medium'>Choose payment structure:</div>
                <div className='grid gap-3'>
                  {PAYMENT_PLAN_OPTIONS.map(option => {
                    const IconComponent = option.icon;
                    const isSelected = selectedPaymentPlan === option.value;
                    
                    return (
                      <Button
                        key={option.value}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentPlan(option.value)}
                        className='justify-start h-auto p-4'
                      >
                        <div className='flex items-start gap-3 text-left'>
                          <IconComponent className='h-5 w-5 mt-0.5 flex-shrink-0' />
                          <div>
                            <div className='font-medium'>{option.label}</div>
                            <div className='text-sm opacity-70 mt-1'>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Plan Summary */}
              {selectedOption && (
                <div className='p-3 bg-blue-50 dark:bg-blue-950 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <selectedOption.icon className='h-4 w-4 text-blue-600' />
                    <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                      Selected: {selectedOption.label}
                    </p>
                  </div>
                  <p className='text-xs text-blue-700 dark:text-blue-300 mt-1'>
                    {selectedOption.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {currentPaymentPlan && !isEditing ? (
            // Read-only view footer
            <Button onClick={() => setOpen(false)}>Close</Button>
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
    </Dialog>
  );
}
