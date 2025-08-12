/**
 * Payment Transaction Service
 * Handles payment transaction operations with single responsibility
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../base.service';
import { ApiResponse } from '@/types/common';
import { PaymentSubmissionData, PaymentTransactionDetail, IndianBank, PaymentMethodConfiguration } from '@/types/payments';

class PaymentTransactionService extends BaseService<PaymentTransactionDetail> {
  constructor() {
    super("payment_transaction_details");
  }

  async getByPaymentId(paymentId: string): Promise<ApiResponse<PaymentTransactionDetail[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_transaction_details")
        .select("*")
        .eq("payment_id", paymentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });
  }

  async submitPayment(paymentData: PaymentSubmissionData, userId: string): Promise<ApiResponse<PaymentTransactionDetail>> {
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
        payment_method: paymentData.paymentMethod,
        amount_paid: paymentData.amount,
        is_partial_payment: false, // Will be determined by business logic
        payment_reference_number: paymentData.referenceNumber,
        transfer_date: paymentData.transferDate,
        bank_name: paymentData.bankName,
        bank_branch: paymentData.bankBranch,
        receipt_url: receiptUrl,
        proof_of_payment_url: proofOfPaymentUrl,
        transaction_screenshot_url: transactionScreenshotUrl,
        qr_code_url: paymentData.qrCodeUrl,
        upi_id: paymentData.upiId,
        receiver_bank_name: paymentData.receiverBankName,
        receiver_bank_logo_url: paymentData.receiverBankLogoUrl,
        razorpay_payment_id: paymentData.razorpayPaymentId,
        razorpay_order_id: paymentData.razorpayOrderId,
        razorpay_signature: paymentData.razorpaySignature,
        status: 'pending',
        created_by: userId
      };

      const { data, error } = await supabase
        .from("payment_transaction_details")
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
        amount_paid: supabase.rpc('increment', { amount: amountPaid }),
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

  async verifyPayment(transactionId: string, verifiedBy: string, status: 'success' | 'failed', notes?: string): Promise<ApiResponse<PaymentTransactionDetail>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_transaction_details")
        .update({
          status,
          verification_notes: notes,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString()
        })
        .eq("id", transactionId)
        .select("*")
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }
}

export const paymentTransactionService = new PaymentTransactionService();
