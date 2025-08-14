import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CheckCircle
} from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { 
  PaymentModeSelector, 
  PaymentFieldRenderer,
  AmountInput, 
  usePaymentSubmission 
} from '@/components/common/payments';
import { getPaymentModeConfig } from '@/features/payments/domain/PaymentModeConfig';
import { PaymentSubmissionData, PaymentBreakdown, Installment } from '@/types/payments';

interface PaymentSubmissionFormProps {
  paymentSubmissions: Map<string, PaymentSubmissionData>;
  submittingPayments: Set<string>;
  onPaymentSubmission: (paymentData: PaymentSubmissionData) => void;
  studentData: CohortStudent;
  selectedPaymentPlan?: string;
  paymentBreakdown?: PaymentBreakdown;
  selectedInstallment?: Installment;
}

export const PaymentSubmissionForm = React.memo<PaymentSubmissionFormProps>(({
  paymentSubmissions,
  submittingPayments,
  onPaymentSubmission,
  studentData,
  selectedPaymentPlan,
  paymentBreakdown,
  selectedInstallment,
}) => {
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
        <AmountInput
          amount={amountToPay}
          maxAmount={maxAmount}
          onAmountChange={handleAmountChange}
          error={errors.amount}
          disabled={isSubmitting}
        />

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
