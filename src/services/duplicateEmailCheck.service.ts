import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

export interface DuplicateEmailStatus {
  exists: boolean;
  isRegistrationCompleted: boolean;
  profileId?: string;
  applicationId?: string;
  invitationToken?: string;
  invitationExpiresAt?: string;
  firstName?: string;
  lastName?: string;
  cohortId?: string;
  cohortName?: string;
}

export class DuplicateEmailCheckService {
  /**
   * Check if an email already exists and determine registration status
   */
  static async checkEmailStatus(email: string): Promise<{
    success: boolean;
    data?: DuplicateEmailStatus;
    error?: string;
  }> {
    try {
      Logger.getInstance().info('Checking email duplicate status', { email });

      // First check if there's a profile with this email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, user_id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new emails
        Logger.getInstance().error('Error checking profile for duplicate email', {
          error: profileError,
          email,
        });
        return {
          success: false,
          error: 'Failed to check email status. Please try again.',
        };
      }

      // If no profile found, email is not duplicate
      if (!profile) {
        return {
          success: true,
          data: {
            exists: false,
            isRegistrationCompleted: false,
          },
        };
      }

      // Profile exists, now check if registration is completed
      const isRegistrationCompleted = !!profile.user_id;

      // Get the latest application for this profile
      const { data: application, error: applicationError } = await supabase
        .from('student_applications')
        .select(`
          id,
          cohort_id,
          invitation_token,
          invitation_expires_at,
          registration_completed,
          cohorts (
            name
          )
        `)
        .eq('profile_id', profile.id)
        .order('registration_date', { ascending: false })
        .limit(1)
        .single();

      if (applicationError && applicationError.code !== 'PGRST116') {
        Logger.getInstance().warn('Error fetching application for duplicate email', {
          error: applicationError,
          profileId: profile.id,
        });
      }

      const result: DuplicateEmailStatus = {
        exists: true,
        isRegistrationCompleted,
        profileId: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        cohortId: application?.cohort_id,
        cohortName: application?.cohorts?.name,
        applicationId: application?.id,
        invitationToken: application?.invitation_token,
        invitationExpiresAt: application?.invitation_expires_at,
      };

      Logger.getInstance().info('Email duplicate status determined', {
        email,
        result,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error checking duplicate email status', {
        error: errorMessage,
        email,
      });
      return {
        success: false,
        error: 'Failed to check email status. Please try again.',
      };
    }
  }

  /**
   * Resend confirmation email for incomplete registration
   */
  static async resendConfirmationEmail(
    email: string,
    profileId: string,
    applicationId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      Logger.getInstance().info('Resending confirmation email', {
        email,
        profileId,
        applicationId,
      });

      // Get the application details
      const { data: application, error: applicationError } = await supabase
        .from('student_applications')
        .select(`
          invitation_token,
          invitation_expires_at,
          cohorts (
            name
          )
        `)
        .eq('id', applicationId)
        .single();

      if (applicationError || !application) {
        Logger.getInstance().error('Error fetching application for resend', {
          error: applicationError,
          applicationId,
        });
        return {
          success: false,
          error: 'Application not found. Please try registering again.',
        };
      }

      // Check if invitation is still valid
      const now = new Date();
      const expiresAt = new Date(application.invitation_expires_at);
      if (now > expiresAt) {
        // Generate new invitation token
        const newToken = crypto.randomUUID();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        // Update the application with new token
        const { error: updateError } = await supabase
          .from('student_applications')
          .update({
            invitation_token: newToken,
            invitation_expires_at: newExpiresAt.toISOString(),
          })
          .eq('id', applicationId);

        if (updateError) {
          Logger.getInstance().error('Error updating invitation token', {
            error: updateError,
            applicationId,
          });
          return {
            success: false,
            error: 'Failed to generate new invitation. Please try again.',
          };
        }

        application.invitation_token = newToken;
        application.invitation_expires_at = newExpiresAt.toISOString();
      }

      // Get profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profileId)
        .single();

      if (profileError || !profile) {
        Logger.getInstance().error('Error fetching profile for resend', {
          error: profileError,
          profileId,
        });
        return {
          success: false,
          error: 'Profile not found. Please try registering again.',
        };
      }

      // Send verification email
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'verification',
          recipient: {
            email: email,
            name: `${profile.first_name} ${profile.last_name}`,
          },
          firstName: profile.first_name,
          lastName: profile.last_name,
          verificationToken: application.invitation_token,
          cohortId: application.cohort_id,
          origin: window.location.origin,
        }),
      });

      const emailResult = await response.json();

      if (emailResult.success) {
        Logger.getInstance().info('Confirmation email resent successfully', {
          email,
          applicationId,
        });
        return { success: true };
      } else {
        Logger.getInstance().error('Failed to resend confirmation email', {
          error: emailResult.error,
          email,
          applicationId,
        });
        return {
          success: false,
          error: emailResult.error || 'Failed to send confirmation email. Please try again.',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error resending confirmation email', {
        error: errorMessage,
        email,
        profileId,
        applicationId,
      });
      return {
        success: false,
        error: 'Failed to resend confirmation email. Please try again.',
      };
    }
  }

  /**
   * Delete existing profile and application records to allow fresh application
   */
  static async deleteExistingRecords(
    profileId: string,
    applicationId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      Logger.getInstance().info('Deleting existing records for fresh application', {
        profileId,
        applicationId,
      });

      // Delete the student application first (due to foreign key constraints)
      const { error: applicationError } = await supabase
        .from('student_applications')
        .delete()
        .eq('id', applicationId);

      if (applicationError) {
        Logger.getInstance().error('Error deleting application record', {
          error: applicationError,
          applicationId,
        });
        return {
          success: false,
          error: 'Failed to delete application record. Please try again.',
        };
      }

      // Delete the profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) {
        Logger.getInstance().error('Error deleting profile record', {
          error: profileError,
          profileId,
        });
        return {
          success: false,
          error: 'Failed to delete profile record. Please try again.',
        };
      }

      Logger.getInstance().info('Successfully deleted existing records for fresh application', {
        profileId,
        applicationId,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error deleting existing records', {
        error: errorMessage,
        profileId,
        applicationId,
      });
      return {
        success: false,
        error: 'Failed to delete existing records. Please try again.',
      };
    }
  }
}
