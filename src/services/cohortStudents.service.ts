import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './base.service';
import { ApiResponse } from '@/types/common';
import { CohortStudent, NewStudentInput } from '@/types/cohort';

class CohortStudentsService extends BaseService<CohortStudent> {
  constructor() {
    super('cohort_students');
  }

  async listByCohort(cohortId: string): Promise<ApiResponse<CohortStudent[]>> {
    return this['executeQuery'](async () => {
      return await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .neq('dropped_out_status', 'dropped_out')
        .order('created_at', { ascending: false });
    });
  }

  async listAllByCohort(
    cohortId: string
  ): Promise<ApiResponse<CohortStudent[]>> {
    return this['executeQuery'](async () => {
      return await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .order('created_at', { ascending: false });
    });
  }

  async addOne(
    cohortId: string,
    input: NewStudentInput
  ): Promise<ApiResponse<CohortStudent>> {
    return this.create<CohortStudent>({
      cohort_id: cohortId,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      avatar_url: input.avatar_url,
      invite_status: 'pending',
    } as Partial<CohortStudent>);
  }

  async updateByEmail(
    cohortId: string,
    email: string,
    input: NewStudentInput
  ): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          avatar_url: input.avatar_url,
        })
        .eq('cohort_id', cohortId)
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async upsertStudent(
    cohortId: string,
    input: NewStudentInput
  ): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .upsert(
          {
            cohort_id: cohortId,
            email: input.email,
            first_name: input.first_name,
            last_name: input.last_name,
            phone: input.phone,
            avatar_url: input.avatar_url,
            invite_status: 'pending',
          },
          {
            onConflict: 'cohort_id,email',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async markInvited(id: string): Promise<void> {
    const { error } = await supabase
      .from('cohort_students')
      .update({ invite_status: 'sent', invited_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  async sendCustomInvitation(
    id: string,
    invitedBy: string
  ): Promise<ApiResponse<{ invitationUrl: string }>> {
    return this['executeQuery'](async () => {
      // Generate a unique invitation token
      const invitationToken = crypto.randomUUID();

      // Set invitation expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('cohort_students')
        .update({
          invite_status: 'sent',
          invited_at: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          invited_by: invitedBy,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Generate invitation URL
      const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;

      return { data: { invitationUrl }, error: null };
    });
  }

  async getStudentByInvitationToken(
    token: string
  ): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async getByUserId(userId: string): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async getCohortByStudentId(studentId: string): Promise<ApiResponse<unknown>> {
    return this['executeQuery'](async () => {
      // First get the student to get the cohort_id
      const { data: studentData, error: studentError } = await supabase
        .from('cohort_students')
        .select('cohort_id')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Then get the cohort data
      const { data: cohortData, error: cohortError } = await supabase
        .from('cohorts')
        .select('*')
        .eq('id', studentData.cohort_id)
        .single();

      if (cohortError) throw cohortError;

      return { data: cohortData, error: null };
    });
  }

  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .update({
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: userId,
        })
        .eq('invitation_token', token)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async update(
    id: string,
    updates: Partial<CohortStudent>
  ): Promise<ApiResponse<CohortStudent>> {
    return this['executeQuery'](async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async sendInvitationEmail(
    studentId: string,
    email: string,
    firstName: string,
    lastName: string,
    cohortName: string
  ): Promise<ApiResponse<{ invitationUrl: string; emailSent: boolean }>> {
    // Use the new unified email service
    const { emailService } = await import('@/services/email.service');
    return emailService.sendInvitationEmail(
      studentId,
      email,
      firstName,
      lastName,
      cohortName
    );
  }

  async markAsDroppedOut(
    studentId: string,
    reason: string
  ): Promise<ApiResponse<CohortStudent>> {
    return this.update(studentId, {
      dropped_out_status: 'dropped_out',
      dropped_out_reason: reason,
      dropped_out_at: new Date().toISOString(),
      dropped_out_by: (await supabase.auth.getUser()).data.user?.id,
    });
  }

  async revertDroppedOutStatus(
    studentId: string
  ): Promise<ApiResponse<CohortStudent>> {
    return this.update(studentId, {
      dropped_out_status: 'active',
      dropped_out_reason: null,
      dropped_out_at: null,
      dropped_out_by: null,
    });
  }

  async issueRefund(
    studentId: string,
    amount: number
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this['executeQuery'](async () => {
      try {
        // First, get the student's payment records to validate the refund amount
        const { data: payments, error: paymentsError } = await supabase
          .from('student_payments')
          .select('*')
          .eq('student_id', studentId);

        if (paymentsError) {
          console.error('Error fetching student payments:', paymentsError);
          throw new Error(
            `Failed to fetch payment records: ${paymentsError.message}`
          );
        }

        if (!payments || payments.length === 0) {
          // For record keeping purposes, allow refunds even without payment records
          // Create a minimal payment record for the refund transaction
          console.log(
            'No payment records found, creating minimal record for refund'
          );

          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Create a minimal payment record
          const { data: student, error: studentError } = await supabase
            .from('cohort_students')
            .select('cohort_id')
            .eq('id', studentId)
            .single();

          if (studentError) {
            console.error(
              'Error fetching student for minimal payment:',
              studentError
            );
            throw new Error(
              `Failed to get student cohort_id: ${studentError.message}`
            );
          }

          const { data: newPayment, error: createPaymentError } = await supabase
            .from('student_payments')
            .insert({
              student_id: studentId,
              cohort_id: student.cohort_id, // Get cohort_id from student record
              payment_plan: 'not_selected',
            })
            .select()
            .single();

          if (createPaymentError) {
            console.error('Error creating payment record:', createPaymentError);
            throw new Error(
              `Failed to create payment record: ${createPaymentError.message}`
            );
          }

          console.log('Created minimal payment record:', newPayment);

          // Create refund transaction using the new payment record
          const refundData = {
            payment_id: newPayment.id,
            transaction_type: 'refund',
            amount: amount,
            payment_method: 'bank_transfer',
            status: 'success',
            notes: `Refund issued for student dropout (no previous payments)`,
            created_by: user.id,
          };

          console.log('Creating refund transaction with data:', refundData);

          const { data: refundTransaction, error: refundError } = await supabase
            .from('payment_transactions')
            .insert(refundData)
            .select()
            .single();

          if (refundError) {
            console.error('Error creating refund transaction:', refundError);
            throw new Error(
              `Failed to create refund transaction: ${refundError.message}`
            );
          }

          console.log(
            'Refund transaction created successfully:',
            refundTransaction
          );

          return {
            data: { success: true, message: 'Refund recorded successfully' },
            error: null,
          };
        }

        // Get the first payment record to use as the payment_id for the refund transaction
        const firstPayment = payments[0];
        console.log('Found payment record:', firstPayment);

        // Calculate total amount paid by summing up all payment transactions
        const { data: transactions, error: transactionsError } = await supabase
          .from('payment_transactions')
          .select('amount')
          .eq('payment_id', firstPayment.id)
          .eq('transaction_type', 'payment')
          .eq('status', 'success');

        if (transactionsError) {
          console.error(
            'Error fetching payment transactions:',
            transactionsError
          );
          throw new Error(
            `Failed to fetch payment transactions: ${transactionsError.message}`
          );
        }

        console.log('Found payment transactions:', transactions);

        // Calculate total amount paid
        const totalPaid =
          transactions?.reduce(
            (sum, transaction) =>
              sum + (parseFloat(transaction.amount.toString()) || 0),
            0
          ) || 0;
        console.log(
          'Total amount paid:',
          totalPaid,
          'Requested refund:',
          amount
        );

        // For record keeping purposes, allow refunds even when there are no previous payments
        // Only validate if there are actual payment transactions
        if (transactions && transactions.length > 0 && amount > totalPaid) {
          throw new Error(
            `Refund amount (₹${amount}) cannot exceed total amount paid (₹${totalPaid})`
          );
        }

        // If no payment transactions exist, log a warning but proceed
        if (!transactions || transactions.length === 0) {
          console.warn(
            'No payment transactions found. Proceeding with refund for record keeping purposes.'
          );
        }

        // Get current user for created_by field
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Create refund transaction
        const refundData = {
          payment_id: firstPayment.id,
          transaction_type: 'refund',
          amount: amount,
          payment_method: 'bank_transfer', // Default method for refunds
          status: 'success',
          notes: `Refund issued for student dropout`,
          created_by: user.id,
        };

        console.log('Creating refund transaction with data:', refundData);

        const { data: refundTransaction, error: refundError } = await supabase
          .from('payment_transactions')
          .insert(refundData)
          .select()
          .single();

        if (refundError) {
          console.error('Error creating refund transaction:', refundError);
          throw new Error(
            `Failed to create refund transaction: ${refundError.message}`
          );
        }

        console.log(
          'Refund transaction created successfully:',
          refundTransaction
        );

        return {
          data: { success: true, message: 'Refund recorded successfully' },
          error: null,
        };
      } catch (error) {
        console.error('Error in issueRefund:', error);
        throw error;
      }
    });
  }
}

export const cohortStudentsService = new CohortStudentsService();
