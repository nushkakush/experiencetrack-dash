/**
 * Payment Plan Form Component
 * Handles payment plan form logic and submission
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { PaymentPlanSelector, PaymentPlanType } from './PaymentPlanSelector';
import { PaymentPlanData } from './PaymentPlanDisplay';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';

export interface PaymentPlanFormData {
  studentId: string;
  paymentPlan: PaymentPlanType;
  isCustom?: boolean;
}

interface PaymentPlanFormProps {
  studentId: string;
  currentPlan?: PaymentPlanData;
  onSubmit: (data: PaymentPlanFormData) => Promise<void>;
  onCancel: () => void;
  onCustomize: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PaymentPlanForm: React.FC<PaymentPlanFormProps> = React.memo(({
  studentId,
  currentPlan,
  onSubmit,
  onCancel,
  onCustomize,
  loading = false,
  disabled = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanType | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logger = Logger.getInstance();

  const handleSubmit = useCallback(async () => {
    if (!selectedPlan) {
      setError('Please select a payment plan');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        studentId,
        paymentPlan: selectedPlan,
        isCustom: false,
      });

      toast.success('Payment plan updated successfully');
      setSelectedPlan('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment plan';
      setError(errorMessage);
      logger.error('Payment plan submission failed', { 
        error: err, 
        studentId, 
        selectedPlan 
      });
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [selectedPlan, onSubmit, studentId, logger]);

  const handleCustomize = useCallback(() => {
    if (!selectedPlan) {
      setError('Please select a payment plan to customize');
      return;
    }
    onCustomize();
  }, [selectedPlan, onCustomize]);

  const isFormValid = selectedPlan !== '';
  const isSubmitDisabled = loading || disabled || submitting || !isFormValid;

  return (
    <div className="space-y-4">
      {/* Current Plan Info */}
      {currentPlan && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Currently using <strong>{currentPlan.is_custom ? 'Custom ' : ''}{currentPlan.payment_plan.replace('_', ' ')}</strong> plan.
            Select a new plan to change the payment structure.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payment Plan Selection */}
      <PaymentPlanSelector
        selectedPlan={selectedPlan}
        onPlanSelect={setSelectedPlan}
        disabled={isSubmitDisabled}
        currentPlan={currentPlan?.payment_plan}
        hasCustomPlan={currentPlan?.is_custom}
      />

      {/* Selected Plan Preview */}
      {selectedPlan && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-sm">
            <strong>Selected:</strong> {selectedPlan.replace('_', ' ')} payment plan
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            You can customize the specific amounts and dates after selecting this plan
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-between pt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          
          {selectedPlan && (
            <Button
              variant="outline"
              onClick={handleCustomize}
              disabled={isSubmitDisabled}
            >
              Customize Plan
            </Button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {currentPlan ? 'Update Plan' : 'Set Payment Plan'}
        </Button>
      </div>

      {/* Form Validation Help */}
      {!isFormValid && (
        <div className="text-xs text-muted-foreground">
          Please select a payment plan to continue
        </div>
      )}
    </div>
  );
});

PaymentPlanForm.displayName = 'PaymentPlanForm';
