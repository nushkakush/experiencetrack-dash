import { PaymentEntity, PaymentEntityData } from '@/features/payments/domain/PaymentEntity';
import { PaymentStatus, PaymentType, PaymentPlan } from '@/types/fee';

describe('PaymentEntity', () => {
  const basePaymentData: PaymentEntityData = {
    id: 'payment-1',
    student_id: 'student-1',
    cohort_id: 'cohort-1',
    payment_type: 'admission_fee',
    payment_plan: 'one_shot',
    base_amount: 50000,
    scholarship_amount: 5000,
    discount_amount: 0,
    gst_amount: 9000,
    amount_payable: 54000,
    amount_paid: 0,
    due_date: '2024-01-15',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  describe('Getters', () => {
    it('should return correct values from getters', () => {
      const payment = new PaymentEntity(basePaymentData);

      expect(payment.id).toBe('payment-1');
      expect(payment.studentId).toBe('student-1');
      expect(payment.cohortId).toBe('cohort-1');
      expect(payment.paymentType).toBe('admission_fee');
      expect(payment.paymentPlan).toBe('one_shot');
      expect(payment.baseAmount).toBe(50000);
      expect(payment.scholarshipAmount).toBe(5000);
      expect(payment.discountAmount).toBe(0);
      expect(payment.gstAmount).toBe(9000);
      expect(payment.amountPayable).toBe(54000);
      expect(payment.amountPaid).toBe(0);
      expect(payment.dueDate).toBe('2024-01-15');
      expect(payment.status).toBe('pending');
    });
  });

  describe('Business Logic Methods', () => {
    it('should calculate pending amount correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.pendingAmount).toBe(54000);

      // After partial payment
      payment.recordPayment(27000);
      expect(payment.pendingAmount).toBe(27000);
    });

    it('should determine if payment is paid correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.isPaid).toBe(false);

      // After full payment
      payment.recordPayment(54000);
      expect(payment.isPaid).toBe(true);
    });

    it('should determine if payment is overdue correctly', () => {
      const pastDuePayment = new PaymentEntity({
        ...basePaymentData,
        due_date: '2023-12-01', // Past date
      });
      expect(pastDuePayment.isOverdue).toBe(true);

      const futureDuePayment = new PaymentEntity({
        ...basePaymentData,
        due_date: '2024-12-01', // Future date
      });
      expect(futureDuePayment.isOverdue).toBe(false);

      // Paid payments are not overdue
      futureDuePayment.recordPayment(54000);
      expect(futureDuePayment.isOverdue).toBe(false);
    });

    it('should calculate days overdue correctly', () => {
      const pastDuePayment = new PaymentEntity({
        ...basePaymentData,
        due_date: '2023-12-01',
      });
      expect(pastDuePayment.daysOverdue).toBeGreaterThan(0);

      const futureDuePayment = new PaymentEntity({
        ...basePaymentData,
        due_date: '2024-12-01',
      });
      expect(futureDuePayment.daysOverdue).toBe(0);
    });

    it('should determine if payment is partially paid correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.isPartiallyPaid).toBe(false);

      payment.recordPayment(27000);
      expect(payment.isPartiallyPaid).toBe(true);

      payment.recordPayment(27000);
      expect(payment.isPartiallyPaid).toBe(false);
    });

    it('should calculate payment percentage correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.paymentPercentage).toBe(0);

      payment.recordPayment(27000);
      expect(payment.paymentPercentage).toBe(50);

      payment.recordPayment(27000);
      expect(payment.paymentPercentage).toBe(100);
    });
  });

  describe('Business Operations', () => {
    it('should record payment correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      const originalAmountPaid = payment.amountPaid;

      payment.recordPayment(27000);

      expect(payment.amountPaid).toBe(originalAmountPaid + 27000);
      expect(payment.paymentDate).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
    });

    it('should throw error when recording invalid payment amount', () => {
      const payment = new PaymentEntity(basePaymentData);

      expect(() => payment.recordPayment(-1000)).toThrow('Payment amount must be greater than 0');
      expect(() => payment.recordPayment(0)).toThrow('Payment amount must be greater than 0');
      expect(() => payment.recordPayment(60000)).toThrow('Payment amount cannot exceed pending amount');
    });

    it('should update status automatically when recording payment', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.status).toBe('pending');

      payment.recordPayment(27000);
      expect(payment.status).toBe('partially_paid_days_left');

      payment.recordPayment(27000);
      expect(payment.status).toBe('paid');
    });

    it('should update status manually when valid', () => {
      const payment = new PaymentEntity(basePaymentData);
      expect(payment.status).toBe('pending');

      payment.updateStatus('verification_pending');
      expect(payment.status).toBe('verification_pending');
    });

    it('should add notes correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      const notes = 'Payment received via bank transfer';

      payment.addNotes(notes);

      expect(payment.notes).toBe(notes);
      expect(payment.updatedAt).toBeDefined();
    });
  });

  describe('Validation Methods', () => {
    it('should validate payment recording correctly', () => {
      const payment = new PaymentEntity(basePaymentData);

      expect(payment.canRecordPayment(27000)).toBe(true);
      expect(payment.canRecordPayment(54000)).toBe(true);
      expect(payment.canRecordPayment(0)).toBe(false);
      expect(payment.canRecordPayment(-1000)).toBe(false);
      expect(payment.canRecordPayment(60000)).toBe(false);
    });

    it('should validate status transitions correctly', () => {
      const payment = new PaymentEntity(basePaymentData);

      // Valid transitions from pending
      expect(payment.canUpdateStatus('paid')).toBe(true);
      expect(payment.canUpdateStatus('overdue')).toBe(true);
      expect(payment.canUpdateStatus('partially_paid_days_left')).toBe(true);

      // Invalid transitions from pending
      expect(payment.canUpdateStatus('complete')).toBe(false);
      expect(payment.canUpdateStatus('dropped')).toBe(false);

      // Test paid status (cannot change from paid)
      payment.updateStatus('paid');
      expect(payment.canUpdateStatus('pending')).toBe(false);
      expect(payment.canUpdateStatus('overdue')).toBe(false);
      expect(payment.canUpdateStatus('paid')).toBe(true); // Can stay paid
    });
  });

  describe('Static Factory Methods', () => {
    it('should create payment entity with generated ID and timestamps', () => {
      const paymentData = {
        student_id: 'student-1',
        cohort_id: 'cohort-1',
        payment_type: 'admission_fee' as PaymentType,
        payment_plan: 'one_shot' as PaymentPlan,
        base_amount: 50000,
        scholarship_amount: 5000,
        discount_amount: 0,
        gst_amount: 9000,
        amount_payable: 54000,
        amount_paid: 0,
        due_date: '2024-01-15',
        status: 'pending' as PaymentStatus,
      };

      const payment = PaymentEntity.create(paymentData);

      expect(payment.id).toBeDefined();
      expect(payment.id).toHaveLength(36); // UUID length
      expect(payment.createdAt).toBeDefined();
      expect(payment.updatedAt).toBeDefined();
      expect(payment.studentId).toBe('student-1');
      expect(payment.cohortId).toBe('cohort-1');
    });

    it('should create payment entity from JSON data', () => {
      const payment = PaymentEntity.fromJSON(basePaymentData);

      expect(payment.id).toBe('payment-1');
      expect(payment.studentId).toBe('student-1');
      expect(payment.cohortId).toBe('cohort-1');
    });
  });

  describe('Data Export', () => {
    it('should export data correctly', () => {
      const payment = new PaymentEntity(basePaymentData);
      const exportedData = payment.toJSON();

      expect(exportedData).toEqual(basePaymentData);
      expect(exportedData).not.toBe(basePaymentData); // Should be a copy
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount payable correctly', () => {
      const zeroPayment = new PaymentEntity({
        ...basePaymentData,
        amount_payable: 0,
      });

      expect(zeroPayment.pendingAmount).toBe(0);
      expect(zeroPayment.isPaid).toBe(true);
      expect(zeroPayment.paymentPercentage).toBe(0);
    });

    it('should handle already paid payments correctly', () => {
      const paidPayment = new PaymentEntity({
        ...basePaymentData,
        amount_paid: 54000,
      });

      expect(paidPayment.pendingAmount).toBe(0);
      expect(paidPayment.isPaid).toBe(true);
      expect(paidPayment.isPartiallyPaid).toBe(false);
      expect(paidPayment.paymentPercentage).toBe(100);
    });

    it('should handle overdue payments correctly', () => {
      const overduePayment = new PaymentEntity({
        ...basePaymentData,
        due_date: '2023-12-01',
        amount_paid: 27000,
      });

      expect(overduePayment.isOverdue).toBe(true);
      expect(overduePayment.isPartiallyPaid).toBe(true);
      expect(overduePayment.daysOverdue).toBeGreaterThan(0);
    });
  });
});
