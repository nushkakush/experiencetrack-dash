import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, RefreshCw, KeyRound, AlertCircle, RotateCcw } from 'lucide-react';
import { DuplicateEmailCheckService, DuplicateEmailStatus } from '@/services/duplicateEmailCheck.service';
import { toast } from 'sonner';

interface DuplicateEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  duplicateStatus: DuplicateEmailStatus;
  onResendConfirmation: () => void;
  onRedirectToPasswordReset: () => void;
  onStartFresh: () => void;
}

export const DuplicateEmailModal: React.FC<DuplicateEmailModalProps> = ({
  isOpen,
  onClose,
  email,
  duplicateStatus,
  onResendConfirmation,
  onRedirectToPasswordReset,
  onStartFresh,
}) => {
  const [loading, setLoading] = useState(false);

  const handleResendConfirmation = async () => {
    if (!duplicateStatus.profileId || !duplicateStatus.applicationId) {
      toast.error('Unable to resend confirmation. Please try registering again.');
      return;
    }

    setLoading(true);
    try {
      const result = await DuplicateEmailCheckService.resendConfirmationEmail(
        email,
        duplicateStatus.profileId,
        duplicateStatus.applicationId
      );

      if (result.success) {
        toast.success('Confirmation email sent! Please check your inbox.');
        onResendConfirmation();
        onClose();
      } else {
        toast.error(result.error || 'Failed to send confirmation email. Please try again.');
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    onRedirectToPasswordReset();
    onClose();
  };

  const handleStartFresh = () => {
    onStartFresh();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Email Already Exists</DialogTitle>
          </div>
          <DialogDescription>
            An account with the email <strong>{email}</strong> already exists.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!duplicateStatus.isRegistrationCompleted ? (
            // Incomplete registration - show resend confirmation option
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Registration Incomplete
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You started registering but haven't completed setting up your password yet.
                    {duplicateStatus.cohortName && (
                      <span> You were applying for <strong>{duplicateStatus.cohortName}</strong>.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We can send you a new confirmation link to complete your registration.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full"
                    variant="default"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Confirmation Link Again
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleStartFresh}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start Fresh Application
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Completed registration - show password reset option
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <KeyRound className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Account Already Exists
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You already have an account with this email address.
                    {duplicateStatus.cohortName && (
                      <span> You're enrolled in <strong>{duplicateStatus.cohortName}</strong>.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  If you forgot your password, you can reset it to access your account.
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={handlePasswordReset}
                    className="w-full"
                    variant="default"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button
                    onClick={handleStartFresh}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start Fresh Application
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
