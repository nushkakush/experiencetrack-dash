import { supabase } from '@/integrations/supabase/client';
import {
  ApplicationConfiguration,
  ApplicationConfigurationInsert,
  ApplicationConfigurationUpdate,
  FormQuestion,
  FormQuestionInsert,
  FormQuestionUpdate,
  StudentApplication,
  StudentApplicationInsert,
  StudentApplicationUpdate,
} from '@/types/applications';

export class ApplicationConfigurationService {
  /**
   * Get complete application configuration for a cohort including all questions
   * Similar to FeeStructureService.getCompleteFeeStructure()
   */
  static async getCompleteConfiguration(cohortId: string): Promise<{
    configuration: ApplicationConfiguration | null;
    isSetupComplete: boolean;
  }> {
    try {
      // Get the main configuration
      const { data: config, error: configError } = await supabase
        .from('application_configurations')
        .select('*')
        .eq('cohort_id', cohortId)
        .maybeSingle();

      if (configError) {
        console.error('Error fetching application configuration:', configError);
        return { configuration: null, isSetupComplete: false };
      }

      if (!config) {
        return { configuration: null, isSetupComplete: false };
      }

      // Get all questions for this configuration
      const { data: questions, error: questionsError } = await supabase
        .from('application_form_questions')
        .select('*')
        .eq('configuration_id', config.id)
        .order('question_order', { ascending: true });

      if (questionsError) {
        console.error(
          'Error fetching application form questions:',
          questionsError
        );
      }

      const configuration: ApplicationConfiguration = {
        ...config,
        questions: questions || [],
      };

      return {
        configuration,
        isSetupComplete: config.is_setup_complete,
      };
    } catch (error) {
      console.error('Error in getCompleteConfiguration:', error);
      return { configuration: null, isSetupComplete: false };
    }
  }

  /**
   * Create or update application configuration
   */
  static async upsertConfiguration(
    config:
      | ApplicationConfigurationInsert
      | (ApplicationConfigurationUpdate & { id: string })
  ): Promise<ApplicationConfiguration | null> {
    try {
      if ('id' in config) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('application_configurations')
          .update(config)
          .eq('id', config.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating application configuration:', error);
          return null;
        }

        return data;
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('application_configurations')
          .insert(config)
          .select()
          .single();

        if (error) {
          console.error('Error creating application configuration:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in upsertConfiguration:', error);
      return null;
    }
  }

  /**
   * Mark configuration as complete
   */
  static async markConfigurationComplete(cohortId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_configurations')
        .update({ is_setup_complete: true })
        .eq('cohort_id', cohortId);

      if (error) {
        console.error('Error marking configuration complete:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markConfigurationComplete:', error);
      return false;
    }
  }

  /**
   * Toggle registration status for a cohort
   */
  static async toggleRegistrationStatus(
    cohortId: string,
    isOpen: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_configurations')
        .update({ is_registration_open: isOpen })
        .eq('cohort_id', cohortId);

      if (error) {
        console.error('Error toggling registration status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleRegistrationStatus:', error);
      return false;
    }
  }

  /**
   * Add a new question to the form
   */
  static async addQuestion(
    question: FormQuestionInsert
  ): Promise<FormQuestion | null> {
    try {
      const { data, error } = await supabase
        .from('application_form_questions')
        .insert(question)
        .select()
        .single();

      if (error) {
        console.error('Error adding form question:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addQuestion:', error);
      return null;
    }
  }

  /**
   * Update an existing question
   */
  static async updateQuestion(
    questionId: string,
    updates: FormQuestionUpdate
  ): Promise<FormQuestion | null> {
    try {
      const { data, error } = await supabase
        .from('application_form_questions')
        .update(updates)
        .eq('id', questionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating form question:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateQuestion:', error);
      return null;
    }
  }

  /**
   * Delete a question
   */
  static async deleteQuestion(questionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('application_form_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.error('Error deleting form question:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      return false;
    }
  }

  /**
   * Reorder questions by updating their order values
   */
  static async reorderQuestions(
    configurationId: string,
    questionOrders: { id: string; order: number }[]
  ): Promise<boolean> {
    try {
      // Update each question's order in a transaction-like manner
      const updates = questionOrders.map(({ id, order }) =>
        supabase
          .from('application_form_questions')
          .update({ question_order: order })
          .eq('id', id)
          .eq('configuration_id', configurationId)
      );

      const results = await Promise.all(updates);

      // Check if any updates failed
      const hasError = results.some(result => result.error);
      if (hasError) {
        console.error(
          'Error reordering questions:',
          results.filter(r => r.error)
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reorderQuestions:', error);
      return false;
    }
  }

  /**
   * Get the next available question order for a configuration
   */
  static async getNextQuestionOrder(configurationId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('application_form_questions')
        .select('question_order')
        .eq('configuration_id', configurationId)
        .order('question_order', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting next question order:', error);
        return 1;
      }

      return data.length > 0 ? data[0].question_order + 1 : 1;
    } catch (error) {
      console.error('Error in getNextQuestionOrder:', error);
      return 1;
    }
  }

  /**
   * Student application methods
   */

  /**
   * Create or update a student application
   */
  static async upsertStudentApplication(
    application:
      | StudentApplicationInsert
      | (StudentApplicationUpdate & { id: string })
  ): Promise<StudentApplication | null> {
    try {
      if ('id' in application) {
        // Update existing application
        const { data, error } = await supabase
          .from('student_applications')
          .update(application)
          .eq('id', application.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating student application:', error);
          return null;
        }

        return data;
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('student_applications')
          .insert(application)
          .select()
          .single();

        if (error) {
          console.error('Error creating student application:', error);
          return null;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in upsertStudentApplication:', error);
      return null;
    }
  }

  /**
   * Get student application for a specific cohort and student
   */
  static async getStudentApplication(
    cohortId: string,
    studentId: string
  ): Promise<StudentApplication | null> {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student application:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getStudentApplication:', error);
      return null;
    }
  }

  /**
   * Get all applications for a cohort
   */
  static async getCohortApplications(
    cohortId: string
  ): Promise<StudentApplication[]> {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort_students!inner(
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('cohort_id', cohortId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cohort applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCohortApplications:', error);
      return [];
    }
  }

  /**
   * Submit an application (change status from draft to submitted)
   */
  static async submitApplication(applicationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('student_applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error submitting application:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in submitApplication:', error);
      return false;
    }
  }

  /**
   * Review an application (approve/reject with notes)
   */
  static async reviewApplication(
    applicationId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string,
    reviewedBy?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('student_applications')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error reviewing application:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in reviewApplication:', error);
      return false;
    }
  }
}
