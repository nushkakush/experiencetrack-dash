import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CheckCircle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { CohortStudent, Cohort } from '@/types/cohort';
import { 
  PaymentModeSelector, 
  PaymentFieldRenderer,
  AmountInput, 
  usePaymentSubmission 
} from '@/components/common/payments';
import { getPaymentModeConfig } from '@/features/payments/domain/PaymentModeConfig';
import { PaymentSubmissionData, PaymentBreakdown, Installment } from '@/types/payments';
import { PartialPaymentsService } from '@/services/partialPayments.service';
import { paymentTransactionService } from '@/services/paymentTransaction.service';

interface PaymentSubmissionFormProps {
  paymentSubmissions: Map<string, PaymentSubmissionData>;
  submittingPayments: Set<string>;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: CohortStudent;
  selectedPaymentPlan?: string;
  paymentBreakdown?: PaymentBreakdown;
  selectedInstallment?: Installment;
  cohortData?: Cohort;
}

export const PaymentSubmissionForm = React.memo<PaymentSubmissionFormProps>(({
  paymentSubmissions,
  submittingPayments,
  onPaymentSubmission,
  studentData,
  selectedPaymentPlan,
  paymentBreakdown,
  selectedInstallment,
  cohortData,
}) => {
  const [partialPaymentConfig, setPartialPaymentConfig] = React.useState<{
    allowPartialPayments: boolean;
  } | null>(null);
  const [loadingPartialConfig, setLoadingPartialConfig] = React.useState(false);
  const [existingTransactions, setExistingTransactions] = React.useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(false);

  // Fetch existing transactions for this student
  const fetchExistingTransactions = React.useCallback(async () => {
    if (!studentData?.id) return;

    try {
      setLoadingTransactions(true);
      const studentPaymentId = (studentData as any).student_payment_id;
      if (!studentPaymentId) return;

      const result = await paymentTransactionService.getByPaymentId(studentPaymentId);
      if (result.success && result.data) {
        setExistingTransactions(result.data);
      }
    } catch (error) {
      console.error('Error fetching existing transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [studentData?.id]);

  // Fetch existing transactions when component mounts
  React.useEffect(() => {
    fetchExistingTransactions();
  }, [fetchExistingTransactions]);

  // Fetch partial payment configuration for this installment
  React.useEffect(() => {
    const fetchPartialPaymentConfig = async () => {
      if (!selectedInstallment || !studentData?.id) {
        console.log('🔒 [PaymentSubmissionForm] Skipping partial payment config fetch:', {
          hasSelectedInstallment: !!selectedInstallment,
          hasStudentDataId: !!studentData?.id,
          selectedInstallment,
          studentDataId: studentData?.id,
        });
        return;
      }

      try {
        setLoadingPartialConfig(true);
        const installmentKey = `${selectedInstallment.semesterNumber || 1}-${selectedInstallment.installmentNumber || 0}`;
        
        console.log('🔒 [PaymentSubmissionForm] Fetching partial payment config for:', {
          studentId: studentData.id,
          semesterNumber: selectedInstallment.semesterNumber || 1,
          installmentNumber: selectedInstallment.installmentNumber || 0,
          installmentKey,
        });
        
        const config = await PartialPaymentsService.getInstallmentPartialPaymentConfig(
          studentData.id,
          selectedInstallment.semesterNumber || 1,
          selectedInstallment.installmentNumber || 0
        );
        
        console.log('🔒 [PaymentSubmissionForm] Retrieved partial payment config:', config);
        setPartialPaymentConfig(config);
      } catch (error) {
        console.error('🚨 [PaymentSubmissionForm] Error fetching partial payment config:', error);
        setPartialPaymentConfig({ allowPartialPayments: false });
      } finally {
        setLoadingPartialConfig(false);
      }
    };

    fetchPartialPaymentConfig();
  }, [selectedInstallment, studentData?.id]);

  // Calculate partial payment info from existing transactions
  const getPartialPaymentInfo = React.useCallback(() => {
    if (!selectedInstallment || existingTransactions.length === 0) {
      return {
        totalAmount: selectedInstallment?.amountPayable || 0,
        paidAmount: 0,
        pendingAmount: selectedInstallment?.amountPayable || 0,
        partialPaymentCount: 0,
        maxPartialPayments: 2,
      };
    }

    const installmentKey = `${selectedInstallment.semesterNumber || 1}-${selectedInstallment.installmentNumber || 0}`;
    
    const relevantTransactions = existingTransactions.filter(tx => {
      const txKey = typeof tx?.installment_id === 'string' ? String(tx.installment_id) : '';
      const matchesKey = txKey === installmentKey;
      const matchesSemester = Number(tx?.semester_number) === Number(selectedInstallment.semesterNumber);
      return matchesKey || (!!txKey === false && matchesSemester);
    });

    const approvedTransactions = relevantTransactions.filter(tx => 
      tx.verification_status === 'approved'
    );

    const totalPaid = approvedTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalAmount = selectedInstallment.amountPayable || 0;
    const pendingAmount = Math.max(0, totalAmount - totalPaid);

    return {
      totalAmount,
      paidAmount: totalPaid,
      pendingAmount,
      partialPaymentCount: approvedTransactions.length,
      maxPartialPayments: 2,
    };
  }, [selectedInstallment, existingTransactions]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔒 PaymentSubmissionForm Partial Payment Config:', {
      partialPaymentConfig,
      allowPartialPayments: partialPaymentConfig?.allowPartialPayments || false,
      isFixedAmount: partialPaymentConfig === null ? true : !partialPaymentConfig.allowPartialPayments,
      loadingPartialConfig,
      selectedInstallment,
      studentDataId: studentData?.id,
      partialPaymentInfo: getPartialPaymentInfo(),
    });
  }, [partialPaymentConfig, loadingPartialConfig, selectedInstallment, studentData?.id, getPartialPaymentInfo]);
  const {
    selectedPaymentMode,
    amountToPay,
    paymentDetails,
    errors,
    uploadedFiles,
    maxAmount,
    handlePaymentModeChange,
    handleAmountChange,
    handlePaymentDetailsChange,
    handleFileUpload,
    handleRemoveFile,
    handleSubmit
  } = usePaymentSubmission({
    studentData,
    selectedPaymentPlan,
    paymentBreakdown,
    selectedInstallment,
    onPaymentSubmission
  });

  const isSubmitting = submittingPayments.has('student-payment');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Submit Payment
        </h3>
        <p className="text-sm text-muted-foreground">
          {selectedInstallment ? 
            `Submit payment for ${selectedPaymentPlan === 'sem_wise' ? `Semester ${selectedInstallment.semesterNumber} Payment` : 
             selectedPaymentPlan === 'one_shot' ? 'Full Payment' :
             `Installment Payment`}` :
            selectedPaymentPlan === 'one_shot' ? 
            'Submit your one-time program fee payment' :
            selectedPaymentPlan === 'sem_wise' ? 
            'Submit your semester fee payment' :
            'Submit your installment payment'
          }
        </p>
      </div>
      <div className="space-y-6">
        {/* Payment Mode Selection */}
        <PaymentModeSelector
          selectedPaymentMode={selectedPaymentMode}
          onPaymentModeChange={handlePaymentModeChange}
          paymentDetails={paymentDetails}
          onPaymentDetailsChange={handlePaymentDetailsChange}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onRemoveFile={handleRemoveFile}
          errors={errors}
        />

        {/* Payment Mode Specific Fields */}
        {selectedPaymentMode && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Payment Details</h4>
            <PaymentFieldRenderer
              config={getPaymentModeConfig(selectedPaymentMode)}
              paymentDetails={paymentDetails}
              uploadedFiles={uploadedFiles}
              errors={errors}
              onFieldChange={(fieldName, value) => {
                handlePaymentDetailsChange({
                  ...paymentDetails,
                  [fieldName]: value
                });
              }}
              onFileUpload={handleFileUpload}
            />
          </div>
        )}

        <Separator />

        {/* Amount Input */}
        {loadingPartialConfig ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount to Pay</Label>
              <div className="w-full px-3 py-2 pl-8 pr-16 border rounded-md bg-muted text-lg font-medium">
                Loading...
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const allowPartialPayments = partialPaymentConfig?.allowPartialPayments || false;
            const isFixedAmount = partialPaymentConfig === null ? true : !partialPaymentConfig.allowPartialPayments;
            
            console.log('🔒 [PaymentSubmissionForm] AmountInput props being passed:', {
              partialPaymentConfig,
              allowPartialPayments,
              isFixedAmount,
              maxAmount,
              currentAmount: amountToPay,
            });
            
            return (
              <AmountInput
                amount={amountToPay}
                maxAmount={maxAmount}
                onAmountChange={handleAmountChange}
                error={errors.amount}
                disabled={isSubmitting}
                allowPartialPayments={allowPartialPayments}
                isFixedAmount={isFixedAmount}
                partialPaymentInfo={getPartialPaymentInfo()}
              />
            );
          })()
        )}

        <Separator />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPaymentMode || amountToPay <= 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Payment
              </>
            )}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {paymentSubmissions.has('student-payment') && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Payment submitted successfully! You will receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
});

PaymentSubmissionForm.displayName = 'PaymentSubmissionForm';

export default PaymentSubmissionForm;
