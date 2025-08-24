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
  paymentDate?: string;
  paymentTime?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  transactionId?: string;
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
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [bankName, setBankName] = useState<string>('');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
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

  const handlePaymentDateChange = (value: string) => {
    setPaymentDate(value);
  };

  const handlePaymentTimeChange = (value: string) => {
    setPaymentTime(value);
  };

  const handleBankNameChange = (value: string) => {
    setBankName(value);
  };

  const handleBankBranchChange = (value: string) => {
    setBankBranch(value);
  };

  const handleAccountNumberChange = (value: string) => {
    setAccountNumber(value);
  };

  const handleTransactionIdChange = (value: string) => {
    setTransactionId(value);
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
      transactionId,
      paymentDate,
      paymentTime,
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

    const paymentData: PaymentSubmissionData = {
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
      paymentData.paymentDate = paymentDate;
      paymentData.paymentTime = paymentTime;
      paymentData.bankName = bankName;
      paymentData.bankBranch = bankBranch;
      paymentData.accountNumber = accountNumber;
      paymentData.transactionId = transactionId;
    }

    onPaymentSubmit(paymentData);
  };

  return {
    // State
    selectedMethod,
    amountPaid,
    isPartialPayment,
    paymentDate,
    paymentTime,
    bankName,
    bankBranch,
    accountNumber,
    transactionId,
    notes,
    receiptFile,
    proofOfPaymentFile,
    transactionScreenshotFile,
    validPaymentMethods,
    // Handlers
    handleMethodSelect,
    handleAmountChange,
    handlePaymentDateChange,
    handlePaymentTimeChange,
    handleBankNameChange,
    handleBankBranchChange,
    handleAccountNumberChange,
    handleTransactionIdChange,
    handleReceiptFileChange,
    handleProofOfPaymentFileChange,
    handleTransactionScreenshotFileChange,
    handleNotesChange,
    handleRazorpayPayment,
    handleSubmit
  };
};
