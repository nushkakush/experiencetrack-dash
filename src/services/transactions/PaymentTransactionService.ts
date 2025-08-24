/**
 * Payment Transaction Service
 * Handles payment transaction operations with single responsibility
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../base.service';
import { ApiResponse } from '@/types/common';
import { PaymentSubmissionData, IndianBank, PaymentMethodConfiguration } from '@/types/payments';
import { PaymentTransactionRow } from '@/types/payments/DatabaseAlignedTypes';

class PaymentTransactionService extends BaseService<PaymentTransactionRow> {
  constructor() {
    super("payment_transactions");
  }

  async getByPaymentId(paymentId: string): Promise<ApiResponse<PaymentTransactionRow[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });
  }

  async submitPayment(paymentData: PaymentSubmissionData, userId: string): Promise<ApiResponse<PaymentTransactionRow>> {
    return this.executeQuery(async () => {
      // Upload files if they exist
      let receiptUrl = null;
      let proofOfPaymentUrl = null;
      let transactionScreenshotUrl = null;

      if (paymentData.receiptFile) {
        receiptUrl = await this.uploadFile(paymentData.receiptFile, 'receipts');
      }
      if (paymentData.proofOfPaymentFile) {
        proofOfPaymentUrl = await this.uploadFile(paymentData.proofOfPaymentFile, 'proof-of-payment');
      }
      if (paymentData.transactionScreenshotFile) {
        transactionScreenshotUrl = await this.uploadFile(paymentData.transactionScreenshotFile, 'screenshots');
      }

      // Create transaction record
      const transactionData = {
        payment_id: paymentData.paymentId,
        transaction_type: 'payment',
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        reference_number: paymentData.referenceNumber,
        status: 'pending',
        notes: paymentData.notes,
        created_by: userId,
        verification_status: 'verification_pending',
        receipt_url: receiptUrl,
        proof_of_payment_url: proofOfPaymentUrl,
        transaction_screenshot_url: transactionScreenshotUrl,
        bank_name: paymentData.bankName,
        bank_branch: paymentData.bankBranch,
        transfer_date: paymentData.transferDate && paymentData.transferTime 
          ? `${paymentData.transferDate}T${paymentData.transferTime}:00`
          : paymentData.transferDate,
        payment_date: paymentData.paymentDate && paymentData.paymentTime 
          ? `${paymentData.paymentDate}T${paymentData.paymentTime}:00`
          : paymentData.paymentDate,
        qr_code_url: paymentData.qrCodeUrl,
        payer_upi_id: paymentData.upiId,
        receiver_bank_name: paymentData.receiverBankName,
        receiver_bank_logo_url: paymentData.receiverBankLogoUrl,
        razorpay_payment_id: paymentData.razorpayPaymentId,
        razorpay_order_id: paymentData.razorpayOrderId,
        razorpay_signature: paymentData.razorpaySignature
      };

      const { data, error } = await supabase
        .from("payment_transactions")
        .insert(transactionData)
        .select("*")
        .single();

      if (error) throw error;

      // Update student payment amount
      await this.updateStudentPaymentAmount(paymentData.paymentId, paymentData.amount);

      return { data, error: null };
    });
  }

  private async updateStudentPaymentAmount(paymentId: string, amountPaid: number): Promise<void> {
    const { error } = await supabase
      .from("student_payments")
      .update({
        total_amount_paid: supabase.rpc('increment_amount_paid', { 
          payment_id: paymentId, 
          amount: amountPaid 
        }),
        last_payment_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId);

    if (error) throw error;
  }

  private async uploadFile(file: File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('payment-documents')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  }

  async getIndianBanks(): Promise<ApiResponse<IndianBank[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("indian_banks")
        .select("*")
        .eq("is_active", true)
        .order("bank_name");

      if (error) throw error;
      return { data, error: null };
    });
  }

  async getPaymentMethodConfiguration(cohortId: string): Promise<ApiResponse<PaymentMethodConfiguration>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_method_configurations")
        .select("*")
        .eq("cohort_id", cohortId)
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async verifyPayment(
    transactionId: string, 
    verifiedBy: string, 
    status: 'approved' | 'rejected', 
    notes?: string,
    rejectionReason?: string
  ): Promise<ApiResponse<PaymentTransactionRow>> {
    return this.executeQuery(async () => {
      const updateData: any = {
        verification_status: status,
        verification_notes: notes,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update the transaction status based on verification result
      if (status === 'approved') {
        updateData.status = 'success';
      } else if (status === 'rejected') {
        updateData.status = 'failed';
        if (rejectionReason) {
          updateData.rejection_reason = rejectionReason;
        }
      }

      const { data, error } = await supabase
        .from("payment_transactions")
        .update(updateData)
        .eq("id", transactionId)
        .select("*")
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }
}

export const paymentTransactionService = new PaymentTransactionService();
