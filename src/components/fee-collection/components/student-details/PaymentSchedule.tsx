import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import { generateFeeStructureReview } from '@/utils/fee-calculations';
import { paymentTransactionService } from '@/services/paymentTransaction.service';
import { supabase } from '@/integrations/supabase/client';

interface PaymentScheduleProps {
  student: StudentPaymentSummary;
}

interface PaymentScheduleItem {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'verification_pending' | 'paid' | 'overdue';
  paymentDate?: string;
  verificationStatus?: string;
}

export const PaymentSchedule: React.FC<PaymentScheduleProps> = ({ student }) => {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentSchedule = async () => {
      try {
        setLoading(true);
        const schedule = await calculatePaymentSchedule();
        setPaymentSchedule(schedule);
      } catch (error) {
        console.error('Error fetching payment schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentSchedule();
  }, [student]);

  const calculatePaymentSchedule = async (): Promise<PaymentScheduleItem[]> => {
    if (!student.student_id || !student.payment_plan || student.payment_plan === 'not_selected') {
      return [];
    }

    try {
      // Always generate the complete payment structure using centralized fee calculation
      const completeSchedule = await generateCompletePaymentStructure();
      
      // Merge with existing transaction data to update statuses
      const mergedSchedule = await mergeWithTransactionData(completeSchedule);
      
      return mergedSchedule;
    } catch (error) {
      console.error('Error calculating payment schedule:', error);
      return [];
    }
  };

  // Generate complete payment structure using centralized fee calculation
  const generateCompletePaymentStructure = async (): Promise<PaymentScheduleItem[]> => {
    // Fetch fee structure for the cohort
    const { data: feeStructure } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('cohort_id', student.student?.cohort_id)
      .single();

    if (!feeStructure) {
      throw new Error('Fee structure not found');
    }

    // Fetch scholarships
    const { data: scholarships } = await supabase
      .from('scholarships')
      .select('*')
      .eq('cohort_id', student.student?.cohort_id);

    // Fetch cohort data for start date
    const { data: cohortData } = await supabase
      .from('cohorts')
      .select('start_date')
      .eq('id', student.student?.cohort_id)
      .single();

    // Generate fee structure review to get complete payment breakdown
    const feeReview = generateFeeStructureReview(
      feeStructure,
      scholarships || [],
      student.payment_plan,
      0, // test score
      cohortData?.start_date || new Date().toISOString(),
      student.scholarship_id
    );

    const schedule: PaymentScheduleItem[] = [];

    // Add admission fee (always first) - always marked as paid since student is registered
    schedule.push({
      id: 'admission_fee',
      type: 'Admission Fee',
      amount: feeStructure.admission_fee,
      dueDate: cohortData?.start_date || new Date().toISOString(),
      status: 'paid',
      paymentDate: new Date().toISOString()
    });

    // Add program fee installments based on payment plan
    if (student.payment_plan === 'one_shot') {
      const programFeeAmount = feeReview.overallSummary.totalAmountPayable - feeStructure.admission_fee;
      
      schedule.push({
        id: 'program_fee_one_shot',
        type: 'Program Fee (One-Shot)',
        amount: programFeeAmount,
        dueDate: cohortData?.start_date || new Date().toISOString(),
        status: 'pending', // Will be updated by mergeWithTransactionData
        paymentDate: undefined,
        verificationStatus: undefined
      });
    } else if (student.payment_plan === 'sem_wise') {
      // Add all semester-wise payments (including future ones)
      feeReview.semesters.forEach((semester, index) => {
        const semesterAmount = semester.total.totalPayable;
        const dueDate = semester.instalments[0]?.paymentDate || new Date().toISOString();
        
        schedule.push({
          id: `semester_${index + 1}`,
          type: `Program Fee (Semester ${index + 1})`,
          amount: semesterAmount,
          dueDate: dueDate,
          status: 'pending', // Will be updated by mergeWithTransactionData
          paymentDate: undefined,
          verificationStatus: undefined
        });
      });
    } else if (student.payment_plan === 'instalment_wise') {
      // Add all installment-wise payments (including future ones)
      let installmentIndex = 1;
      feeReview.semesters.forEach((semester) => {
        semester.instalments.forEach((installment) => {
          schedule.push({
            id: `installment_${installmentIndex}`,
            type: `Program Fee (Instalment ${installmentIndex})`,
            amount: installment.amountPayable,
            dueDate: installment.paymentDate,
            status: 'pending', // Will be updated by mergeWithTransactionData
            paymentDate: undefined,
            verificationStatus: undefined
          });
          installmentIndex++;
        });
      });
    }

    return schedule;
  };

  // Merge complete payment structure with transaction data to update statuses
  const mergeWithTransactionData = async (completeSchedule: PaymentScheduleItem[]): Promise<PaymentScheduleItem[]> => {
    // Fetch payment transactions to check verification status
    let transactions: Array<{ verification_status?: string; amount?: string | number }> = [];
    
    // Ensure we have a payment_id; fall back to querying by student/cohort if not provided
    let paymentId: string | undefined = student.student_payment_id as string | undefined;
    if (!paymentId) {
      const { data: paymentRecord } = await supabase
        .from('student_payments')
        .select('id')
        .eq('student_id', student.student_id)
        .eq('cohort_id', student.student?.cohort_id)
        .single();
      paymentId = paymentRecord?.id;
    }
    
    if (paymentId) {
      const transactionResponse = await paymentTransactionService.getByPaymentId(paymentId);
      if (transactionResponse.success && transactionResponse.data) {
        transactions = transactionResponse.data;
      }
    }

    // Update schedule items with transaction data
    return completeSchedule.map(scheduleItem => {
      // Skip admission fee - it's always paid
      if (scheduleItem.id === 'admission_fee') {
        return scheduleItem;
      }

      // Find transactions that match this payment's amount
      const matchingTransactions = transactions.filter(t => 
        Math.abs(Number(t.amount) - scheduleItem.amount) < 1 // Allow for small rounding differences
      );

      const hasMatchingApprovedTransaction = matchingTransactions.some(t => 
        t.verification_status === 'approved'
      );
      const hasMatchingVerificationPendingTransaction = matchingTransactions.some(t => 
        t.verification_status === 'verification_pending'
      );

      let status: 'pending' | 'verification_pending' | 'paid' = 'pending';
      let verificationStatus: string | undefined = undefined;
      let paymentDate: string | undefined = undefined;

      if (hasMatchingApprovedTransaction) {
        status = 'paid';
        paymentDate = new Date().toISOString(); // Use current date as payment date
      } else if (hasMatchingVerificationPendingTransaction) {
        status = 'verification_pending';
        verificationStatus = 'verification_pending';
      }

      return {
        ...scheduleItem,
        status,
        paymentDate,
        verificationStatus
      };
    });
  };



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

  const getStatusBadge = (status: string, verificationStatus?: string) => {
    if (verificationStatus === 'verification_pending') {
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">Verification Pending</Badge>;
    }
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">Overdue</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-border text-xs">Pending</Badge>;
    }
  };

  // Check if payment plan is selected
  const hasPaymentPlan = student.payment_plan && student.payment_plan !== 'not_selected';

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-20 bg-muted rounded mb-2"></div>
          <div className="h-20 bg-muted rounded mb-2"></div>
          <div className="h-20 bg-muted rounded mb-2"></div>
        </div>
      </div>
    );
  }

  // Empty state when no payment plan is selected
  if (!hasPaymentPlan) {
    return (
      <>
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Schedule Available</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            Payment schedule will be generated once the student selects a payment plan. This will show all upcoming payments and due dates.
          </p>
          
          {/* Schedule Preview */}
          <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium">One-Shot Payment</p>
                <p className="text-xs text-muted-foreground">Single payment due immediately</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Semester-wise</p>
                <p className="text-xs text-muted-foreground">Payments due at semester start</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Installment-wise</p>
                <p className="text-xs text-muted-foreground">Regular monthly payments</p>
              </div>
            </div>
          </div>
        </div>
        <Separator className="bg-border" />
      </>
    );
  }

  return (
    <>
      <div>
        {paymentSchedule.length > 0 ? (
          <div className="space-y-3">
            {paymentSchedule.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-foreground">
                    {item.type}
                  </span>
                  {getStatusBadge(item.status, item.verificationStatus)}
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Amount Payable:</span>
                    <span className="text-foreground">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due:</span>
                    <span className="text-foreground">{formatDate(item.dueDate)}</span>
                  </div>
                  {item.paymentDate && (
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="text-foreground">{formatDate(item.paymentDate)}</span>
                    </div>
                  )}
                  {item.verificationStatus === 'verification_pending' && (
                    <div className="text-yellow-600 text-xs mt-2">
                      Payment proof submitted, awaiting verification
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Payments Scheduled</h3>
            <p className="text-sm text-muted-foreground">
              Payment schedule is being generated. Please check back later.
            </p>
          </div>
        )}
      </div>
      <Separator className="bg-border" />
    </>
  );
};
