import { BaseService } from './base.service';
import {
  StudentScholarship,
  NewStudentScholarshipInput,
  StudentScholarshipWithDetails,
} from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';

class StudentScholarshipsService extends BaseService<StudentScholarship> {
  constructor() {
    super('student_scholarships');
  }

  /**
   * Get all scholarship assignments for a cohort
   */
  async getByCohort(
    cohortId: string
  ): Promise<ApiResponse<StudentScholarshipWithDetails[]>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .select(
          `
          *,
          scholarship:cohort_scholarships(*),
          student:cohort_students(*)
        `
        )
        .eq('student.cohort_id', cohortId);

      if (error) throw error;
      return { data: data as StudentScholarshipWithDetails[], error: null };
    });
  }

  /**
   * Get scholarship assignment for a specific student
   */
  async getByStudent(
    studentId: string
  ): Promise<ApiResponse<StudentScholarshipWithDetails | null>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .select(
          `
          *,
          scholarship:cohort_scholarships(*),
          student:cohort_students(*)
        `
        )
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      return {
        data: data as StudentScholarshipWithDetails | null,
        error: null,
      };
    });
  }

  /**
   * Get scholarship assignment for a specific student within a cohort (scoped)
   */
  async getByStudentInCohort(
    studentId: string,
    cohortId: string
  ): Promise<ApiResponse<StudentScholarshipWithDetails | null>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .select(
          `
          *,
          scholarship:cohort_scholarships(*),
          student:cohort_students(*)
        `
        )
        .eq('student_id', studentId)
        .eq('student.cohort_id', cohortId)
        .maybeSingle();

      if (error) throw error;
      return {
        data: data as StudentScholarshipWithDetails | null,
        error: null,
      };
    });
  }

  /**
   * Assign or update scholarship for a student
   */
  async assignScholarship(
    studentId: string,
    scholarshipId: string,
    additionalDiscountPercentage: number = 0,
    assignedBy: string
  ): Promise<ApiResponse<StudentScholarship>> {
    return this['executeQuery'](async () => {
      Logger.getInstance().info('Service: Assigning/updating scholarship', {
        studentId,
        scholarshipId,
        additionalDiscountPercentage,
        assignedBy,
      });

      // If scholarshipId is empty, remove all scholarships for this student
      if (!scholarshipId || scholarshipId === '') {
        Logger.getInstance().info(
          'Service: Removing all scholarships for student',
          { studentId }
        );

        // Remove all scholarship assignments for this student
        const { error: deleteError } = await supabase
          .from('student_scholarships')
          .delete()
          .eq('student_id', studentId);

        if (deleteError) throw deleteError;

        // Clear scholarship reference in student_payments
        const { error: paymentError } = await supabase
          .from('student_payments')
          .update({
            scholarship_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);

        if (paymentError) {
          Logger.getInstance().error(
            'Error clearing scholarship from student_payments',
            {
              error: paymentError,
              studentId,
            }
          );
        }

        return { data: null, error: null };
      }

      // Remove any existing scholarship assignments for this student first
      const { error: deleteError } = await supabase
        .from('student_scholarships')
        .delete()
        .eq('student_id', studentId);

      if (deleteError) throw deleteError;

      // Create new scholarship assignment
      const { data, error } = await supabase
        .from('student_scholarships')
        .insert({
          student_id: studentId,
          scholarship_id: scholarshipId,
          additional_discount_percentage: additionalDiscountPercentage,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update the student_payments table to reflect the scholarship assignment
      const { error: paymentError } = await supabase
        .from('student_payments')
        .update({
          scholarship_id: scholarshipId,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);

      if (paymentError) {
        Logger.getInstance().error(
          'Error updating student payment with scholarship',
          {
            error: paymentError,
            studentId,
            scholarshipId,
          }
        );
        // Don't throw here as the main scholarship assignment was successful
      }

      Logger.getInstance().info('Service: Scholarship assignment successful', {
        studentId,
        scholarshipId,
        assignmentId: data.id,
      });

      return { data, error: null };
    });
  }

  /**
   * Remove scholarship assignment from a student (optionally scoped by cohort)
   */
  async removeScholarship(
    studentId: string,
    scholarshipId: string,
    cohortId?: string
  ): Promise<ApiResponse<void>> {
    return this['executeQuery'](async () => {
      Logger.getInstance().info('Service: Removing scholarship assignment', {
        studentId,
        scholarshipId,
        cohortId,
      });

      // If cohortId is provided, remove ALL assignments for this student within the cohort
      if (cohortId) {
        // Get all scholarship IDs for the cohort
        const { data: cohortScholarships, error: cohortError } = await supabase
          .from('cohort_scholarships')
          .select('id')
          .eq('cohort_id', cohortId);
        if (cohortError) {
          Logger.getInstance().error(
            'Service: Error loading cohort_scholarships for cohort',
            { cohortId, cohortError }
          );
          throw cohortError;
        }
        const cohortScholarshipIds = (cohortScholarships || []).map(
          (s: { id: string }) => s.id
        );

        // Delete any assignments matching those IDs for this student
        const { error: scopedDeleteError } = await supabase
          .from('student_scholarships')
          .delete()
          .eq('student_id', studentId)
          .in('scholarship_id', cohortScholarshipIds);
        if (scopedDeleteError) {
          Logger.getInstance().error(
            'Service: Error deleting cohort-scoped student_scholarships rows',
            { studentId, cohortId, scopedDeleteError }
          );
          throw scopedDeleteError;
        }
      } else {
        // Fallback: delete the specific assignment
        const { error } = await supabase
          .from('student_scholarships')
          .delete()
          .eq('student_id', studentId)
          .eq('scholarship_id', scholarshipId);
        if (error) {
          Logger.getInstance().error(
            'Service: Error deleting student_scholarships row',
            { studentId, scholarshipId, error }
          );
          throw error;
        }
      }

      // Clear scholarship reference on student_payments scoped by cohort when provided
      let paymentsQuery = supabase
        .from('student_payments')
        .update({ scholarship_id: null, updated_at: new Date().toISOString() })
        .eq('student_id', studentId);
      if (cohortId) paymentsQuery = paymentsQuery.eq('cohort_id', cohortId);
      const { error: paymentUpdateError } = await paymentsQuery;
      if (paymentUpdateError) {
        Logger.getInstance().error(
          'Service: Error clearing scholarship_id from student_payments',
          { studentId, cohortId, paymentUpdateError }
        );
        throw paymentUpdateError;
      }

      // Verification reads
      const verifyAssignment = cohortId
        ? await this.getByStudentInCohort(studentId, cohortId)
        : await this.getByStudent(studentId);
      Logger.getInstance().info(
        'Service: Verification after removal - assignment',
        { exists: verifyAssignment.success && !!verifyAssignment.data }
      );

      const paymentVerifyQuery = supabase
        .from('student_payments')
        .select('id, scholarship_id, cohort_id')
        .eq('student_id', studentId);
      const { data: paymentVerify, error: paymentVerifyError } = cohortId
        ? await paymentVerifyQuery.eq('cohort_id', cohortId)
        : await paymentVerifyQuery;
      if (paymentVerifyError) {
        Logger.getInstance().warn(
          'Service: Verification read error on student_payments',
          { studentId, cohortId, paymentVerifyError }
        );
      } else {
        Logger.getInstance().info(
          'Service: Verification after removal - payment row',
          { paymentVerify }
        );
      }

      Logger.getInstance().info('Service: Scholarship removal complete', {
        studentId,
        cohortId,
      });
      return { data: undefined, error: null };
    });
  }

  /**
   * Remove scholarship assignment by assignment row ID (authoritative)
   */
  async removeScholarshipByAssignmentId(
    assignmentId: string,
    studentId?: string,
    cohortId?: string
  ): Promise<ApiResponse<void>> {
    return this['executeQuery'](async () => {
      Logger.getInstance().info(
        'Service: Removing scholarship by assignmentId',
        { assignmentId, studentId, cohortId }
      );

      // Delete the exact row by ID
      const { error: deleteError } = await supabase
        .from('student_scholarships')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) {
        Logger.getInstance().error(
          'Service: Error deleting student_scholarships by id',
          { assignmentId, deleteError }
        );
        throw deleteError;
      }

      // Optional cleanup in payments
      if (studentId) {
        let paymentsQuery = supabase
          .from('student_payments')
          .update({
            scholarship_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);
        if (cohortId) paymentsQuery = paymentsQuery.eq('cohort_id', cohortId);
        const { error: paymentUpdateError } = await paymentsQuery;
        if (paymentUpdateError) {
          Logger.getInstance().error(
            'Service: Error clearing scholarship_id from student_payments (by id removal)',
            { studentId, cohortId, paymentUpdateError }
          );
          throw paymentUpdateError;
        }
      }

      // Verify assignment truly gone
      const { data: verifyRow, error: verifyError } = await supabase
        .from('student_scholarships')
        .select('id')
        .eq('id', assignmentId)
        .maybeSingle();
      if (verifyError) {
        Logger.getInstance().warn(
          'Service: Verification read error after delete by id',
          { assignmentId, verifyError }
        );
      }
      Logger.getInstance().info('Service: Verification after removal by id', {
        exists: !!verifyRow,
      });

      Logger.getInstance().info('Service: Scholarship removal by id complete', {
        assignmentId,
      });
      return { data: undefined, error: null };
    });
  }

  /**
   * Update student payment record with scholarship assignment
   * This method ensures scholarship_id is updated in student_payments when a scholarship is assigned
   */
  async updateStudentPaymentWithScholarship(
    studentId: string,
    scholarshipId: string | null
  ): Promise<ApiResponse<void>> {
    return this['executeQuery'](async () => {
      const { error } = await supabase
        .from('student_payments')
        .update({
          scholarship_id: scholarshipId,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);

      if (error) throw error;
      return { data: undefined, error: null };
    });
  }

  /**
   * Update additional discount for a student's scholarship
   */
  async updateAdditionalDiscount(
    studentId: string,
    scholarshipId: string,
    additionalDiscountPercentage: number
  ): Promise<ApiResponse<StudentScholarship>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .update({
          additional_discount_percentage: additionalDiscountPercentage,
        })
        .eq('student_id', studentId)
        .eq('scholarship_id', scholarshipId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }
}

export const studentScholarshipsService = new StudentScholarshipsService();
