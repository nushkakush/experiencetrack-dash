import { supabase } from '@/integrations/supabase/client';
import { StudentApplication, ApplicationStatus } from '@/types/applications';
import { Cohort } from '@/types/cohort';

export interface StudentApplicationWithCohort extends StudentApplication {
  cohort: Cohort;
}

export class StudentApplicationsService {
  /**
   * Get all applications for a specific student (by profile_id)
   */
  static async getStudentApplications(profileId: string): Promise<{
    success: boolean;
    data: StudentApplicationWithCohort[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            name,
            description,
            start_date,
            end_date,
            max_students,
            created_at,
            updated_at
          )
        `
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student applications:', error);
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        error: null,
      };
    } catch (error) {
      console.error('Error in getStudentApplications:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get applications that are registered but not yet enrolled
   */
  static async getRegisteredApplications(profileId: string): Promise<{
    success: boolean;
    data: StudentApplicationWithCohort[] | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            name,
            description,
            start_date,
            end_date,
            max_students,
            created_at,
            updated_at
          )
        `
        )
        .eq('profile_id', profileId)
        .in('status', [
          'registration_initiated',
          'registration_complete',
          'registration_paid',
          'application_initiated',
          'application_accepted',
          'interview_scheduled',
          'interview_selected',
          'application_on_hold',
        ])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching registered applications:', error);
        return {
          success: false,
          data: null,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
        error: null,
      };
    } catch (error) {
      console.error('Error in getRegisteredApplications:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the next step for a student based on their application status
   */
  static getNextStep(status: ApplicationStatus): {
    step: string;
    description: string;
    action: string;
    route: string;
  } {
    switch (status) {
      case 'registration_initiated':
        return {
          step: 'Complete Registration',
          description: 'Set up your password and complete your account setup',
          action: 'Complete Registration',
          route: '/auth/self-registration-verification',
        };
      case 'registration_complete':
      case 'registration_paid':
        return {
          step: 'Start Application',
          description:
            'Fill out your application form and begin the application process',
          action: 'Start Application',
          route: '/auth/application-process',
        };
      case 'application_initiated':
        return {
          step: 'Continue Application',
          description:
            'Complete your application form and proceed to the next steps',
          action: 'Continue Application',
          route: '/auth/application-process',
        };
      case 'application_accepted':
        return {
          step: 'Schedule Interview',
          description:
            'Your application has been accepted! Schedule your interview',
          action: 'Schedule Interview',
          route: '/auth/application-process',
        };
      case 'interview_scheduled':
        return {
          step: 'Prepare for Interview',
          description:
            'Your interview has been scheduled. Prepare for your upcoming interview',
          action: 'View Details',
          route: '/auth/application-process',
        };
      case 'interview_selected':
        return {
          step: 'Complete LITMUS Test',
          description:
            'Congratulations! Complete your LITMUS test to finalize enrollment',
          action: 'Take LITMUS Test',
          route: '/auth/application-process',
        };
      case 'application_on_hold':
        return {
          step: 'Application Under Review',
          description:
            'Your application is being reviewed. We will contact you soon',
          action: 'View Status',
          route: '/auth/application-process',
        };
      default:
        return {
          step: 'Continue Process',
          description: 'Continue with your application process',
          action: 'Continue',
          route: '/auth/application-process',
        };
    }
  }

  /**
   * Get status display information
   */
  static getStatusDisplay(status: ApplicationStatus): {
    label: string;
    color: string;
    description: string;
  } {
    switch (status) {
      case 'registration_initiated':
        return {
          label: 'Registration Started',
          color: 'blue',
          description: 'Complete your account setup',
        };
      case 'registration_complete':
      case 'registration_paid':
        return {
          label: 'Registration Complete',
          color: 'green',
          description: 'Ready to start application',
        };
      case 'application_initiated':
        return {
          label: 'Application Started',
          color: 'purple',
          description: 'Complete your application form',
        };
      case 'application_accepted':
        return {
          label: 'Application Accepted',
          color: 'green',
          description: 'Proceed to interview',
        };
      case 'interview_scheduled':
        return {
          label: 'Interview Scheduled',
          color: 'orange',
          description: 'Interview date confirmed',
        };
      case 'interview_selected':
        return {
          label: 'Interview Passed',
          color: 'green',
          description: 'Take LITMUS test',
        };
      case 'application_on_hold':
        return {
          label: 'Under Review',
          color: 'yellow',
          description: 'Application being reviewed',
        };
      default:
        return {
          label: 'In Progress',
          color: 'gray',
          description: 'Application in progress',
        };
    }
  }
}
