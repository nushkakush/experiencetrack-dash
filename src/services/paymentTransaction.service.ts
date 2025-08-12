import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { ApiResponse } from "@/types/common";
import { PaymentSubmissionData } from "@/components/fee-collection/PaymentMethodSelector";

export interface PaymentTransactionDetail {
  id: string;
  payment_id: string;
  transaction_id?: string;
  payment_method: string;
  amount_paid: number;
  is_partial_payment: boolean;
  payment_reference_type?: 'cheque_no' | 'utr_no';
  payment_reference_number?: string;
  transfer_date?: string;
  bank_name?: string;
  bank_branch?: string;
  receipt_url?: string;
  proof_of_payment_url?: string;
  transaction_screenshot_url?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  qr_code_url?: string;
  upi_id?: string;
  receiver_bank_name?: string;
  receiver_bank_logo_url?: string;
  status: 'pending' | 'success' | 'failed' | 'verification_pending';
  verification_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface IndianBank {
  id: string;
  bank_name: string;
  bank_code?: string;
  ifsc_code_prefix?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethodConfiguration {
  id: string;
  cohort_id: string;
  cash_enabled: boolean;
  bank_transfer_enabled: boolean;
  cheque_enabled: boolean;
  scan_to_pay_enabled: boolean;
  razorpay_enabled: boolean;
  bank_account_number?: string;
  bank_account_holder?: string;
  ifsc_code?: string;
  bank_name?: string;
  bank_branch?: string;
  qr_code_url?: string;
  upi_id?: string;
  receiver_bank_name?: string;
  receiver_bank_logo_url?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  razorpay_webhook_secret?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

class PaymentTransactionService extends BaseService<PaymentTransactionDetail> {
  constructor() {
    super("payment_transaction_details");
  }

  // Get payment transaction details by payment ID
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

  // Submit a new payment transaction
  async submitPayment(
    paymentData: PaymentSubmissionData,
    userId: string
  ): Promise<ApiResponse<PaymentTransactionDetail>> {
    return this.executeQuery(async () => {
      // First, upload files if they exist
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

      // Create payment transaction detail record
      const transactionDetail = {
        payment_id: paymentData.paymentId,
        payment_method: paymentData.paymentMethod,
        amount_paid: paymentData.amountPaid,
        is_partial_payment: paymentData.isPartialPayment,
        payment_reference_type: paymentData.paymentReferenceType,
        payment_reference_number: paymentData.paymentReferenceNumber,
        transfer_date: paymentData.transferDate,
        bank_name: paymentData.bankName,
        bank_branch: paymentData.bankBranch,
        receipt_url: receiptUrl,
        proof_of_payment_url: proofOfPaymentUrl,
        transaction_screenshot_url: transactionScreenshotUrl,
        status: 'verification_pending',
        created_by: userId
      };

      const { data, error } = await supabase
        .from("payment_transaction_details")
        .insert(transactionDetail)
        .select()
        .single();

      if (error) throw error;

      // Update the student_payments table with the new payment amount
      await this.updateStudentPaymentAmount(paymentData.paymentId, paymentData.amountPaid);

      return { data, error: null };
    });
  }

  // Update student payment amount and status
  private async updateStudentPaymentAmount(paymentId: string, amountPaid: number): Promise<void> {
    const { error } = await supabase
      .from("student_payments")
      .update({
        amount_paid: supabase.rpc('add', { a: supabase.raw('amount_paid'), b: amountPaid }),
        total_amount_paid: supabase.rpc('add', { a: supabase.raw('total_amount_paid'), b: amountPaid }),
        remaining_amount: supabase.rpc('subtract', { a: supabase.raw('amount_payable'), b: supabase.rpc('add', { a: supabase.raw('total_amount_paid'), b: amountPaid }) }),
        partial_payment_count: supabase.rpc('add', { a: supabase.raw('partial_payment_count'), b: 1 }),
        last_payment_date: new Date().toISOString().split('T')[0],
        payment_completion_percentage: supabase.rpc('multiply', { 
          a: supabase.rpc('divide', { 
            a: supabase.rpc('add', { a: supabase.raw('total_amount_paid'), b: amountPaid }), 
            b: supabase.raw('amount_payable') 
          }), 
          b: 100 
        })
      })
      .eq("id", paymentId);

    if (error) throw error;
  }

  // Upload file to Supabase Storage
  private async uploadFile(file: File, folder: string): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('payment-documents')
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('payment-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Get Indian banks
  async getIndianBanks(): Promise<ApiResponse<IndianBank[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("indian_banks")
        .select("*")
        .eq("is_active", true)
        .order("bank_name", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Get payment method configuration for a cohort
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

  // Get available payment methods for a cohort
  async getAvailablePaymentMethods(cohortId: string): Promise<ApiResponse<string[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_method_configurations")
        .select("cash_enabled, bank_transfer_enabled, cheque_enabled, scan_to_pay_enabled, razorpay_enabled")
        .eq("cohort_id", cohortId)
        .single();

      if (error) throw error;

      const methods: string[] = [];
      if (data.cash_enabled) methods.push('cash');
      if (data.bank_transfer_enabled) methods.push('bank_transfer');
      if (data.cheque_enabled) methods.push('cheque');
      if (data.scan_to_pay_enabled) methods.push('scan_to_pay');
      if (data.razorpay_enabled) methods.push('razorpay');

      return { data: methods, error: null };
    });
  }

  // Verify payment transaction
  async verifyPayment(
    transactionId: string,
    verifiedBy: string,
    status: 'success' | 'failed',
    notes?: string
  ): Promise<ApiResponse<PaymentTransactionDetail>> {
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
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  // Get payment statistics for a student
  async getPaymentStatistics(studentId: string): Promise<ApiResponse<any>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("student_payments")
        .select(`
          *,
          payment_transaction_details (
            amount_paid,
            payment_method,
            status,
            created_at
          )
        `)
        .eq("student_id", studentId);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        totalPayments: data.length,
        totalAmountPaid: data.reduce((sum, payment) => sum + (payment.total_amount_paid || 0), 0),
        totalAmountRequired: data.reduce((sum, payment) => sum + payment.amount_payable, 0),
        completionPercentage: data.reduce((sum, payment) => sum + (payment.payment_completion_percentage || 0), 0) / data.length,
        pendingPayments: data.filter(payment => payment.status === 'pending').length,
        verifiedPayments: data.filter(payment => payment.status === 'paid').length
      };

      return { data: stats, error: null };
    });
  }

  // Get payment history for a student
  async getPaymentHistory(studentId: string): Promise<ApiResponse<PaymentTransactionDetail[]>> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from("payment_transaction_details")
        .select(`
          *,
          student_payments!inner (
            student_id
          )
        `)
        .eq("student_payments.student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    });
  }
}

export const paymentTransactionService = new PaymentTransactionService();
