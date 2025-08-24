import React from 'react';
import { PaymentMethodFieldFactory } from './payment-methods/PaymentMethodFieldFactory';

export interface PaymentMethodFieldsProps {
  selectedMethod: string;
  amountPaid: number;
  // Bank transfer/cheque fields
  paymentDate: string;
  paymentTime: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  transactionId: string;
  // DD-specific fields
  ddNumber: string;
  ddBankName: string;
  ddBranch: string;
  // File uploads
  receiptFile: File | null;
  proofOfPaymentFile: File | null;
  transactionScreenshotFile: File | null;
  // Notes
  notes: string;
  // Handlers
  onPaymentDateChange: (value: string) => void;
  onPaymentTimeChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onBankBranchChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
  // DD-specific handlers
  onDDNumberChange: (value: string) => void;
  onDDBankNameChange: (value: string) => void;
  onDDBranchChange: (value: string) => void;
  onReceiptFileChange: (file: File | null) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
  onTransactionScreenshotFileChange: (file: File | null) => void;
  onNotesChange: (value: string) => void;
  onRazorpayPayment: () => void;
}

export const PaymentMethodFields: React.FC<
  PaymentMethodFieldsProps
> = props => {
  return <PaymentMethodFieldFactory {...props} />;
};
