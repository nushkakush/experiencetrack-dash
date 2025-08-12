import { PaymentStatus, PaymentType, PaymentPlan } from '@/types/fee';

export interface PaymentEntityData {
  id: string;
  student_id: string;
  cohort_id: string;
  payment_type: PaymentType;
  payment_plan: PaymentPlan;
  base_amount: number;
  scholarship_amount: number;
  discount_amount: number;
  gst_amount: number;
  amount_payable: number;
  amount_paid: number;
  due_date: string;
  payment_date?: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class PaymentEntity {
  private data: PaymentEntityData;

  constructor(data: PaymentEntityData) {
    this.data = { ...data };
  }

  // Getters
  get id(): string { return this.data.id; }
  get studentId(): string { return this.data.student_id; }
  get cohortId(): string { return this.data.cohort_id; }
  get paymentType(): PaymentType { return this.data.payment_type; }
  get paymentPlan(): PaymentPlan { return this.data.payment_plan; }
  get baseAmount(): number { return this.data.base_amount; }
  get scholarshipAmount(): number { return this.data.scholarship_amount; }
  get discountAmount(): number { return this.data.discount_amount; }
  get gstAmount(): number { return this.data.gst_amount; }
  get amountPayable(): number { return this.data.amount_payable; }
  get amountPaid(): number { return this.data.amount_paid; }
  get dueDate(): string { return this.data.due_date; }
  get paymentDate(): string | undefined { return this.data.payment_date; }
  get status(): PaymentStatus { return this.data.status; }
  get notes(): string | undefined { return this.data.notes; }
  get createdAt(): string { return this.data.created_at; }
  get updatedAt(): string { return this.data.updated_at; }

  // Business logic methods
  get pendingAmount(): number {
    return Math.max(0, this.amountPayable - this.amountPaid);
  }

  get isPaid(): boolean {
    return this.amountPaid >= this.amountPayable;
  }

  get isOverdue(): boolean {
    if (this.isPaid) return false;
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    return today > dueDate;
  }

  get daysOverdue(): number {
    if (this.isPaid || !this.isOverdue) return 0;
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  get isPartiallyPaid(): boolean {
    return this.amountPaid > 0 && !this.isPaid;
  }

  get paymentPercentage(): number {
    if (this.amountPayable === 0) return 0;
    return Math.round((this.amountPaid / this.amountPayable) * 100);
  }

  // Business operations
  recordPayment(amount: number, paymentDate?: string): void {
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (amount > this.pendingAmount) {
      throw new Error('Payment amount cannot exceed pending amount');
    }

    this.data.amount_paid += amount;
    this.data.payment_date = paymentDate || new Date().toISOString();
    this.data.updated_at = new Date().toISOString();

    // Update status based on payment
    this.updateStatus();
  }

  updateStatus(newStatus?: PaymentStatus): void {
    if (newStatus) {
      this.data.status = newStatus;
    } else {
      // Auto-update status based on current state
      if (this.isPaid) {
        this.data.status = 'paid';
      } else if (this.isOverdue) {
        this.data.status = this.isPartiallyPaid ? 'partially_paid_overdue' : 'overdue';
      } else if (this.isPartiallyPaid) {
        this.data.status = 'partially_paid_days_left';
      } else {
        this.data.status = 'pending';
      }
    }

    this.data.updated_at = new Date().toISOString();
  }

  addNotes(notes: string): void {
    this.data.notes = notes;
    this.data.updated_at = new Date().toISOString();
  }

  // Validation methods
  canRecordPayment(amount: number): boolean {
    return amount > 0 && amount <= this.pendingAmount;
  }

  canUpdateStatus(newStatus: PaymentStatus): boolean {
    // Business rules for status transitions
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ['paid', 'overdue', 'partially_paid_days_left'],
      pending_10_plus_days: ['paid', 'overdue', 'partially_paid_days_left'],
      verification_pending: ['paid', 'verification_pending'],
      paid: ['paid'], // Cannot change from paid
      overdue: ['paid', 'partially_paid_overdue'],
      not_setup: ['pending', 'paid'],
      awaiting_bank_approval_e_nach: ['paid', 'setup_request_failed_e_nach'],
      awaiting_bank_approval_physical_mandate: ['paid', 'setup_request_failed_physical_mandate'],
      setup_request_failed_e_nach: ['pending', 'paid'],
      setup_request_failed_physical_mandate: ['pending', 'paid'],
      on_time: ['paid'],
      failed_5_days_left: ['paid', 'overdue'],
      complete: ['complete'],
      dropped: ['dropped'],
      upcoming: ['pending', 'paid'],
      partially_paid_verification_pending: ['paid', 'partially_paid_verification_pending'],
      partially_paid_days_left: ['paid', 'partially_paid_overdue'],
      partially_paid_overdue: ['paid'],
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  // Data export
  toJSON(): PaymentEntityData {
    return { ...this.data };
  }

  // Static factory methods
  static create(data: Omit<PaymentEntityData, 'id' | 'created_at' | 'updated_at'>): PaymentEntity {
    const now = new Date().toISOString();
    const entityData: PaymentEntityData = {
      ...data,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    return new PaymentEntity(entityData);
  }

  static fromJSON(data: PaymentEntityData): PaymentEntity {
    return new PaymentEntity(data);
  }
}
