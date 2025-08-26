import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import {
  BulkPaymentPlanUpload,
  BulkPaymentPlanUploadResult,
  BulkUploadOperationConfig,
} from '@/types/payments/BulkUploadTypes';
import { PaymentPlan } from '@/types/payments/PaymentPlans';
import { Scholarship } from '@/types/fee';
import { CohortStudent } from '@/types/cohort';
import { FeeStructureService } from '../feeStructure.service';

export class BulkPaymentPlanUploadService {
  /**
   * Validate a single payment plan upload row
   */
  static validatePaymentPlanRow(data: any, row: number): string[] {
    const errors: string[] = [];

    // Validate student_email
    if (!data.student_email || typeof data.student_email !== 'string') {
      errors.push('Student email is required and must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.student_email)) {
      errors.push('Invalid email format');
    }

    // Validate payment_plan
    if (!data.payment_plan || typeof data.payment_plan !== 'string') {
      errors.push('Payment plan is required and must be a string');
    } else {
      const validPlans: PaymentPlan[] = [
        'one_shot',
        'sem_wise',
        'instalment_wise',
        'not_selected',
      ];
      if (!validPlans.includes(data.payment_plan as PaymentPlan)) {
        errors.push(`Payment plan must be one of: ${validPlans.join(', ')}`);
      }
    }

    // Validate custom_dates (optional JSON)
    if (data.custom_dates !== undefined && data.custom_dates !== '') {
      try {
        const customDates =
          typeof data.custom_dates === 'string'
            ? JSON.parse(data.custom_dates)
            : data.custom_dates;

        if (typeof customDates !== 'object' || customDates === null) {
          errors.push('Custom dates must be a valid JSON object');
        }
      } catch (error) {
        errors.push('Custom dates must be a valid JSON format');
      }
    }

    return errors;
  }

  /**
   * Check for duplicate payment plan assignments
   */
  static async checkDuplicatePaymentPlans(
    data: BulkPaymentPlanUpload[],
    cohortId: string
  ): Promise<
    Array<{ data: BulkPaymentPlanUpload; row: number; existingData?: any }>
  > {
    const duplicates: Array<{
      data: BulkPaymentPlanUpload;
      row: number;
      existingData?: any;
    }> = [];

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
        // Check if student already has a payment plan
        const { data: existingPaymentPlan } = await supabase
          .from('student_payments')
          .select('*')
          .eq('student_id', student.id)
          .eq('cohort_id', cohortId)
          .single();

        if (existingPaymentPlan) {
          duplicates.push({
            data: row,
            row: i + 2, // +2 because CSV has header and we're 0-indexed
            existingData: existingPaymentPlan,
          });
        }
      }
    }

    return duplicates;
  }

  /**
   * Process valid payment plan upload data
   */
  static async processPaymentPlanUpload(
    data: BulkPaymentPlanUpload[],
    config: BulkUploadOperationConfig,
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{
    success: boolean;
    message: string;
    results: BulkPaymentPlanUploadResult[];
  }> {
    const results: BulkPaymentPlanUploadResult[] = [];
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

      // Get fee structure for the cohort
      const feeStructure = await FeeStructureService.getFeeStructure(
        config.cohortId
      );
      if (!feeStructure) {
        throw new Error('Fee structure not found for cohort');
      }

      for (const row of data) {
        try {
          const studentEmail = row.student_email.toLowerCase();
          const student = studentMap.get(studentEmail);

          if (!student) {
            results.push({
              student_id: '',
              payment_plan: row.payment_plan,
              success: false,
              error: `Student with email ${row.student_email} not found in cohort`,
            });
            errorCount++;
            continue;
          }

          // Check if student already has a payment plan
          const { data: existingPaymentPlan } = await supabase
            .from('student_payments')
            .select('*')
            .eq('student_id', student.id)
            .eq('cohort_id', config.cohortId)
            .single();

          if (existingPaymentPlan && duplicateHandling === 'ignore') {
            results.push({
              student_id: student.id,
              payment_plan: existingPaymentPlan.payment_plan as PaymentPlan,
              success: true,
              error: 'Skipped - student already has a payment plan',
            });
            continue;
          }

          // Remove existing payment plan if overwriting
          if (existingPaymentPlan && duplicateHandling === 'overwrite') {
            await supabase
              .from('student_payments')
              .delete()
              .eq('student_id', student.id)
              .eq('cohort_id', config.cohortId);
          }

          // Create or update payment plan
          const { data: newPaymentPlan, error: planError } = await supabase
            .from('student_payments')
            .upsert(
              {
                student_id: student.id,
                cohort_id: config.cohortId,
                payment_plan: row.payment_plan,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'student_id,cohort_id',
              }
            )
            .select()
            .single();

          if (planError) {
            throw planError;
          }

          // Handle custom dates if specified
          if (row.custom_dates && config.customDateValidation) {
            const customDates =
              typeof row.custom_dates === 'string'
                ? JSON.parse(row.custom_dates)
                : row.custom_dates;

            await FeeStructureService.upsertCustomPlanForStudent({
              cohortId: config.cohortId,
              studentId: student.id,
              baseFields: {
                admission_fee: feeStructure.admission_fee,
                total_program_fee: feeStructure.total_program_fee,
                number_of_semesters: feeStructure.number_of_semesters,
                instalments_per_semester: feeStructure.instalments_per_semester,
                one_shot_discount_percentage:
                  feeStructure.one_shot_discount_percentage,
                program_fee_includes_gst: feeStructure.program_fee_includes_gst,
                equal_scholarship_distribution:
                  feeStructure.equal_scholarship_distribution,
              },
              selectedPlan: row.payment_plan,
              editedDates: customDates,
            });
          }

          results.push({
            student_id: student.id,
            payment_plan: row.payment_plan,
            success: true,
          });
          successCount++;

          // Send notification if enabled
          if (config.sendNotifications) {
            // TODO: Implement notification sending
            Logger.getInstance().info('Payment plan assigned', {
              studentId: student.id,
              paymentPlan: row.payment_plan,
              scholarshipId,
            });
          }
        } catch (error) {
          Logger.getInstance().error('Error processing payment plan row', {
            error,
            row,
          });
          results.push({
            student_id: '',
            payment_plan: row.payment_plan,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          errorCount++;
        }
      }

      return {
        success: errorCount === 0,
        message: `Successfully assigned ${successCount} payment plans${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        results,
      };
    } catch (error) {
      Logger.getInstance().error('Bulk payment plan upload failed', {
        error,
        config,
      });
      throw error;
    }
  }

  /**
   * Generate template data for payment plan upload
   */
  static generateTemplateData(): string {
    return `student_email,payment_plan
john.doe@example.com,one_shot
jane.smith@example.com,sem_wise
bob.wilson@example.com,instalment_wise`;
  }
}
