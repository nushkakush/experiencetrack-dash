import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { PaymentStatus } from '@/types/fee';
import { 
  StudentPaymentRow,
  PaymentTransactionRow
} from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';

// Type aliases for backward compatibility
type StudentPayment = StudentPaymentRow;
type PaymentTransaction = PaymentTransactionRow;

export class PaymentTransactionService {
  async updatePaymentStatus(paymentId: string, status: PaymentStatus, notes?: string): Promise<ApiResponse<StudentPayment>> {
    try {
      const { data, error } = await supabase
        .from('student_payments')
        .update({ 
          status, 
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as StudentPayment,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentTransactionService: Error updating payment status', { error, paymentId, status });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update payment status',
        success: false,
      };
    }
  }

  async recordPayment(
    paymentId: string, 
    amount: number, 
    paymentMethod: PaymentTransaction['payment_method'],
    referenceNumber?: string,
    notes?: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    try {
      // First, get the current payment to check amount
      const { data: currentPayment, error: fetchError } = await supabase
        .from('student_payments')
        .select('amount_payable, amount_paid, status')
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        Logger.getInstance().error('PaymentTransactionService: Error fetching current payment', { error: fetchError, paymentId });
        throw fetchError;
      }

      if (!currentPayment) {
        throw new Error('Payment not found');
      }

      const newAmountPaid = currentPayment.amount_paid + amount;
      const remainingAmount = currentPayment.amount_payable - newAmountPaid;
      
      // Determine new status
      let newStatus: PaymentStatus = 'pending';
      if (remainingAmount <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      // Update the payment record
      const { error: updateError } = await supabase
        .from('student_payments')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (updateError) {
        Logger.getInstance().error('PaymentTransactionService: Error updating payment record', { error: updateError, paymentId });
        throw updateError;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          payment_id: paymentId,
          transaction_type: 'payment',
          amount: amount,
          payment_method: paymentMethod,
          reference_number: referenceNumber || null,
          status: 'completed',
          notes: notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        Logger.getInstance().error('PaymentTransactionService: Error creating transaction record', { error: transactionError, paymentId });
        throw transactionError;
      }

      return {
        data: transaction as PaymentTransaction,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('PaymentTransactionService: Error recording payment', { error, paymentId, amount });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to record payment',
        success: false,
      };
    }
  }
}
