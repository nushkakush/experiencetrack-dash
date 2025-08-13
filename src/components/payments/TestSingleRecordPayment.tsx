import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSingleRecordPayment } from '@/pages/dashboards/student/hooks/useSingleRecordPayment';
import { PaymentPlan } from '@/types/fee';
import { toast } from 'sonner';

interface TestSingleRecordPaymentProps {
  studentId: string;
  cohortId: string;
}

export const TestSingleRecordPayment: React.FC<TestSingleRecordPaymentProps> = ({
  studentId,
  cohortId
}) => {
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    paymentRecord,
    loading: paymentLoading,
    error,
    setupPaymentPlan,
    recordPayment,
    getPaymentBreakdown,
    refresh
  } = useSingleRecordPayment({ studentId, cohortId, feeStructure });

  const handleSetupPlan = async (plan: PaymentPlan) => {
    setLoading(true);
    try {
      // Create a mock fee structure for testing
      const mockFeeStructure = {
        total_program_fee: 120000,
        admission_fee: 20000,
        number_of_semesters: 4,
        instalments_per_semester: 3
      };
      setFeeStructure(mockFeeStructure);

      await setupPaymentPlan(plan);
      toast.success(`Payment plan "${plan}" setup successfully!`);
      await refresh();
    } catch (error) {
      toast.error(`Failed to setup payment plan: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestPayment = async (amount: number) => {
    try {
      await recordPayment(amount, 'bank_transfer', `TEST-${Date.now()}`, 'Test payment');
      toast.success(`Payment of ₹${amount} recorded successfully!`);
      await refresh();
    } catch (error) {
      toast.error(`Failed to record payment: ${error}`);
    }
  };

  const breakdown = getPaymentBreakdown();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Single Record Payment System</CardTitle>
          <CardDescription>Testing the new single record approach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Setup Payment Plan */}
            <div>
              <h3 className="font-semibold mb-2">Setup Payment Plan</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSetupPlan('one_shot')} 
                  disabled={loading}
                  variant="outline"
                >
                  One Shot
                </Button>
                <Button 
                  onClick={() => handleSetupPlan('sem_wise')} 
                  disabled={loading}
                  variant="outline"
                >
                  Semester Wise
                </Button>
                <Button 
                  onClick={() => handleSetupPlan('instalment_wise')} 
                  disabled={loading}
                  variant="outline"
                >
                  Installment Wise
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <div>
              <h3 className="font-semibold mb-2">Current Status</h3>
              {paymentLoading ? (
                <div>Loading...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : paymentRecord ? (
                <div className="space-y-2">
                  <div><strong>Plan:</strong> {paymentRecord.payment_plan}</div>
                  <div><strong>Status:</strong> {paymentRecord.payment_status}</div>
                  <div><strong>Total Payable:</strong> ₹{paymentRecord.total_amount_payable?.toLocaleString()}</div>
                  <div><strong>Total Paid:</strong> ₹{paymentRecord.total_amount_paid?.toLocaleString()}</div>
                  <div><strong>Total Pending:</strong> ₹{paymentRecord.total_amount_pending?.toLocaleString()}</div>
                  <div><strong>Next Due:</strong> {paymentRecord.next_due_date || 'N/A'}</div>
                </div>
              ) : (
                <div>No payment plan set</div>
              )}
            </div>

            {/* Payment Schedule */}
            {breakdown && (
              <div>
                <h3 className="font-semibold mb-2">Payment Schedule</h3>
                <div className="space-y-2">
                  <div><strong>Total Installments:</strong> {breakdown.installments?.length || 0}</div>
                  <div><strong>Next Due Amount:</strong> ₹{breakdown.nextDueAmount?.toLocaleString() || 0}</div>
                  <div><strong>Completion:</strong> {breakdown.completionPercentage?.toFixed(1) || 0}%</div>
                </div>
              </div>
            )}

            {/* Test Payments */}
            {paymentRecord && (
              <div>
                <h3 className="font-semibold mb-2">Test Payments</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleTestPayment(10000)} 
                    disabled={paymentRecord.total_amount_pending === 0}
                    size="sm"
                  >
                    Pay ₹10,000
                  </Button>
                  <Button 
                    onClick={() => handleTestPayment(5000)} 
                    disabled={paymentRecord.total_amount_pending === 0}
                    size="sm"
                  >
                    Pay ₹5,000
                  </Button>
                  <Button 
                    onClick={() => handleTestPayment(20000)} 
                    disabled={paymentRecord.total_amount_pending === 0}
                    size="sm"
                  >
                    Pay ₹20,000
                  </Button>
                </div>
              </div>
            )}

            {/* Raw Data */}
            {paymentRecord && (
              <div>
                <h3 className="font-semibold mb-2">Raw Data (Debug)</h3>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(paymentRecord, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
