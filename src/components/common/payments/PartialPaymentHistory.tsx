import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface PaymentTransaction {
  id: string;
  amount: number;
  verification_status: 'pending' | 'verification_pending' | 'approved' | 'rejected' | 'partially_approved';
  created_at: string;
  verified_at?: string;
  notes?: string;
  rejection_reason?: string;
  partial_payment_sequence: number;
}

interface PartialPaymentHistoryProps {
  transactions: PaymentTransaction[];
  totalExpectedAmount: number;
  totalPaid: number;
  remainingAmount: number;
  totalPending: number;
}

export const PartialPaymentHistory: React.FC<PartialPaymentHistoryProps> = ({
  transactions,
  totalExpectedAmount,
  totalPaid,
  remainingAmount,
  totalPending,
}) => {
  // DEBUG LOGGING
  console.log('🔍 [PartialPaymentHistory] Component Data:', {
    transactionsCount: transactions.length,
    totalExpectedAmount,
    totalPaid,
    remainingAmount,
    totalPending,
    transactions: transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      status: t.verification_status,
      partial_sequence: t.partial_payment_sequence
    }))
  });

  // Defensive programming: ensure all values are valid numbers
  const safeTotalExpectedAmount = Number.isFinite(totalExpectedAmount) ? totalExpectedAmount : 0;
  const safeTotalPaid = Number.isFinite(totalPaid) ? totalPaid : 0;
  const safeRemainingAmount = Number.isFinite(remainingAmount) ? remainingAmount : 0;
  const safeTotalPending = Number.isFinite(totalPending) ? totalPending : 0;

  // Sort transactions by partial_payment_sequence and created_at
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.partial_payment_sequence !== b.partial_payment_sequence) {
      return (a.partial_payment_sequence || 0) - (b.partial_payment_sequence || 0);
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'verification_pending':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'pending':
        return <HelpCircle className="h-3 w-3 text-gray-600" />;
      case 'partially_approved':
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
      default:
        return <HelpCircle className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-800/50';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800/50';
      case 'verification_pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-800/50';
      case 'pending':
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/30 dark:border-gray-800/50';
      case 'partially_approved':
        return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-800/50';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/30 dark:border-gray-800/50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'verification_pending':
        return 'Under Review';
      case 'pending':
        return 'Pending';
      case 'partially_approved':
        return 'Partially Approved';
      default:
        return 'Unknown';
    }
  };

  // Helper function to determine if a payment is actually partial
  const isPaymentPartial = (transaction: PaymentTransaction, allTransactions: PaymentTransaction[], totalExpected: number) => {
    // Ensure totalExpected is a valid number
    const safeTotalExpected = Number.isFinite(totalExpected) ? totalExpected : 0;
    
    // If this is the only transaction and it covers the full amount, it's not partial
    if (allTransactions.length === 1 && transaction.amount >= safeTotalExpected) {
      return false;
    }
    
    // If there are multiple transactions, check if this specific transaction covers the full amount
    if (transaction.amount >= safeTotalExpected) {
      return false;
    }
    
    // If the total paid across all transactions equals or exceeds the expected amount, 
    // and this transaction is the last one, it might be completing the payment
    const totalPaidSoFar = allTransactions
      .filter(t => t.verification_status === 'approved' || t.verification_status === 'partially_approved')
      .reduce((sum, t) => sum + (Number.isFinite(t.amount) ? t.amount : 0), 0);
    
    if (totalPaidSoFar >= safeTotalExpected && transaction.verification_status === 'approved') {
      return false;
    }
    
    // Otherwise, it's a partial payment
    return true;
  };

  // Get the appropriate label for each transaction
  const getPaymentLabel = (transaction: PaymentTransaction) => {
    const isPartial = isPaymentPartial(transaction, sortedTransactions, safeTotalExpectedAmount);
    
    if (isPartial) {
      return `Partial Payment ${transaction.partial_payment_sequence || 'N/A'}`;
    } else {
      return 'Payment';
    }
  };

  if (sortedTransactions.length === 0) {
    return (
      <Card className="border-gray-200 bg-gray-50/30 dark:border-gray-800/50 dark:bg-gray-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-gray-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment transactions found.</p>
        </CardContent>
      </Card>
    );
  }

  // Simplified view for single transaction
  if (sortedTransactions.length === 1) {
    const transaction = sortedTransactions[0];
    const isPartial = isPaymentPartial(transaction, sortedTransactions, safeTotalExpectedAmount);
    const safeTransactionAmount = Number.isFinite(transaction.amount) ? transaction.amount : 0;
    
    return (
      <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-800/50 dark:bg-orange-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Single transaction display */}
          <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(transaction.verification_status)}
              <div>
                <div className="font-medium">{getPaymentLabel(transaction)}</div>
                <div className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(safeTransactionAmount)}</div>
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(transaction.verification_status)}`}
              >
                {getStatusLabel(transaction.verification_status)}
              </Badge>
            </div>
          </div>

          {/* Summary - only show if there's a meaningful difference */}
          {(safeTotalPaid > 0 || safeRemainingAmount > 0) && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(safeTotalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-orange-600">{formatCurrency(safeRemainingAmount)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Multiple transactions view
  return (
    <Card className="border-orange-200 bg-orange-50/30 dark:border-orange-800/50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-orange-600" />
          Payment Transaction History
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary - only show meaningful totals */}
        {(safeTotalPaid > 0 || safeRemainingAmount > 0 || safeTotalPending > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
            {safeTotalPaid > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(safeTotalPaid)}</p>
              </div>
            )}
            {safeTotalPending > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
                <p className="font-semibold text-yellow-600">{formatCurrency(safeTotalPending)}</p>
              </div>
            )}
            {safeRemainingAmount > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-orange-600">{formatCurrency(safeRemainingAmount)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Expected Total</p>
              <p className="font-semibold">{formatCurrency(safeTotalExpectedAmount)}</p>
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Transaction Details</h4>
          
          {sortedTransactions.map((transaction) => {
            const safeAmount = Number.isFinite(transaction.amount) ? transaction.amount : 0;
            return (
              <div key={transaction.id} className="p-3 border rounded-lg bg-white/50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.verification_status)}
                    <span className="font-medium">
                      {getPaymentLabel(transaction)}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(transaction.verification_status)}
                  >
                    {getStatusLabel(transaction.verification_status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="ml-1 font-semibold">{formatCurrency(safeAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-1">{formatDate(transaction.created_at)}</span>
                  </div>
                  {transaction.payment_method && (
                    <div>
                      <span className="text-muted-foreground">Method:</span>
                      <span className="ml-1 capitalize">{transaction.payment_method.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                
                {transaction.notes && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="ml-1">{transaction.notes}</span>
                  </div>
                )}
                
                {transaction.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
                    <span className="text-red-600 font-medium">Rejection Reason:</span>
                    <span className="ml-1 text-red-600">{transaction.rejection_reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
