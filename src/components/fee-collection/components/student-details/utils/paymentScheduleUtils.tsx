import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getInstallmentStatusDisplay } from '@/utils/paymentStatusUtils';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getStatusBadge = (status: string) => {
  // FIXED: Always use the status from payment engine, don't override with verificationStatus
  // The payment engine is the single source of truth for all status calculations
  const statusDisplay = getInstallmentStatusDisplay(status);

  // Map status to appropriate badge styling
  switch (statusDisplay.status) {
    case 'paid':
    case 'waived':
      return (
        <Badge className='bg-green-500/20 text-green-600 border-green-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'partially_waived':
      return (
        <Badge className='bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'overdue':
    case 'partially_paid_overdue':
      return (
        <Badge className='bg-red-500/20 text-red-600 border-red-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'pending_10_plus_days':
      return (
        <Badge className='bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'partially_paid_days_left':
      return (
        <Badge className='bg-orange-500/20 text-orange-600 border-orange-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'verification_pending':
    case 'partially_paid_verification_pending':
      return (
        <Badge className='bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs'>
          {statusDisplay.text}
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge className='bg-muted text-muted-foreground border-border text-xs'>
          {statusDisplay.text}
        </Badge>
      );
  }
};
