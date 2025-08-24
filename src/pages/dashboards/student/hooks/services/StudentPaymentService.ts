import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import { CohortStudent } from '@/types/cohort';
import { PaymentSubmissionData } from '@/types/payments/PaymentMethods';

interface StudentPaymentRecord {
  id: string;
  payment_plan: string;
}

interface CreateStudentPaymentResult {
  success: boolean;
  error?: string;
  studentPaymentId?: string;
}

export class StudentPaymentService {
  /**
   * Get or create a student payment record
   */
  static async getOrCreateStudentPayment(
    paymentData: PaymentSubmissionData,
    studentData?: CohortStudent
  ): Promise<CreateStudentPaymentResult> {
    try {
      // Use student data from paymentData if available (admin context), otherwise use studentData (student context)
      const effectiveStudentId = paymentData.studentId || studentData?.id;
      const effectiveCohortId = paymentData.cohortId || studentData?.cohort_id;

      console.log('🔍 [DEBUG] StudentPaymentService - effective IDs:', {
        effectiveStudentId,
        effectiveCohortId,
        paymentDataStudentId: paymentData.studentId,
        paymentDataCohortId: paymentData.cohortId,
        studentDataId: studentData?.id,
        studentDataCohortId: studentData?.cohort_id,
      });

      const { data: existingStudentPayment, error: studentPaymentError } =
        await supabase
          .from('student_payments')
          .select('id, payment_plan')
          .eq('student_id', effectiveStudentId)
          .eq('cohort_id', effectiveCohortId)
          .single();

      if (studentPaymentError && studentPaymentError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no record exists
        Logger.getInstance().error('Error checking student payment record', {
          error: studentPaymentError,
        });
        return {
          success: false,
          error: `Error checking student payment record: ${studentPaymentError.message}`,
        };
      }

      if (existingStudentPayment) {
        // Use existing student payment record
        Logger.getInstance().info('Using existing student payment record', {
          studentPaymentId: existingStudentPayment.id,
        });
        return {
          success: true,
          studentPaymentId: existingStudentPayment.id,
        };
      } else {
        // Create new student payment record with only existing fields
        const { data: newStudentPayment, error: createError } = await supabase
          .from('student_payments')
          .insert({
            student_id: effectiveStudentId,
            cohort_id: effectiveCohortId,
            payment_plan: 'instalment_wise', // Default to installment-wise for targeted payments
          })
          .select('id')
          .single();

        if (createError) {
          Logger.getInstance().error('Failed to create student payment record', {
            error: createError,
          });
          return {
            success: false,
            error: `Failed to create student payment record: ${createError.message}`,
          };
        }

        Logger.getInstance().info('Created new student payment record', {
          studentPaymentId: newStudentPayment.id,
        });
        return {
          success: true,
          studentPaymentId: newStudentPayment.id,
        };
      }
    } catch (error) {
      Logger.getInstance().error('Error in getOrCreateStudentPayment', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Update student payment record timestamp
   */
  static async updateStudentPaymentTimestamp(studentPaymentId: string): Promise<void> {
    try {
      const { error: updateError } = await supabase
        .from('student_payments')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentPaymentId);

      if (updateError) {
        Logger.getInstance().error(
          'Failed to update student payment record timestamp',
          { error: updateError }
        );
        // Don't throw error here, as the transaction was already created
        // Just log the error for debugging
      } else {
        Logger.getInstance().info(
          'Updated student payment record timestamp after payment submission',
          { studentPaymentId }
        );
      }
    } catch (error) {
      Logger.getInstance().error('Error updating student payment timestamp', {
        error,
        studentPaymentId,
      });
    }
  }

  /**
   * Get student payment plan
   */
  static async getStudentPaymentPlan(
    studentId: string,
    cohortId: string
  ): Promise<string> {
    try {
      const { data: studentPayment } = await supabase
        .from('student_payments')
        .select('payment_plan')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId)
        .maybeSingle();

      console.log('🔍 [DEBUG] StudentPaymentService - studentPayment:', studentPayment);

      if (
        studentPayment?.payment_plan &&
        studentPayment.payment_plan !== 'not_selected'
      ) {
        return studentPayment.payment_plan;
      }

      return 'one_shot'; // default
    } catch (error) {
      console.warn('Could not fetch student payment plan, using default:', error);
      return 'one_shot'; // default
    }
  }
}
