/**
 * Payment Utilities
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import { PaymentMethod } from '@/types/payments/PaymentMethod';

export const getPaymentMethods = (): PaymentMethod[] => {
  return [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer funds directly to our bank account',
      instructions: [
        'Transfer the amount to our bank account',
        'Include your student ID as reference',
        'Send us the transaction receipt',
      ],
      accountDetails: {
        bankName: 'Example Bank',
        accountNumber: '1234567890',
        ifscCode: 'EXBK0001234',
        accountHolder: 'LIT Institute',
      },
    },
    {
      id: 'dd',
      name: 'Demand Draft',
      description: 'Pay using a demand draft',
      instructions: [
        'Get a DD made in favor of "Disruptive Edu Private Limited"',
        'Include your student ID as reference',
        'Submit the DD receipt at our office',
      ],
      accountDetails: {
        bankName: 'HDFC Bank Limited',
        accountNumber: '50200082405270',
        ifscCode: 'HDFC0001079',
        accountHolder: 'Disruptive Edu Private Limited',
      },
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Pay using any UPI app',
      instructions: [
        'Scan the QR code or use UPI ID',
        'Enter the payment amount',
        'Send us the transaction screenshot',
      ],
      upiDetails: {
        upiId: 'lit.institute@example',
        qrCode: '/qr-code.png',
      },
    },
    {
      id: 'cheque',
      name: 'Cheque',
      description: 'Pay using a bank cheque',
      instructions: [
        'Make cheque payable to "LIT Institute"',
        'Write your student ID on the back',
        'Submit the cheque at our office',
      ],
    },
    {
      id: 'cash',
      name: 'Cash',
      description: 'Pay in cash at our office',
      instructions: [
        'Visit our office during business hours',
        'Bring exact amount',
        'Get a receipt immediately',
      ],
    },
  ];
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'verification_pending':
      return 'outline';
    default:
      return 'secondary';
  }
};
