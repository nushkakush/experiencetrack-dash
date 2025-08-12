import React from 'react';
import { TableCell } from '@/components/ui/table';
import { StudentPaymentSummary, PaymentType } from '@/types/fee';

interface FeeStructureData {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  start_date?: string;
}

interface NextDuePayment {
  payment_type: PaymentType;
  due_date: string;
  amount_payable: number;
  isFirstPayment?: boolean;
}

interface NextDueCellProps {
  student: StudentPaymentSummary;
  feeStructure?: FeeStructureData;
}

export const NextDueCell: React.FC<NextDueCellProps> = ({ student, feeStructure }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPaymentTypeDisplay = (paymentType: PaymentType) => {
    switch (paymentType) {
      case 'admission_fee':
        return 'Admission Fee';
      case 'instalments':
        return 'Instalments';
      case 'one_shot':
        return 'One-Shot';
      case 'sem_plan':
        return 'Sem Plan';
      default:
        return paymentType;
    }
  };

  const getNextDuePayment = (student: StudentPaymentSummary) => {
    // If student hasn't selected a payment plan, show the first payment date from fee structure
    if (!student.payment_plan || student.payment_plan === 'not_selected') {
      if (feeStructure && feeStructure.start_date) {
        return {
          payment_type: 'admission_fee' as PaymentType,
          due_date: feeStructure.start_date,
          amount_payable: feeStructure.admission_fee || 0,
          isFirstPayment: true
        } as NextDuePayment; // Type assertion to handle the additional property
      }
      return null;
    }

    // Find the next pending payment
    const pendingPayments = student.payments?.filter(p => 
      p.status === 'pending' || p.status === 'overdue' || p.status === 'partially_paid_overdue'
    );
    
    if (!pendingPayments || pendingPayments.length === 0) return null;
    
    return pendingPayments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  };

  const nextDue = getNextDuePayment(student);

  return (
    <TableCell>
      {nextDue ? (
        <div>
          <div className="font-medium">
            {getPaymentTypeDisplay(nextDue.payment_type)}
            {nextDue.isFirstPayment && <span className="text-xs text-muted-foreground ml-1">(First Payment)</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(nextDue.due_date)}
          </div>
          <div className="text-sm font-medium">
            {formatCurrency(nextDue.amount_payable)}
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">No pending payments</span>
      )}
    </TableCell>
  );
};
