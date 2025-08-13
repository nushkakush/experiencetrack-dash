import { ApiResponse } from '@/types/common';
import { PaymentPlan } from '@/types/fee';
import { 
  StudentPaymentRow,
  PaymentTransactionRow,
  CommunicationHistoryRow,
  StudentPaymentSummaryRow
} from '@/types/payments/DatabaseAlignedTypes';
import { PaymentCalculationService } from './PaymentCalculationService';
import { PaymentQueryService } from './PaymentQueryService';
import { PaymentTransactionService } from './PaymentTransactionService';
import { CommunicationService } from './CommunicationService';

// Type aliases for backward compatibility
type StudentPayment = StudentPaymentRow;
type PaymentTransaction = PaymentTransactionRow;
type CommunicationHistory = CommunicationHistoryRow;
type StudentPaymentSummary = StudentPaymentSummaryRow;

export class StudentPaymentsService {
  private paymentCalculationService: PaymentCalculationService;
  private paymentQueryService: PaymentQueryService;
  private paymentTransactionService: PaymentTransactionService;
  private communicationService: CommunicationService;

  constructor() {
    this.paymentCalculationService = new PaymentCalculationService();
    this.paymentQueryService = new PaymentQueryService();
    this.paymentTransactionService = new PaymentTransactionService();
    this.communicationService = new CommunicationService();
  }

  // Query operations
  async getStudentPayments(cohortId: string): Promise<ApiResponse<StudentPaymentRow[]>> {
    return this.paymentQueryService.getStudentPayments(cohortId);
  }

  async getStudentPaymentByStudentId(studentId: string, cohortId: string): Promise<ApiResponse<StudentPayment[]>> {
    return this.paymentQueryService.getStudentPaymentByStudentId(studentId, cohortId);
  }

  async getStudentPaymentSummary(cohortId: string): Promise<ApiResponse<StudentPaymentSummary[]>> {
    return this.paymentQueryService.getStudentPaymentSummary(cohortId);
  }

  async getPaymentTransactions(paymentId: string): Promise<ApiResponse<PaymentTransaction[]>> {
    return this.paymentQueryService.getPaymentTransactions(paymentId);
  }

  async getCommunicationHistory(studentId: string): Promise<ApiResponse<CommunicationHistory[]>> {
    return this.paymentQueryService.getCommunicationHistory(studentId);
  }

  // Transaction operations
  async updatePaymentStatus(paymentId: string, status: string, notes?: string): Promise<ApiResponse<StudentPayment>> {
    return this.paymentTransactionService.updatePaymentStatus(paymentId, status as any, notes);
  }

  async recordPayment(
    paymentId: string, 
    amount: number, 
    paymentMethod: PaymentTransaction['payment_method'],
    referenceNumber?: string,
    notes?: string
  ): Promise<ApiResponse<PaymentTransaction>> {
    return this.paymentTransactionService.recordPayment(paymentId, amount, paymentMethod, referenceNumber, notes);
  }

  // Communication operations
  async sendCommunication(
    studentId: string,
    type: CommunicationHistory['type'],
    channel: CommunicationHistory['channel'],
    subject: string,
    message: string
  ): Promise<ApiResponse<CommunicationHistory>> {
    return this.communicationService.sendCommunication(studentId, type, channel, subject, message);
  }

  // Payment calculation operations
  async updateStudentPaymentPlan(
    studentId: string,
    cohortId: string,
    paymentPlan: PaymentPlan,
    scholarshipId?: string,
    forceUpdate: boolean = false
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.paymentCalculationService.calculatePaymentPlan(studentId, cohortId, paymentPlan, scholarshipId, forceUpdate);
  }

  async recalculatePaymentSchedules(cohortId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return this.paymentCalculationService.recalculateExistingPaymentSchedules(cohortId);
  }
}
