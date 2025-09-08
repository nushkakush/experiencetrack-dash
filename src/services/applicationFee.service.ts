import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

export interface ApplicationFeeInfo {
  amount: number;
  cohortId: string;
  cohortName: string;
  isSetupComplete: boolean;
  isRegistrationOpen: boolean;
}

export class ApplicationFeeService {
  /**
   * Get application fee information for a specific cohort
   */
  static async getApplicationFee(cohortId: string): Promise<{
    data: ApplicationFeeInfo | null;
    error: string | null;
    success: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('application_configurations')
        .select(
          `
          application_fee,
          is_setup_complete,
          is_registration_open,
          cohorts!inner(
            id,
            name
          )
        `
        )
        .eq('cohort_id', cohortId)
        .single();

      if (error) {
        Logger.getInstance().error('Failed to fetch application fee', {
          error,
          cohortId,
        });
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      if (!data) {
        return {
          data: null,
          error: 'No application configuration found for this cohort',
          success: false,
        };
      }

      const feeInfo: ApplicationFeeInfo = {
        amount: parseFloat(data.application_fee),
        cohortId: data.cohorts.id,
        cohortName: data.cohorts.name,
        isSetupComplete: data.is_setup_complete,
        isRegistrationOpen: data.is_registration_open,
      };

      console.log('🔍 [DEBUG] ApplicationFeeService - parsed fee info:', {
        rawAmount: data.application_fee,
        parsedAmount: feeInfo.amount,
        type: typeof feeInfo.amount,
      });

      return {
        data: feeInfo,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error in getApplicationFee', {
        error,
        cohortId,
      });
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch application fee',
        success: false,
      };
    }
  }

  /**
   * Get application fee for the current user's application
   */
  static async getCurrentApplicationFee(profileId: string): Promise<{
    data: ApplicationFeeInfo | null;
    error: string | null;
    success: boolean;
  }> {
    try {
      // First get the application to find the cohort
      const { data: application, error: appError } = await supabase
        .from('student_applications')
        .select('cohort_id')
        .eq('profile_id', profileId)
        .single();

      if (appError) {
        Logger.getInstance().error('Failed to fetch application', {
          error: appError,
          profileId,
        });
        return {
          data: null,
          error: appError.message,
          success: false,
        };
      }

      if (!application?.cohort_id) {
        return {
          data: null,
          error: 'No application found for this profile',
          success: false,
        };
      }

      // Get the application fee for the cohort
      return await this.getApplicationFee(application.cohort_id);
    } catch (error) {
      Logger.getInstance().error('Error in getCurrentApplicationFee', {
        error,
        profileId,
      });
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch application fee',
        success: false,
      };
    }
  }
}
