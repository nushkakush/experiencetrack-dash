import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { PaymentModeSelector } from './PaymentModeSelector';
import { PaymentFieldRenderer } from './PaymentFieldRenderer';
import { PaymentAmountInput } from './PaymentAmountInput';
import { usePaymentForm } from '@/hooks/payments/usePaymentForm';
import { getPaymentModeConfig } from '@/features/payments/domain/PaymentModeConfig';
import { 
  PaymentFormProps,
  PaymentSubmissionData,
  StudentData,
  PaymentBreakdown,
  Instalment
} from '@/types/components/PaymentFormTypes';



export const PaymentForm = React.memo<PaymentFormProps>(({
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
    uploadedFiles,
    errors,
    maxAmount,
    handlePaymentModeChange,
    handleAmountChange,
    handleFieldChange,
    handleFileUpload,
    handleSubmit,
    getPaymentModeConfig
  } = usePaymentForm({
    selectedInstallment,
    paymentBreakdown,
    selectedPaymentPlan,
    onPaymentSubmission,
    studentData
  });

  const paymentModeConfig = getPaymentModeConfig();
  const isSubmitting = submittingPayments.has('student-payment');

  // Get title for the form
  const getFormTitle = () => {
    if (selectedInstallment) {
      return `Submit payment for ${selectedPaymentPlan === 'sem_wise' ? `Semester ${selectedInstallment.semesterNumber} Payment` : 
        selectedPaymentPlan === 'one_shot' ? 'Full Payment' :
        `Installment Payment`}`;
    }
    
    return selectedPaymentPlan === 'one_shot' ? 
      'Submit your one-time program fee payment' :
      selectedPaymentPlan === 'sem_wise' ? 
      'Submit your semester fee payment' :
      'Submit your installment payment';
  };

  return (
    <div className="space-y-6">
      {/* Form Title */}
      <div>
        <h3 className="text-lg font-semibold">$ Submit Payment</h3>
        <p className="text-sm text-muted-foreground">{getFormTitle()}</p>
      </div>

      {/* Payment Mode Selection */}
      <div className="space-y-4">
        <PaymentModeSelector
          selectedPaymentMode={selectedPaymentMode}
          onPaymentModeChange={handlePaymentModeChange}
          paymentDetails={paymentDetails}
          onPaymentDetailsChange={handleFieldChange}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onRemoveFile={(fieldName) => {
            // Use the existing handleFileUpload with null to remove the file
            handleFileUpload(fieldName, null as any);
          }}
          errors={errors}
        />

        {/* Payment Mode Specific Fields */}
        {selectedPaymentMode && paymentModeConfig && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium">Payment Details</h4>
            <PaymentFieldRenderer
              config={paymentModeConfig}
              paymentDetails={paymentDetails}
              uploadedFiles={uploadedFiles}
              errors={errors}
              onFieldChange={handleFieldChange}
              onFileUpload={handleFileUpload}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Amount Section */}
      <div className="space-y-4">
        <PaymentAmountInput
          amount={amountToPay}
          maxAmount={maxAmount}
          onAmountChange={handleAmountChange}
          error={errors.amount}
        />
      </div>

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
  );
});

PaymentForm.displayName = 'PaymentForm';
