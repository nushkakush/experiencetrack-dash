import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSingleRecordPayment } from '@/pages/dashboards/student/hooks/useSingleRecordPayment';
import { PaymentPlan } from '@/types/fee';
import { FeeStructure } from '@/types/payments/FeeStructureTypes';
import { toast } from 'sonner';
import {
  IndianRupee,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Building2,
  FileText,
} from 'lucide-react';

interface SingleRecordPaymentDashboardProps {
  studentId: string;
  cohortId: string;
  feeStructure?: FeeStructure;
}

export const SingleRecordPaymentDashboard: React.FC<
  SingleRecordPaymentDashboardProps
> = ({ studentId, cohortId, feeStructure }) => {
  const {
    paymentRecord,
    loading,
    error,
    setupPaymentPlan,
    recordPayment,
    getPaymentBreakdown,
  } = useSingleRecordPayment({ studentId, cohortId, feeStructure });

  const breakdown = getPaymentBreakdown();

  const handlePlanSelection = async (plan: PaymentPlan) => {
    try {
      await setupPaymentPlan(plan);
      toast.success(`Payment plan "${plan}" selected successfully!`);
    } catch (error) {
      toast.error('Failed to select payment plan. Please try again.');
    }
  };

  const handlePayment = async (amount: number) => {
    try {
      await recordPayment(
        amount,
        'bank_transfer',
        `REF-${Date.now()}`,
        'Test payment'
      );
      toast.success(`Payment of ₹${amount} recorded successfully!`);
    } catch (error) {
      toast.error('Failed to record payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Payment Dashboard</CardTitle>
            <CardDescription>Loading payment information...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='h-4 bg-gray-200 rounded animate-pulse'></div>
              <div className='h-20 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Payment Dashboard</CardTitle>
            <CardDescription>Error loading payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-red-600'>{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment plan selection if no plan is selected
  if (!paymentRecord || paymentRecord.payment_plan === 'not_selected') {
    return (
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Plan</CardTitle>
            <CardDescription>
              Choose your preferred payment plan to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Card
                className='cursor-pointer hover:shadow-md transition-shadow'
                onClick={() => handlePlanSelection('one_shot')}
              >
                <CardContent className='p-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <IndianRupee className='h-8 w-8 text-green-600' />
                    <div>
                      <h3 className='font-semibold'>One Shot Payment</h3>
                      <p className='text-sm text-muted-foreground'>
                        Pay everything upfront
                      </p>
                    </div>
                  </div>
                  <Button className='w-full' variant='outline'>
                    Select Plan
                  </Button>
                </CardContent>
              </Card>

              <Card
                className='cursor-pointer hover:shadow-md transition-shadow'
                onClick={() => handlePlanSelection('sem_wise')}
              >
                <CardContent className='p-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <Building2 className='h-8 w-8 text-blue-600' />
                    <div>
                      <h3 className='font-semibold'>Semester Wise</h3>
                      <p className='text-sm text-muted-foreground'>
                        Pay by semester
                      </p>
                    </div>
                  </div>
                  <Button className='w-full' variant='outline'>
                    Select Plan
                  </Button>
                </CardContent>
              </Card>

              <Card
                className='cursor-pointer hover:shadow-md transition-shadow'
                onClick={() => handlePlanSelection('instalment_wise')}
              >
                <CardContent className='p-6'>
                  <div className='flex items-center gap-3 mb-4'>
                    <FileText className='h-8 w-8 text-purple-600' />
                    <div>
                      <h3 className='font-semibold'>Installment Wise</h3>
                      <p className='text-sm text-muted-foreground'>
                        Monthly installments
                      </p>
                    </div>
                  </div>
                  <Button className='w-full' variant='outline'>
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment dashboard
  return (
    <div className='space-y-6'>
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>
            Your payment plan and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                ₹{breakdown?.totalPaid.toLocaleString()}
              </div>
              <div className='text-sm text-muted-foreground'>Total Paid</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                ₹{breakdown?.totalPending.toLocaleString()}
              </div>
              <div className='text-sm text-muted-foreground'>Total Pending</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                ₹{breakdown?.nextDueAmount.toLocaleString()}
              </div>
              <div className='text-sm text-muted-foreground'>Next Due</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-600'>
                {breakdown?.completionPercentage.toFixed(1)}%
              </div>
              <div className='text-sm text-muted-foreground'>Completion</div>
            </div>
          </div>

          <div className='space-y-4'>
            <div>
              <div className='flex justify-between text-sm mb-2'>
                <span>Payment Progress</span>
                <span>{breakdown?.completionPercentage.toFixed(1)}%</span>
              </div>
              <Progress
                value={breakdown?.completionPercentage}
                className='h-2'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Badge
                variant={
                  breakdown?.paymentStatus === 'paid' ||
                  breakdown?.paymentStatus === 'waived'
                    ? 'default'
                    : 'secondary'
                }
              >
                {(breakdown?.paymentStatus === 'paid' ||
                  breakdown?.paymentStatus === 'waived') && (
                  <CheckCircle className='h-3 w-3 mr-1' />
                )}
                {breakdown?.paymentStatus === 'partially_paid' && (
                  <Clock className='h-3 w-3 mr-1' />
                )}
                {breakdown?.paymentStatus === 'pending' && (
                  <AlertTriangle className='h-3 w-3 mr-1' />
                )}
                {breakdown?.paymentStatus?.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className='text-sm text-muted-foreground'>
                Plan: {breakdown?.paymentPlan?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>
            Your payment installments and due dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {breakdown?.installments.map((installment, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 border rounded-lg'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    {(installment.status === 'paid' ||
                      installment.status === 'waived') && (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    )}
                    {installment.status === 'partially_paid' && (
                      <Clock className='h-4 w-4 text-yellow-600' />
                    )}
                    {installment.status === 'overdue' && (
                      <AlertTriangle className='h-4 w-4 text-red-600' />
                    )}
                    {installment.status === 'pending' && (
                      <Calendar className='h-4 w-4 text-gray-600' />
                    )}
                  </div>
                  <div>
                    <div className='font-medium'>
                      {installment.semester_number
                        ? `Semester ${installment.semester_number}`
                        : `Installment ${installment.installment_number}`}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Due: {new Date(installment.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-medium'>
                    ₹{installment.amount.toLocaleString()}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {installment.amount_paid > 0 &&
                      `Paid: ₹${installment.amount_paid.toLocaleString()}`}
                    {installment.amount_pending > 0 &&
                      `Pending: ₹${installment.amount_pending.toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Payment Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Record payments or view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-2'>
            <Button
              onClick={() => handlePayment(10000)}
              disabled={breakdown?.totalPending === 0}
              className='flex-1'
            >
              <CreditCard className='h-4 w-4 mr-2' />
              Record Payment (₹10,000)
            </Button>
            <Button
              onClick={() => handlePayment(5000)}
              disabled={breakdown?.totalPending === 0}
              className='flex-1'
            >
              <CreditCard className='h-4 w-4 mr-2' />
              Record Payment (₹5,000)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
