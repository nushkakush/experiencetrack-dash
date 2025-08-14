import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { validatePaymentForm, showValidationErrors } from '../utils/PaymentValidation';
import { Logger } from '@/lib/logging/Logger';

interface PaymentSubmissionData {
  paymentId: string;
  paymentMethod: string;
  amountPaid: number;
  isPartialPayment: boolean;
  notes: string;
  receiptFile?: File;
  proofOfPaymentFile?: File;
  transactionScreenshotFile?: File;
  paymentReferenceType?: 'cheque_no' | 'utr_no';
  paymentReferenceNumber?: string;
  transferDate?: string;
  bankName?: string;
  bankBranch?: string;
}

export interface UsePaymentMethodSelectorProps {
  paymentId: string;
  requiredAmount: number;
  onPaymentSubmit: (paymentData: PaymentSubmissionData) => void;
  paymentMethods: string[];
}

export const usePaymentMethodSelector = ({
  paymentId,
  requiredAmount,
  onPaymentSubmit,
  paymentMethods = []
}: UsePaymentMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isPartialPayment, setIsPartialPayment] = useState<boolean>(false);
  const [paymentReferenceType, setPaymentReferenceType] = useState<'cheque_no' | 'utr_no'>('utr_no');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [transactionScreenshotFile, setTransactionScreenshotFile] = useState<File | null>(null);

  // Default payment methods if none provided
  const defaultPaymentMethods = ['cash', 'bank_transfer', 'cheque', 'scan_to_pay', 'razorpay'];
  const availablePaymentMethods = (paymentMethods && paymentMethods.length > 0) ? paymentMethods : defaultPaymentMethods;

  // Ensure we have valid payment methods
  const validPaymentMethods = availablePaymentMethods.filter(method => typeof method === 'string' && method.trim() !== '');

  // Detect partial payment when amount changes
  useEffect(() => {
    if (amountPaid > 0) {
      setIsPartialPayment(amountPaid < requiredAmount);
    }
  }, [amountPaid, requiredAmount]);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const handleAmountChange = (amount: number) => {
    setAmountPaid(amount);
  };

  const handlePaymentReferenceTypeChange = (type: 'cheque_no' | 'utr_no') => {
    setPaymentReferenceType(type);
  };

  const handlePaymentReferenceNumberChange = (value: string) => {
    setPaymentReferenceNumber(value);
  };

  const handleTransferDateChange = (value: string) => {
    setTransferDate(value);
  };

  const handleBankNameChange = (value: string) => {
    setBankName(value);
  };

  const handleBankBranchChange = (value: string) => {
    setBankBranch(value);
  };

  const handleReceiptFileChange = (file: File | null) => {
    setReceiptFile(file);
  };

  const handleProofOfPaymentFileChange = (file: File | null) => {
    setProofOfPaymentFile(file);
  };

  const handleTransactionScreenshotFileChange = (file: File | null) => {
    setTransactionScreenshotFile(file);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleRazorpayPayment = () => {
    toast.info('Redirecting to Razorpay payment gateway...');
    // TODO: Implement Razorpay integration
  };

  const handleSubmit = () => {
    const validation = validatePaymentForm(
      selectedMethod,
      amountPaid,
      requiredAmount,
      paymentReferenceNumber,
      transferDate,
      bankName,
      bankBranch,
      receiptFile,
      proofOfPaymentFile,
      transactionScreenshotFile
    );

    if (!validation.isValid) {
      showValidationErrors(validation.errors);
      return;
    }

    const paymentData = {
      paymentId,
      paymentMethod: selectedMethod,
      amountPaid,
      isPartialPayment,
      notes,
      receiptFile: receiptFile || undefined,
      proofOfPaymentFile: proofOfPaymentFile || undefined,
      transactionScreenshotFile: transactionScreenshotFile || undefined,
    };

    // Add bank transfer/cheque specific data
    if (selectedMethod === 'bank_transfer' || selectedMethod === 'cheque') {
      paymentData.paymentReferenceType = paymentReferenceType;
      paymentData.paymentReferenceNumber = paymentReferenceNumber;
      paymentData.transferDate = transferDate;
      paymentData.bankName = bankName;
      paymentData.bankBranch = bankBranch;
    }

    onPaymentSubmit(paymentData);
  };

  return {
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
    handleSubmit
  };
};
