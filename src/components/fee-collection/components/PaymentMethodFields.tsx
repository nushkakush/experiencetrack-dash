import React from 'react';
import { PaymentMethodFieldFactory } from './payment-methods/PaymentMethodFieldFactory';

export interface PaymentMethodFieldsProps {
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

export const PaymentMethodFields: React.FC<PaymentMethodFieldsProps> = (props) => {
  return <PaymentMethodFieldFactory {...props} />;
};
