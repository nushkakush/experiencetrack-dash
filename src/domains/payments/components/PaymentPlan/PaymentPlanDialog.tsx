/**
 * Refactored Payment Plan Dialog
 * Main dialog container using modular components
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PaymentPlanForm, PaymentPlanFormData } from './PaymentPlanForm';
import { PaymentPlanDisplay, PaymentPlanData } from './PaymentPlanDisplay';
import { usePaymentPlan } from './usePaymentPlan';
import { CohortStudent } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

interface PaymentPlanDialogProps {
  student: CohortStudent;
  onPaymentPlanUpdated: () => void;
  children: React.ReactNode;
}

export const PaymentPlanDialog: React.FC<PaymentPlanDialogProps> = React.memo(({
  student,
  onPaymentPlanUpdated,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const {
    paymentPlan,
    loading,
    error,
    loadPaymentPlan,
    updatePaymentPlan,
    hasCustomPlan,
  } = usePaymentPlan(student.id);

  const logger = Logger.getInstance();

  // Load payment plan when dialog opens
  useEffect(() => {
    if (open) {
      loadPaymentPlan();
      setIsEditing(!paymentPlan); // Start in edit mode if no plan exists
    }
  }, [open, loadPaymentPlan, paymentPlan]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setIsEditing(false);
      setCustomizeOpen(false);
    }
  }, []);

  const handleFormSubmit = useCallback(async (formData: PaymentPlanFormData) => {
    try {
      await updatePaymentPlan(formData);
      onPaymentPlanUpdated();
      setIsEditing(false);
    } catch (error) {
      logger.error('Failed to update payment plan', { error, studentId: student.id });
      throw error; // Re-throw to let form handle the error
    }
  }, [updatePaymentPlan, onPaymentPlanUpdated, student.id, logger]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleCustomize = useCallback(() => {
    setCustomizeOpen(true);
    // Note: This would open the FeeCollectionSetupModal in the original implementation
    // For now, we'll just toggle the state
  }, []);

  const hasPaymentPlan = !!paymentPlan;
  const isInitialSetup = !hasPaymentPlan && !isEditing;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isInitialSetup 
              ? 'Set Payment Plan' 
              : isEditing 
                ? 'Edit Payment Plan' 
                : 'Payment Plan Details'
            }
          </DialogTitle>
          <DialogDescription>
            {isInitialSetup 
              ? `Set up payment plan for ${student.name}`
              : isEditing 
                ? `Update payment plan for ${student.name}`
                : `View and manage payment plan for ${student.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading payment plan...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <Button variant="outline" onClick={loadPaymentPlan}>
                Retry
              </Button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {hasPaymentPlan && !isEditing ? (
                // Display Mode - Show current payment plan
                <PaymentPlanDisplay
                  paymentPlan={paymentPlan}
                  onEdit={handleEdit}
                  onCustomize={handleCustomize}
                  loading={loading}
                />
              ) : (
                // Edit/Setup Mode - Show form
                <PaymentPlanForm
                  studentId={student.id}
                  currentPlan={paymentPlan || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={hasPaymentPlan ? handleCancel : () => setOpen(false)}
                  onCustomize={handleCustomize}
                  loading={loading}
                />
              )}
            </>
          )}

          {/* Student Info */}
          <div className="pt-4 border-t text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserAvatar
                  avatarUrl={student.avatar_url}
                  name={student.name}
                  size="sm"
                />
                <span>Student: {student.name}</span>
              </div>
              <span>ID: {student.id}</span>
            </div>
          </div>
        </div>

        {/* Customize Modal Integration Point */}
        {customizeOpen && (
          <div className="text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded">
            Fee customization modal would open here
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

PaymentPlanDialog.displayName = 'PaymentPlanDialog';
