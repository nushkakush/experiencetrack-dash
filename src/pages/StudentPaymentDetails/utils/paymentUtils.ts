/**
 * Payment Utilities
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import { PaymentPlan } from '@/types/payments';
import { 
  CreditCard, 
  Building2, 
  FileText, 
  QrCode, 
  DollarSign,
  Calendar,
  Calculator
} from 'lucide-react';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'TBD';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getPaymentPlanDisplay = (plan: PaymentPlan): string => {
  switch (plan) {
    case 'one_shot':
      return 'One Shot Payment';
    case 'sem_wise':
      return 'Semester-wise Payment';
    case 'instalment_wise':
      return 'Installment-wise Payment';
    case 'not_selected':
      return 'Not Selected';
    default:
      return 'Unknown Plan';
  }
};

export const getPaymentPlanIcon = (plan: PaymentPlan): React.ReactNode => {
  switch (plan) {
    case 'one_shot':
      return <CreditCard className="h-4 w-4" />;
    case 'sem_wise':
      return <Calendar className="h-4 w-4" />;
    case 'instalment_wise':
      return <Calculator className="h-4 w-4" />;
    case 'not_selected':
      return <DollarSign className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

export const getPaymentPlanColor = (plan: PaymentPlan): string => {
  switch (plan) {
    case 'one_shot':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'sem_wise':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'instalment_wise':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'not_selected':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export const getPaymentMethods = (plan: PaymentPlan): Array<{
  name: string;
  description: string;
  icon: React.ReactNode;
}> => {
  const baseMethods = [
    {
      name: 'Bank Transfer',
      description: 'Transfer to our bank account',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      name: 'Cash',
      description: 'Pay in cash at office',
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      name: 'Cheque',
      description: 'Pay via cheque',
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: 'Scan to Pay',
      description: 'Scan QR code to pay',
      icon: <QrCode className="h-4 w-4" />
    }
  ];

  // Add Razorpay for all plans
  if (plan !== 'not_selected') {
    baseMethods.push({
      name: 'Razorpay',
      description: 'Online payment gateway',
      icon: <CreditCard className="h-4 w-4" />
    });
  }

  return baseMethods;
};

export const calculatePaymentStatus = (dueDate: string, paidAmount: number, totalAmount: number) => {
  const isOverdue = new Date(dueDate) < new Date();
  
  if (paidAmount >= totalAmount) {
    return 'paid';
  } else if (isOverdue) {
    return 'overdue';
  } else {
    return 'pending';
  }
};

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
