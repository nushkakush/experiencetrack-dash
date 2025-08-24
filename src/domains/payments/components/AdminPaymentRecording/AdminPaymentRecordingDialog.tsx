/**
 * Refactored Admin Payment Recording Dialog
 * Main dialog container using modular components
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PaymentRecordingForm, PaymentRecordingData } from './PaymentRecordingForm';
import { PaymentSummary } from './PaymentSummary';
import { useAdminPaymentRecording } from './useAdminPaymentRecording';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';

interface Student {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string; // Added avatar_url to the Student interface
}

interface AdminPaymentRecordingDialogProps {
  student: Student;
  outstandingAmount: number;
  onPaymentRecorded: () => void;
  children: React.ReactNode;
}

enum DialogStep {
  FORM = 'form',
  SUMMARY = 'summary',
  SUCCESS = 'success',
}

export const AdminPaymentRecordingDialog: React.FC<AdminPaymentRecordingDialogProps> = React.memo(({
  student,
  outstandingAmount,
  onPaymentRecorded,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<DialogStep>(DialogStep.FORM);
  const [paymentData, setPaymentData] = useState<PaymentRecordingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    recordPayment,
    isRecording,
  } = useAdminPaymentRecording();

  const logger = Logger.getInstance();

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setCurrentStep(DialogStep.FORM);
      setPaymentData(null);
      setError(null);
    }
  }, []);

  const handleFormSubmit = useCallback(async (data: PaymentRecordingData) => {
    setError(null);
    setPaymentData(data);
    setCurrentStep(DialogStep.SUMMARY);
  }, []);

  const handlePaymentConfirm = useCallback(async () => {
    if (!paymentData) return;

    try {
      setError(null);
      
      await recordPayment({
        studentId: student.id,
        ...paymentData,
      });

      setCurrentStep(DialogStep.SUCCESS);
      onPaymentRecorded();
      toast.success('Payment recorded successfully');

      // Auto-close after success
      setTimeout(() => {
        setOpen(false);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      setError(errorMessage);
      logger.error('Payment recording failed', { 
        error: err, 
        studentId: student.id, 
        paymentData 
      });
      toast.error(errorMessage);
    }
  }, [paymentData, recordPayment, student.id, onPaymentRecorded, logger]);

  const handleEditPayment = useCallback(() => {
    setCurrentStep(DialogStep.FORM);
    setError(null);
  }, []);

  const handleFormCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const getDialogTitle = () => {
    switch (currentStep) {
      case DialogStep.FORM:
        return 'Record Payment';
      case DialogStep.SUMMARY:
        return 'Confirm Payment';
      case DialogStep.SUCCESS:
        return 'Payment Recorded';
      default:
        return 'Record Payment';
    }
  };

  const getDialogDescription = () => {
    switch (currentStep) {
      case DialogStep.FORM:
        return `Record a payment for ${student.name}`;
      case DialogStep.SUMMARY:
        return `Review payment details for ${student.name}`;
      case DialogStep.SUCCESS:
        return `Payment has been successfully recorded for ${student.name}`;
      default:
        return `Record a payment for ${student.name}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {currentStep === DialogStep.FORM && (
            <PaymentRecordingForm
              studentId={student.id}
              studentName={student.name}
              outstandingAmount={outstandingAmount}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={isRecording}
            />
          )}

          {currentStep === DialogStep.SUMMARY && paymentData && (
            <PaymentSummary
              studentName={student.name}
              paymentData={paymentData}
              onConfirm={handlePaymentConfirm}
              onEdit={handleEditPayment}
              loading={isRecording}
            />
          )}

          {currentStep === DialogStep.SUCCESS && (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Payment Recorded Successfully!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The payment has been added to {student.name}'s account.
              </p>
              {paymentData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
                  <div className="text-sm">
                    <strong>Amount:</strong> ₹{paymentData.amount.toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <strong>Method:</strong> {paymentData.paymentMethod}
                  </div>
                  {paymentData.transactionId && (
                    <div className="text-sm">
                      <strong>Transaction ID:</strong> {paymentData.transactionId}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student Info Footer */}
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
              <span>Outstanding: ₹{outstandingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AdminPaymentRecordingDialog.displayName = 'AdminPaymentRecordingDialog';
