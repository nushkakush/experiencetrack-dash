import { BaseService } from './base.service';
import { StudentScholarship, NewStudentScholarshipInput, StudentScholarshipWithDetails } from '@/types/fee';
import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';

class StudentScholarshipsService extends BaseService<StudentScholarship> {
  constructor() {
    super('student_scholarships');
  }

  /**
   * Get all scholarship assignments for a cohort
   */
  async getByCohort(cohortId: string): Promise<ApiResponse<StudentScholarshipWithDetails[]>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .select(`
          *,
          scholarship:scholarships(*),
          student:cohort_students(*)
        `)
        .eq('student.cohort_id', cohortId);

      if (error) throw error;
      return { data: data as StudentScholarshipWithDetails[], error: null };
    });
  }

  /**
   * Get scholarship assignment for a specific student
   */
  async getByStudent(studentId: string): Promise<ApiResponse<StudentScholarshipWithDetails | null>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .select(`
          *,
          scholarship:scholarships(*),
          student:cohort_students(*)
        `)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as StudentScholarshipWithDetails | null, error: null };
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
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .upsert({
          student_id: studentId,
          scholarship_id: scholarshipId,
          additional_discount_percentage: additionalDiscountPercentage,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,scholarship_id'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  /**
   * Remove scholarship assignment from a student
   */
  async removeScholarship(studentId: string, scholarshipId: string): Promise<ApiResponse<void>> {
    return this["executeQuery"](async () => {
      const { error } = await supabase
        .from('student_scholarships')
        .delete()
        .eq('student_id', studentId)
        .eq('scholarship_id', scholarshipId);

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
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from('student_scholarships')
        .update({
          additional_discount_percentage: additionalDiscountPercentage
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
