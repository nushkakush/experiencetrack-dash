/**
 * Partial Payments Service
 * Handles partial payment calculations and API interactions with payment engine
 */

import { 
  PartialPaymentSummary, 
  PartialPaymentCalculationResponse,
  AdminPartialApprovalAction 
} from '@/types/payments/PartialPaymentTypes';
import { supabase } from '@/integrations/supabase/client';

export class PartialPaymentsService {
  private static baseUrl = '/api/payment-engine';

  /**
   * Calculate partial payment summary for an installment
   */
  static async calculatePartialPaymentSummary(
    installmentId: string,
    studentId: string
  ): Promise<PartialPaymentCalculationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calculate-partial-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentId,
          studentId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate partial payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating partial payment:', error);
      throw error;
    }
  }

  /**
   * Process admin partial approval action
   */
  static async processAdminApproval(
    action: AdminPartialApprovalAction
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/admin-partial-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error(`Failed to process approval: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing admin approval:', error);
      throw error;
    }
  }

  /**
   * Check if partial payments are allowed for a cohort
   */
  static async isPartialPaymentAllowed(cohortId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/partial-payment-config/${cohortId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false; // Default to false if we can't determine
      }

      const data = await response.json();
      return data.allowPartialPayments === true;
    } catch (error) {
      console.error('Error checking partial payment config:', error);
      return false;
    }
  }

  /**
   * Update cohort partial payment setting (admin only)
   */
  static async updatePartialPaymentSetting(
    cohortId: string,
    allowPartialPayments: boolean
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/partial-payment-config/${cohortId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowPartialPayments,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update setting: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating partial payment setting:', error);
      throw error;
    }
  }

  /**
   * Get payment transactions with partial payment details
   */
  static async getPaymentTransactionsWithPartials(
    paymentId: string
  ): Promise<{
    transactions: any[];
    summary: PartialPaymentSummary;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/payment-transactions/${paymentId}/partials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw error;
    }
  }

  /**
   * Calculate the next payment amount for a student
   */
  static calculateNextPaymentAmount(
    totalAmount: number,
    paidAmount: number,
    allowPartialPayments: boolean,
    maxPartialPayments: number = 2,
    currentPartialPaymentCount: number = 0
  ): {
    nextPaymentAmount: number;
    isFixedAmount: boolean;
    canMakePartialPayment: boolean;
    maxAmount: number;
  } {
    const pendingAmount = totalAmount - paidAmount;

    // If no partial payments allowed, must pay full pending amount
    if (!allowPartialPayments) {
      return {
        nextPaymentAmount: pendingAmount,
        isFixedAmount: true,
        canMakePartialPayment: false,
        maxAmount: pendingAmount,
      };
    }

    // If reached max partial payments, must pay remaining amount
    if (currentPartialPaymentCount >= maxPartialPayments) {
      return {
        nextPaymentAmount: pendingAmount,
        isFixedAmount: true,
        canMakePartialPayment: false,
        maxAmount: pendingAmount,
      };
    }

    // Can make partial payment
    return {
      nextPaymentAmount: 0, // Student can choose amount
      isFixedAmount: false,
      canMakePartialPayment: true,
      maxAmount: pendingAmount,
    };
  }

  /**
   * Validate partial payment amount
   */
  static validatePartialPaymentAmount(
    amount: number,
    maxAmount: number,
    minAmount: number = 1,
    allowPartialPayments: boolean = false
  ): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }

    if (amount < minAmount) {
      return { isValid: false, error: `Minimum amount is ${minAmount}` };
    }

    if (amount > maxAmount) {
      return { isValid: false, error: `Amount cannot exceed ${maxAmount}` };
    }

    if (!allowPartialPayments && amount < maxAmount) {
      return { isValid: false, error: 'Partial payments not allowed. Full amount required.' };
    }

    return { isValid: true };
  }

  /**
   * Get partial payment configuration for a specific installment
   */
  static async getInstallmentPartialPaymentConfig(
    studentId: string,
    semesterNumber: number,
    installmentNumber: number
  ): Promise<{ allowPartialPayments: boolean }> {
    try {
      const installmentKey = `${semesterNumber}-${installmentNumber}`;
      console.log('🔧 [partialPayments.service] Getting config for:', { studentId, installmentKey });
      
      // Get student payment record directly
      const { data: studentPayment, error } = await supabase
        .from('student_payments')
        .select('allow_partial_payments_json')
        .eq('student_id', studentId)
        .single();

      if (error) {
        console.warn('Failed to get partial payment config, defaulting to false:', error);
        return { allowPartialPayments: false };
      }

      const config = studentPayment?.allow_partial_payments_json || {};
      const allowPartialPayments = config[installmentKey] || false;
      
      console.log('✅ [partialPayments.service] Config retrieved:', {
        config,
        installmentKey,
        allowPartialPayments,
      });

      return { allowPartialPayments };
    } catch (error) {
      console.error('Error getting installment partial payment config:', error);
      return { allowPartialPayments: false };
    }
  }
}
