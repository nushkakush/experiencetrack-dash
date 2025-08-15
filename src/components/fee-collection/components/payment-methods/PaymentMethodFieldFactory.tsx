import React from 'react';
import { CashPaymentFields } from './CashPaymentFields';
import { BankTransferFields } from './BankTransferFields';
import { ScanToPayFields } from './ScanToPayFields';
import { RazorpayFields } from './RazorpayFields';
import { NotesField } from './NotesField';

interface PaymentMethodFieldFactoryProps {
  selectedMethod: string;
  amountPaid: number;
  // Bank transfer/cheque fields
  paymentDate: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  transactionId: string;
  // File uploads
  receiptFile: File | null;
  proofOfPaymentFile: File | null;
  transactionScreenshotFile: File | null;
  // Notes
  notes: string;
  // Handlers
  onPaymentDateChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onBankBranchChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
  onReceiptFileChange: (file: File | null) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
  onTransactionScreenshotFileChange: (file: File | null) => void;
  onNotesChange: (value: string) => void;
  onRazorpayPayment: () => void;
}

export const PaymentMethodFieldFactory: React.FC<PaymentMethodFieldFactoryProps> = ({
  selectedMethod,
  amountPaid,
  paymentDate,
  bankName,
  bankBranch,
  accountNumber,
  transactionId,
  receiptFile,
  proofOfPaymentFile,
  transactionScreenshotFile,
  notes,
  onPaymentDateChange,
  onBankNameChange,
  onBankBranchChange,
  onAccountNumberChange,
  onTransactionIdChange,
  onReceiptFileChange,
  onProofOfPaymentFileChange,
  onTransactionScreenshotFileChange,
  onNotesChange,
  onRazorpayPayment
}) => {
  if (!selectedMethod || amountPaid <= 0) {
    return null;
  }

  const renderMethodFields = () => {
    switch (selectedMethod) {
      case 'cash':
        return (
          <CashPaymentFields
            receiptFile={receiptFile}
            onReceiptFileChange={onReceiptFileChange}
          />
        );
      
      case 'bank_transfer':
        return (
          <BankTransferFields
            paymentDate={paymentDate}
            bankName={bankName}
            bankBranch={bankBranch}
            accountNumber={accountNumber}
            transactionId={transactionId}
            proofOfPaymentFile={proofOfPaymentFile}
            onPaymentDateChange={onPaymentDateChange}
            onBankNameChange={onBankNameChange}
            onBankBranchChange={onBankBranchChange}
            onAccountNumberChange={onAccountNumberChange}
            onTransactionIdChange={onTransactionIdChange}
            onProofOfPaymentFileChange={onProofOfPaymentFileChange}
          />
        );
      
      case 'cheque':
        return (
          <BankTransferFields
            paymentDate={paymentDate}
            bankName={bankName}
            bankBranch={bankBranch}
            accountNumber={accountNumber}
            transactionId={transactionId}
            proofOfPaymentFile={proofOfPaymentFile}
            onPaymentDateChange={onPaymentDateChange}
            onBankNameChange={onBankNameChange}
            onBankBranchChange={onBankBranchChange}
            onAccountNumberChange={onAccountNumberChange}
            onTransactionIdChange={onTransactionIdChange}
            onProofOfPaymentFileChange={onProofOfPaymentFileChange}
          />
        );
      
      case 'scan_to_pay':
        return (
          <ScanToPayFields
            transactionScreenshotFile={transactionScreenshotFile}
            onTransactionScreenshotFileChange={onTransactionScreenshotFileChange}
          />
        );
      
      case 'razorpay':
        return (
          <RazorpayFields
            onRazorpayPayment={onRazorpayPayment}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderMethodFields()}
      
      {/* Notes Field */}
      <NotesField
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
};
