import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import {
  PaymentMethodButtons,
  PaymentAmountInput,
  PaymentMethodFields,
  usePaymentMethodSelector,
} from './components';

interface PaymentMethodSelectorProps {
  paymentId: string;
  requiredAmount: number;
  onPaymentSubmit: (paymentData: PaymentSubmissionData) => void;
  isSubmitting: boolean;
  paymentMethods: string[];
}

export interface PaymentSubmissionData {
  paymentId: string;
  paymentMethod: string;
  amountPaid: number;
  isPartialPayment: boolean;
  // Bank Transfer/Cheque specific
  paymentReferenceType?: 'cheque_no' | 'utr_no';
  paymentReferenceNumber?: string;
  transferDate?: string;
  bankName?: string;
  bankBranch?: string;
  // Document uploads
  receiptFile?: File;
  proofOfPaymentFile?: File;
  transactionScreenshotFile?: File;
  // Razorpay specific
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  // Notes
  notes?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentId,
  requiredAmount,
  onPaymentSubmit,
  isSubmitting,
  paymentMethods = [],
}) => {
  const {
    // State
    selectedMethod,
    amountPaid,
    isPartialPayment,
    paymentReferenceType,
    paymentReferenceNumber,
    transferDate,
    bankName,
    bankBranch,
    notes,
    receiptFile,
    proofOfPaymentFile,
    transactionScreenshotFile,
    validPaymentMethods,
    // Handlers
    handleMethodSelect,
    handleAmountChange,
    handlePaymentReferenceTypeChange,
    handlePaymentReferenceNumberChange,
    handleTransferDateChange,
    handleBankNameChange,
    handleBankBranchChange,
    handleReceiptFileChange,
    handleProofOfPaymentFileChange,
    handleTransactionScreenshotFileChange,
    handleNotesChange,
    handleRazorpayPayment,
    handleSubmit,
  } = usePaymentMethodSelector({
    paymentId,
    requiredAmount,
    onPaymentSubmit,
    paymentMethods,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5' />
          Payment Method Selection
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Payment Method Selection */}
        <PaymentMethodButtons
          selectedMethod={selectedMethod}
          onMethodSelect={handleMethodSelect}
          availableMethods={validPaymentMethods}
        />

        {/* Amount Input */}
        <PaymentAmountInput
          amountPaid={amountPaid}
          requiredAmount={requiredAmount}
          onAmountChange={handleAmountChange}
          isPartialPayment={isPartialPayment}
        />

        {/* Payment Method Specific Fields */}
        <PaymentMethodFields
          selectedMethod={selectedMethod}
          amountPaid={amountPaid}
          paymentDate={paymentDate}
          paymentTime={paymentTime}
          bankName={bankName}
          bankBranch={bankBranch}
          accountNumber={accountNumber}
          transactionId={transactionId}
          ddNumber={ddNumber}
          ddBankName={ddBankName}
          ddBranch={ddBranch}
          receiptFile={receiptFile}
          proofOfPaymentFile={proofOfPaymentFile}
          transactionScreenshotFile={transactionScreenshotFile}
          notes={notes}
          onPaymentDateChange={handlePaymentDateChange}
          onPaymentTimeChange={handlePaymentTimeChange}
          onBankNameChange={handleBankNameChange}
          onBankBranchChange={handleBankBranchChange}
          onAccountNumberChange={handleAccountNumberChange}
          onTransactionIdChange={handleTransactionIdChange}
          onDDNumberChange={handleDDNumberChange}
          onDDBankNameChange={handleDDBankNameChange}
          onDDBranchChange={handleDDBranchChange}
          onReceiptFileChange={handleReceiptFileChange}
          onProofOfPaymentFileChange={handleProofOfPaymentFileChange}
          onTransactionScreenshotFileChange={
            handleTransactionScreenshotFileChange
          }
          onNotesChange={handleNotesChange}
          onRazorpayPayment={handleRazorpayPayment}
        />

        {/* Submit Button */}
        {selectedMethod && amountPaid > 0 && selectedMethod !== 'razorpay' && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='w-full'
            size='lg'
          >
            {isSubmitting ? (
              <>
                <Clock className='h-4 w-4 mr-2 animate-spin' />
                Submitting Payment...
              </>
            ) : (
              <>
                <CheckCircle className='h-4 w-4 mr-2' />
                Submit Payment
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
