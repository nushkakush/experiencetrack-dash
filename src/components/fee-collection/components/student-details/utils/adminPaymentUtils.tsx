import React from 'react';
import { Badge } from '@/components/ui/badge';

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
  switch (status) {
    case 'paid':
      return (
        <Badge className='bg-green-500/20 text-green-600 border-green-500/30'>
          Paid
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className='bg-red-500/20 text-red-600 border-red-500/30'>
          Overdue
        </Badge>
      );
    default:
      return (
        <Badge className='bg-muted text-muted-foreground border-border'>
          Pending
        </Badge>
      );
  }
};
