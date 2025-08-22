import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PartialPaymentsService } from '@/services/partialPayments.service';

interface PaymentAmountInputProps {
  amount: number;
  maxAmount: number;
  onAmountChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  studentId?: string;
  selectedInstallment?: {
    id: string;
    semesterNumber?: number;
    installmentNumber?: number;
  };
}

export const PaymentAmountInput = React.memo<PaymentAmountInputProps>(({
  amount,
  maxAmount,
  onAmountChange,
  error,
  disabled = false,
  studentId,
  selectedInstallment
}) => {
  const [partialPaymentConfig, setPartialPaymentConfig] = React.useState<{
    allowPartialPayments: boolean;
  } | null>(null);
  const [loadingPartialConfig, setLoadingPartialConfig] = React.useState(false);

  // Fetch partial payment configuration for this installment
  React.useEffect(() => {
    const fetchPartialPaymentConfig = async () => {
      if (!selectedInstallment || !studentId) {
        console.log('🔒 [PaymentAmountInput] Skipping partial payment config fetch:', {
          hasSelectedInstallment: !!selectedInstallment,
          hasStudentId: !!studentId,
          selectedInstallment,
          studentId,
        });
        return;
      }

      try {
        setLoadingPartialConfig(true);
        const installmentKey = `${selectedInstallment.semesterNumber || 1}-${selectedInstallment.installmentNumber || 0}`;
        
        console.log('🔒 [PaymentAmountInput] Fetching partial payment config for:', {
          studentId,
          semesterNumber: selectedInstallment.semesterNumber || 1,
          installmentNumber: selectedInstallment.installmentNumber || 0,
          installmentKey,
        });
        
        const config = await PartialPaymentsService.getInstallmentPartialPaymentConfig(
          studentId,
          selectedInstallment.semesterNumber || 1,
          selectedInstallment.installmentNumber || 0
        );
        
        console.log('🔒 [PaymentAmountInput] Retrieved partial payment config:', config);
        setPartialPaymentConfig(config);
      } catch (error) {
        console.error('🚨 [PaymentAmountInput] Error fetching partial payment config:', error);
        setPartialPaymentConfig({ allowPartialPayments: false });
      } finally {
        setLoadingPartialConfig(false);
      }
    };

    fetchPartialPaymentConfig();
  }, [selectedInstallment, studentId]);

  // Debug logging for final state
  React.useEffect(() => {
    const allowPartialPayments = partialPaymentConfig?.allowPartialPayments || false;
    const isFixedAmount = partialPaymentConfig === null ? true : !partialPaymentConfig.allowPartialPayments;
    
    console.log('🔒 [PaymentAmountInput] Final state for amount input:', {
      partialPaymentConfig,
      allowPartialPayments,
      isFixedAmount,
      maxAmount,
      currentAmount: amount,
      loadingPartialConfig,
    });
  }, [partialPaymentConfig, maxAmount, amount, loadingPartialConfig]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatAmountForDisplay = (amount: number) => {
    if (amount === 0) return '';
    
    // Format with Indian comma system (1,00,000.00)
    const parts = amount.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';
    
    // Add Indian commas (last 3 digits, then groups of 2)
    let formattedInteger = '';
    const len = integerPart.length;
    
    if (len <= 3) {
      formattedInteger = integerPart;
    } else {
      // Last 3 digits
      const lastThree = integerPart.slice(-3);
      // Remaining digits
      const remaining = integerPart.slice(0, -3);
      // Add commas for groups of 2
      const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formattedInteger = formattedRemaining + ',' + lastThree;
    }
    
    return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  };

  // Determine if amount should be fixed based on partial payment config
  const allowPartialPayments = partialPaymentConfig?.allowPartialPayments || false;
  const isFixedAmount = partialPaymentConfig === null ? true : !partialPaymentConfig.allowPartialPayments;

  // Show loading state while fetching config
  if (loadingPartialConfig) {
    return (
      <div>
        <Label htmlFor="amount">Amount to Pay</Label>
        <div className="relative">
          <div className="w-full px-3 py-2 pl-8 pr-16 border rounded-md bg-muted text-lg font-medium">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  console.log('🔍 [PaymentAmountInput] Rendering with:', {
    maxAmount,
    amount,
    allowPartialPayments,
    isFixedAmount,
    loadingPartialConfig,
    studentId,
    selectedInstallment: selectedInstallment ? {
      id: selectedInstallment.id,
      semesterNumber: selectedInstallment.semesterNumber,
      installmentNumber: selectedInstallment.installmentNumber,
    } : null,
  });

  return (
    <div>
      <Label htmlFor="amount">Amount to Pay</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
          ₹
        </div>
        
        {isFixedAmount ? (
          // Fixed amount display (no input)
          <div className="w-full px-3 py-2 pl-8 pr-16 border rounded-md bg-muted text-lg font-medium">
            {formatAmountForDisplay(maxAmount)}
          </div>
        ) : (
          // Editable amount input
          <Input
            id="amount"
            type="text"
            placeholder={allowPartialPayments ? "Enter amount" : "Full payment amount"}
            value={formatAmountForDisplay(amount)}
            onChange={(e) => onAmountChange(e.target.value)}
            className={`${error ? 'border-red-500' : ''} pl-8 pr-16`}
            disabled={disabled}
          />
        )}
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
          {isFixedAmount ? 'Fixed' : `Max: ${formatCurrency(maxAmount)}`}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {!allowPartialPayments && !isFixedAmount && (
        <p className="text-sm text-muted-foreground mt-1">
          Full payment required - partial payments not allowed
        </p>
      )}
      
      {allowPartialPayments && !isFixedAmount && (
        <p className="text-sm text-muted-foreground mt-1">
          Partial payments allowed
        </p>
      )}
    </div>
  );
});

PaymentAmountInput.displayName = 'PaymentAmountInput';
