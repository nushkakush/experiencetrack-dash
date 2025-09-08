import { useState, useEffect } from 'react';
import {
  ApplicationFeeService,
  ApplicationFeeInfo,
} from '@/services/applicationFee.service';
import { UniversalPaymentService } from '@/services/payments/UniversalPaymentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';

export interface UseApplicationFeePaymentResult {
  feeInfo: ApplicationFeeInfo | null;
  loading: boolean;
  processing: boolean;
  error: string | null;
  isPaymentCompleted: boolean;
  paymentCompletedAt: string | null;
  initiatePayment: (onPaymentSuccess?: () => void) => Promise<void>;
  refreshFeeInfo: () => Promise<void>;
}

export const useApplicationFeePayment = (
  profileId: string
): UseApplicationFeePaymentResult => {
  const [feeInfo, setFeeInfo] = useState<ApplicationFeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [paymentCompletedAt, setPaymentCompletedAt] = useState<string | null>(
    null
  );

  const loadFeeInfo = async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      const result =
        await ApplicationFeeService.getCurrentApplicationFee(profileId);

      if (result.success && result.data) {
        setFeeInfo(result.data);
      } else {
        setError(result.error || 'Failed to load application fee');
        console.error('Failed to load application fee:', result.error);
      }

      // Also check payment completion status
      await checkPaymentStatus();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to load application fee';
      setError(errorMessage);
      Logger.getInstance().error('Error loading application fee', {
        error,
        profileId,
      });
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (onPaymentSuccess?: () => void) => {
    if (!feeInfo || !profileId) {
      toast.error('Application fee information not available');
      return;
    }

    if (feeInfo.amount <= 0) {
      toast.error('No application fee required');
      return;
    }

    setProcessing(true);

    try {
      console.log(
        '🔍 [DEBUG] useApplicationFeePayment - initiating payment with amount:',
        feeInfo.amount
      );
      const paymentRequest =
        UniversalPaymentService.createApplicationFeePayment(
          feeInfo.amount,
          feeInfo.cohortId,
          profileId,
          async () => {
            // Payment success callback
            console.log('🔍 [DEBUG] Application fee payment successful');
            toast.success('Application fee paid successfully!');

            // Update application status to indicate payment completed
            await updateApplicationPaymentStatus();

            // Refresh fee info
            await loadFeeInfo();

            // Call the custom success callback if provided
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
          },
          error => {
            // Payment error callback
            console.error('❌ [DEBUG] Application fee payment failed:', error);
            toast.error(`Payment failed: ${error}`);
          }
        );

      const result =
        await UniversalPaymentService.initiatePayment(paymentRequest);

      if (!result.success) {
        toast.error(result.error || 'Failed to initiate payment');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to initiate payment';
      Logger.getInstance().error('Error initiating application fee payment', {
        error,
        profileId,
        feeInfo,
      });
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const updateApplicationPaymentStatus = async () => {
    try {
      const { error } = await supabase
        .from('student_applications')
        .update({
          status: 'application_fee_paid',
          application_fee_paid: true,
          application_fee_paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId);

      if (error) {
        Logger.getInstance().error(
          'Failed to update application payment status',
          { error, profileId }
        );
        console.error('Failed to update application payment status:', error);
      } else {
        console.log(
          '🔍 [DEBUG] Application payment status updated successfully'
        );
      }
    } catch (error) {
      Logger.getInstance().error('Error updating application payment status', {
        error,
        profileId,
      });
      console.error('Error updating application payment status:', error);
    }
  };

  const checkPaymentStatus = async () => {
    if (!profileId) return;

    try {
      const { data: application, error } = await supabase
        .from('student_applications')
        .select('application_fee_paid, application_fee_paid_at, status')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        Logger.getInstance().error('Failed to check payment status', {
          error,
          profileId,
        });
        return;
      }

      if (application) {
        setIsPaymentCompleted(application.application_fee_paid || false);
        setPaymentCompletedAt(application.application_fee_paid_at);

        console.log('🔍 [DEBUG] Payment status check:', {
          isPaymentCompleted: application.application_fee_paid,
          paymentCompletedAt: application.application_fee_paid_at,
          status: application.status,
        });
      }
    } catch (error) {
      Logger.getInstance().error('Error checking payment status', {
        error,
        profileId,
      });
    }
  };

  const refreshFeeInfo = async () => {
    await loadFeeInfo();
  };

  useEffect(() => {
    loadFeeInfo();
  }, [profileId]);

  return {
    feeInfo,
    loading,
    processing,
    error,
    isPaymentCompleted,
    paymentCompletedAt,
    initiatePayment,
    refreshFeeInfo,
  };
};
