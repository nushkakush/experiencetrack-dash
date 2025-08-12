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
  paymentReferenceType: 'cheque_no' | 'utr_no';
  paymentReferenceNumber: string;
  transferDate: string;
  bankName: string;
  bankBranch: string;
  // File uploads
  receiptFile: File | null;
  proofOfPaymentFile: File | null;
  transactionScreenshotFile: File | null;
  // Notes
  notes: string;
  // Handlers
  onPaymentReferenceTypeChange: (type: 'cheque_no' | 'utr_no') => void;
  onPaymentReferenceNumberChange: (value: string) => void;
  onTransferDateChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onBankBranchChange: (value: string) => void;
  onReceiptFileChange: (file: File | null) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
  onTransactionScreenshotFileChange: (file: File | null) => void;
  onNotesChange: (value: string) => void;
  onRazorpayPayment: () => void;
}

export const PaymentMethodFieldFactory: React.FC<PaymentMethodFieldFactoryProps> = ({
  selectedMethod,
  amountPaid,
  paymentReferenceType,
  paymentReferenceNumber,
  transferDate,
  bankName,
  bankBranch,
  receiptFile,
  proofOfPaymentFile,
  transactionScreenshotFile,
  notes,
  onPaymentReferenceTypeChange,
  onPaymentReferenceNumberChange,
  onTransferDateChange,
  onBankNameChange,
  onBankBranchChange,
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
      case 'cheque':
        return (
          <BankTransferFields
            paymentReferenceType={paymentReferenceType}
            paymentReferenceNumber={paymentReferenceNumber}
            transferDate={transferDate}
            bankName={bankName}
            bankBranch={bankBranch}
            proofOfPaymentFile={proofOfPaymentFile}
            onPaymentReferenceTypeChange={onPaymentReferenceTypeChange}
            onPaymentReferenceNumberChange={onPaymentReferenceNumberChange}
            onTransferDateChange={onTransferDateChange}
            onBankNameChange={onBankNameChange}
            onBankBranchChange={onBankBranchChange}
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
    <div className="space-y-4 border-t pt-4">
      {renderMethodFields()}
      
      {/* Notes Field (Common for all methods) */}
      <NotesField
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </div>
  );
};
