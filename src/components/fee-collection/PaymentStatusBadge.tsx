import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PaymentStatus } from '@/types/fee';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const getStatusConfig = (status: PaymentStatus) => {
  switch (status) {
    // ✅ COMPLETED - Green (Lowest urgency)
    case 'paid':
    case 'complete':
    case 'on_time':
    case 'waived':
      return {
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        text:
          status === 'paid'
            ? 'Paid'
            : status === 'complete'
              ? 'Complete'
              : status === 'waived'
                ? 'Waived'
                : 'On-Time',
      };

    // 🔵 UPCOMING - Blue (Low urgency)
    case 'upcoming':
      return {
        variant: 'secondary' as const,
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        text: 'Upcoming',
      };

    // 🟡 PENDING - Yellow (Medium urgency)
    case 'pending':
      return {
        variant: 'secondary' as const,
        className:
          'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        text: 'Pending',
      };

    // 🟠 UPCOMING (10+ DAYS) - Orange (High-ish urgency)
    case 'pending_10_plus_days':
      return {
        variant: 'secondary' as const,
        className:
          'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        text: 'Upcoming',
      };

    // 🟠 PARTIALLY PAID - Orange (Medium-high urgency)
    case 'partially_paid':
    case 'partially_paid_days_left':
    case 'partially_waived':
      return {
        variant: 'secondary' as const,
        className:
          'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
        text: status === 'partially_waived' ? 'Partially Waived' : 'Partially Paid',
      };

    // 🟡 VERIFICATION - Yellow (Medium urgency)
    case 'verification_pending':
    case 'partially_paid_verification_pending':
      return {
        variant: 'secondary' as const,
        className:
          'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        text:
          status === 'verification_pending'
            ? 'Verification Pending'
            : 'Partially Paid Verification Pending',
      };

    // 🔴 OVERDUE - Red (Highest urgency)
    case 'overdue':
    case 'partially_paid_overdue':
      return {
        variant: 'destructive' as const,
        className:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        text: status === 'overdue' ? 'Overdue' : 'Partially Paid Overdue',
      };

    // 🔴 FAILED - Red (Highest urgency)
    case 'failed_5_days_left':
    case 'dropped':
      return {
        variant: 'destructive' as const,
        className:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        text:
          status === 'failed_5_days_left' ? 'Failed 5 Days Left' : 'Dropped',
      };

    // 🔵 BANK APPROVAL - Blue (Medium urgency)
    case 'awaiting_bank_approval_e_nach':
    case 'awaiting_bank_approval_physical_mandate':
      return {
        variant: 'secondary' as const,
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        text:
          status === 'awaiting_bank_approval_e_nach'
            ? 'Awaiting Bank Approval E-NACH'
            : 'Awaiting Bank Approval Physical Mandate',
      };

    // 🔴 SETUP FAILED - Red (High urgency)
    case 'setup_request_failed_e_nach':
    case 'setup_request_failed_physical_mandate':
      return {
        variant: 'destructive' as const,
        className:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        text:
          status === 'setup_request_failed_e_nach'
            ? 'Setup Request Failed E-NACH'
            : 'Setup Request Failed Physical Mandate',
      };

    // ⚪ NOT SETUP - Gray (Low urgency)
    case 'not_setup':
      return {
        variant: 'secondary' as const,
        className:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        text: 'Not Setup',
      };

    default:
      return {
        variant: 'secondary' as const,
        className:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        text: status,
      };
  }
};

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.text}
    </Badge>
  );
};
