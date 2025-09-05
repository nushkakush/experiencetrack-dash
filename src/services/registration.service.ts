import { supabase } from '@/integrations/supabase/client';
import { Cohort } from '@/types/cohort';
import { ApplicationConfiguration } from '@/types/applications';
import { Logger } from '@/lib/logging/Logger';

export interface CohortWithOpenApplications extends Cohort {
  application_fee?: number;
  application_deadline?: string;
}

export class RegistrationService {
  /**
   * Get all cohorts where application registration is currently open
   */
  static async getCohortsWithOpenApplications(): Promise<{
    data: CohortWithOpenApplications[] | null;
    error: string | null;
    success: boolean;
  }> {
    try {
      // Get application configurations that are set up and have registration open
      const { data: configs, error: configsError } = await supabase
        .from('application_configurations')
        .select(
          `
          *,
          cohorts!inner(*)
        `
        )
        .eq('is_setup_complete', true)
        .eq('is_registration_open', true);

      if (configsError) {
        Logger.getInstance().error(
          'getCohortsWithOpenApplications: Configs query error',
          {
            error: configsError,
          }
        );
        return {
          data: null,
          error: configsError.message,
          success: false,
        };
      }

      if (!configs || configs.length === 0) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      // Transform the data to match the expected interface
      const cohortsWithApplications: CohortWithOpenApplications[] = configs.map(
        config => ({
          ...config.cohorts,
          application_fee: config.application_fee,
        })
      );

      return {
        data: cohortsWithApplications,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error(
        'getCohortsWithOpenApplications: Caught error',
        { error }
      );
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch cohorts with open applications',
        success: false,
      };
    }
  }

  /**
   * Register a new user with cohort selection (self-registration flow)
   * Creates only a profiles record and student_applications record - no direct cohort assignment
   */
  static async registerUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string; // YYYY-MM-DD format
    qualification: string;
    cohortId: string;
  }): Promise<{
    success: boolean;
    error: string | null;
    userId?: string;
  }> {
    try {
      // Generate invitation token for email verification (not cohort invitation)
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create a profiles record with the registration data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          qualification: data.qualification,
          role: 'student',
          user_id: null, // Will be set after password setup
        })
        .select()
        .single();

      if (profileError) {
        Logger.getInstance().error('registerUser: Profile creation error', {
          error: profileError,
        });
        return {
          success: false,
          error: 'Failed to create user profile. Please try again.',
        };
      }

      // Create a student_applications record for tracking the application
      const { data: applicationData, error: applicationError } = await supabase
        .from('student_applications')
        .insert({
          cohort_id: data.cohortId,
          profile_id: profileData.id, // Direct reference to profile
          status: 'registration_initiated', // User registered, awaiting password setup
          registration_source: 'self_registration',
          registration_date: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          registration_completed: false, // Will be true after password setup
        })
        .select()
        .single();

      if (applicationError) {
        Logger.getInstance().error('registerUser: Application creation error', {
          error: applicationError,
        });
        // Clean up the profile record if application creation fails
        await supabase.from('profiles').delete().eq('id', profileData.id);

        return {
          success: false,
          error: 'Failed to create application record. Please try again.',
        };
      }

      // Send verification email via Edge Function
      try {
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
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
            },
            firstName: data.firstName,
            lastName: data.lastName,
            verificationToken: invitationToken,
            cohortId: data.cohortId,
            origin: window.location.origin,
          }),
        });

        const emailResult = await response.json();

        if (!emailResult.success) {
          Logger.getInstance().error('registerUser: Email sending error', {
            error: emailResult.error,
          });
          // Don't fail the registration if email fails - user can still use the verification URL
        } else {
          Logger.getInstance().info(
            'registerUser: Verification email sent successfully',
            {
              email: data.email,
              token: invitationToken,
            }
          );
        }
      } catch (emailError) {
        Logger.getInstance().error('registerUser: Email service error', {
          error: emailError,
        });
        // Don't fail the registration if email fails
      }

      return {
        success: true,
        error: null,
        userId: applicationData.id, // Return application_id for tracking
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      const errorDetails =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error;

      Logger.getInstance().error('registerUser: Caught error', {
        error: errorDetails,
        errorMessage,
        registrationData: {
          email: data.email,
          cohortId: data.cohortId,
          firstName: data.firstName,
        },
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Complete user registration after email verification
   */
  static async completeRegistration(
    userId: string,
    cohortId: string
  ): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      // Update cohort_students to mark as accepted
      const { error: cohortError } = await supabase
        .from('cohort_students')
        .update({
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (cohortError) {
        Logger.getInstance().error(
          'completeRegistration: Cohort update error',
          { error: cohortError }
        );
        return {
          success: false,
          error: 'Failed to complete cohort assignment',
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      Logger.getInstance().error('completeRegistration: Caught error', {
        error,
      });
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to complete registration',
      };
    }
  }
}
