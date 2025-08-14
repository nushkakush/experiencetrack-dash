import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import { useIndianBanks } from '@/hooks/useIndianBanks';

interface BankSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const BankSelect: React.FC<BankSelectProps> = ({
  value,
  onValueChange,
  label = 'Bank Name',
  placeholder = 'Select bank',
  required = false,
  disabled = false,
  error,
  className
}) => {
  const { banks, loading, error: fetchError, refetch } = useIndianBanks();

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <Label>{label}{required && <span className="text-red-500">*</span>}</Label>}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && <Label>{label}{required && <span className="text-red-500">*</span>}</Label>}
        <Alert variant="destructive">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            Failed to load banks. 
            <button 
              onClick={refetch}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}{required && <span className="text-red-500">*</span>}</Label>}
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {banks.map((bank) => (
            <SelectItem key={bank.id} value={bank.bank_name}>
              {bank.bank_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};
