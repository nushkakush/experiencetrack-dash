import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import { 
  BulkScholarshipUpload, 
  BulkScholarshipUploadResult,
  BulkUploadValidationResult,
  BulkUploadOperationConfig 
} from '@/types/payments/BulkUploadTypes';
import { Scholarship } from '@/types/fee';
import { CohortStudent } from '@/types/cohort';

export class BulkScholarshipUploadService {
  /**
   * Validate a single scholarship upload row
   */
  static validateScholarshipRow(data: any, row: number): string[] {
    const errors: string[] = [];

    // Validate student_email
    if (!data.student_email || typeof data.student_email !== 'string') {
      errors.push('Student email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.student_email)) {
      errors.push('Invalid email format');
    }

    // Validate scholarship_name
    if (!data.scholarship_name || typeof data.scholarship_name !== 'string') {
      errors.push('Scholarship name is required and must be a string');
    }

    // Validate additional_discount_percentage
    if (data.additional_discount_percentage !== undefined && data.additional_discount_percentage !== '') {
      const discount = parseFloat(data.additional_discount_percentage);
      if (isNaN(discount)) {
        errors.push('Additional discount percentage must be a valid number');
      } else if (discount < 0 || discount > 100) {
        errors.push('Additional discount percentage must be between 0 and 100');
      }
    }

    return errors;
  }

  /**
   * Check for duplicate scholarship assignments
   */
  static async checkDuplicateScholarships(
    data: BulkScholarshipUpload[],
    cohortId: string
  ): Promise<Array<{ data: BulkScholarshipUpload; row: number; existingData?: any }>> {
    const duplicates: Array<{ data: BulkScholarshipUpload; row: number; existingData?: any }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Get student ID from email
      const { data: student } = await supabase
        .from('cohort_students')
        .select('id')
        .eq('cohort_id', cohortId)
        .eq('email', row.student_email)
        .single();

      if (student) {
        // Check if student already has a scholarship
        const { data: existingScholarship } = await supabase
          .from('student_scholarships')
          .select('*')
          .eq('student_id', student.id)
          .single();

        if (existingScholarship) {
          duplicates.push({
            data: row,
            row: i + 2, // +2 because CSV has header and we're 0-indexed
            existingData: existingScholarship
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Process valid scholarship upload data
   */
  static async processScholarshipUpload(
    data: BulkScholarshipUpload[],
    config: BulkUploadOperationConfig,
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string; results: BulkScholarshipUploadResult[] }> {
    const results: BulkScholarshipUploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      // Get all scholarships for the cohort
      const { data: scholarships, error: schError } = await supabase
        .from('cohort_scholarships')
        .select('*')
        .eq('cohort_id', config.cohortId);

      if (schError) {
        throw new Error('Failed to fetch cohort scholarships');
      }

      const scholarshipMap = new Map<string, Scholarship>();
      scholarships?.forEach(sch => {
        scholarshipMap.set(sch.name.toLowerCase(), sch);
      });

      // Get all students for the cohort
      const { data: students, error: stuError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', config.cohortId);

      if (stuError) {
        throw new Error('Failed to fetch cohort students');
      }

      const studentMap = new Map<string, CohortStudent>();
      students?.forEach(student => {
        studentMap.set(student.email.toLowerCase(), student);
      });

      for (const row of data) {
        try {
          const studentEmail = row.student_email.toLowerCase();
          const scholarshipName = row.scholarship_name.toLowerCase();

          const student = studentMap.get(studentEmail);
          const scholarship = scholarshipMap.get(scholarshipName);

          if (!student) {
            results.push({
              student_id: '',
              scholarship_id: '',
              additional_discount_percentage: 0,
              success: false,
              error: `Student with email ${row.student_email} not found in cohort`
            });
            errorCount++;
            continue;
          }

          if (!scholarship) {
            results.push({
              student_id: student.id,
              scholarship_id: '',
              additional_discount_percentage: 0,
              success: false,
              error: `Scholarship "${row.scholarship_name}" not found in cohort`
            });
            errorCount++;
            continue;
          }

          const additionalDiscount = row.additional_discount_percentage 
            ? parseFloat(row.additional_discount_percentage.toString()) 
            : 0;

          // Check if student already has a scholarship
          const { data: existingScholarship } = await supabase
            .from('student_scholarships')
            .select('*')
            .eq('student_id', student.id)
            .single();

          if (existingScholarship && duplicateHandling === 'ignore') {
            results.push({
              student_id: student.id,
              scholarship_id: existingScholarship.scholarship_id,
              additional_discount_percentage: existingScholarship.additional_discount_percentage,
              success: true,
              error: 'Skipped - student already has a scholarship'
            });
            continue;
          }

          // Remove existing scholarship if overwriting
          if (existingScholarship && duplicateHandling === 'overwrite') {
            await supabase
              .from('student_scholarships')
              .delete()
              .eq('student_id', student.id);
          }

          // Assign new scholarship
          const { data: newScholarship, error: assignError } = await supabase
            .from('student_scholarships')
            .insert({
              student_id: student.id,
              scholarship_id: scholarship.id,
              additional_discount_percentage: additionalDiscount,
              assigned_at: new Date().toISOString(),
              assigned_by: null
            })
            .select()
            .single();

          if (assignError) {
            throw assignError;
          }

          results.push({
            student_id: student.id,
            scholarship_id: scholarship.id,
            additional_discount_percentage: additionalDiscount,
            success: true
          });
          successCount++;

          // Send notification if enabled
          if (config.sendNotifications) {
            // TODO: Implement notification sending
            Logger.getInstance().info('Scholarship assigned', {
              studentId: student.id,
              scholarshipId: scholarship.id,
              additionalDiscount
            });
          }

        } catch (error) {
          Logger.getInstance().error('Error processing scholarship row', { error, row });
          results.push({
            student_id: '',
            scholarship_id: '',
            additional_discount_percentage: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errorCount++;
        }
      }

      return {
        success: errorCount === 0,
        message: `Successfully assigned ${successCount} scholarships${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        results
      };

    } catch (error) {
      Logger.getInstance().error('Bulk scholarship upload failed', { error, config });
      throw error;
    }
  }

  /**
   * Generate template data for scholarship upload
   */
  static generateTemplateData(): string {
    return `student_email,scholarship_name,additional_discount_percentage,description
john.doe@example.com,Merit Scholarship,5,High academic performance
jane.smith@example.com,Need-based Scholarship,10,Financial need
bob.wilson@example.com,Merit Scholarship,0,Standard merit award`;
  }
}
