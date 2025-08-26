/**
 * Payment Method Selector Component
 * Dedicated component for payment method selection
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { useFeatureFlag } from '@/lib/feature-flags';

export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresTransactionId: boolean;
  category: 'digital' | 'traditional';
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    label: 'Cash',
    description: 'Physical cash payment',
    icon: Banknote,
    requiresTransactionId: false,
    category: 'traditional',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Direct bank account transfer',
    icon: Building2,
    requiresTransactionId: true,
    category: 'digital',
  },
  {
    id: 'dd',
    label: 'Demand Draft',
    description: 'Bank demand draft payment',
    icon: Building2,
    requiresTransactionId: true,
    category: 'traditional',
  },
  {
    id: 'upi',
    label: 'UPI Payment',
    description: 'UPI apps like GPay, PhonePe, Paytm',
    icon: Smartphone,
    requiresTransactionId: true,
    category: 'digital',
  },
  {
    id: 'card',
    label: 'Card Payment',
    description: 'Credit or Debit card',
    icon: CreditCard,
    requiresTransactionId: true,
    category: 'digital',
  },
  {
    id: 'razorpay',
    label: 'Razorpay',
    description: 'Online payment gateway',
    icon: Wallet,
    requiresTransactionId: true,
    category: 'digital',
  },
];

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (method: string) => void;
  disabled?: boolean;
  error?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> =
  React.memo(({ value, onChange, disabled = false, error }) => {
    const { isEnabled: isCashDisabled } = useFeatureFlag(
      'cash-payment-disabled',
      { defaultValue: false }
    );

    const selectedMethod = PAYMENT_METHODS.find(method => method.id === value);

    const digitalMethods = PAYMENT_METHODS.filter(
      method => method.category === 'digital'
    );
    const traditionalMethods = PAYMENT_METHODS.filter(
      method =>
        method.category === 'traditional' &&
        (!isCashDisabled || method.id !== 'cash')
    );

    return (
      <div className='space-y-4'>
        {/* Digital Payment Methods */}
        <div>
          <div className='flex items-center gap-2 mb-3'>
            <h4 className='text-sm font-medium'>Digital Payments</h4>
            <Badge variant='secondary' className='text-xs'>
              Recommended
            </Badge>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            {digitalMethods.map(method => {
              const IconComponent = method.icon;
              const isSelected = value === method.id;

              return (
                <Button
                  key={method.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onChange(method.id)}
                  disabled={disabled}
                  className={`h-auto p-3 justify-start ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  <div className='flex items-center gap-3 w-full'>
                    <IconComponent className='h-4 w-4 flex-shrink-0' />
                    <div className='text-left flex-1'>
                      <div className='font-medium text-sm'>{method.label}</div>
                      <div className='text-xs opacity-70'>
                        {method.description}
                      </div>
                    </div>
                    {method.requiresTransactionId && (
                      <Badge variant='outline' className='text-xs'>
                        ID Required
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Traditional Payment Methods */}
        <div>
          <h4 className='text-sm font-medium mb-3'>Traditional Payments</h4>
          <div className='grid grid-cols-1 gap-2'>
            {traditionalMethods.map(method => {
              const IconComponent = method.icon;
              const isSelected = value === method.id;

              return (
                <Button
                  key={method.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onChange(method.id)}
                  disabled={disabled}
                  className={`h-auto p-3 justify-start ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  <div className='flex items-center gap-3 w-full'>
                    <IconComponent className='h-4 w-4 flex-shrink-0' />
                    <div className='text-left flex-1'>
                      <div className='font-medium text-sm'>{method.label}</div>
                      <div className='text-xs opacity-70'>
                        {method.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Selected Method Details */}
        {selectedMethod && (
          <Card className='bg-primary/5 border-primary/20'>
            <CardContent className='p-3'>
              <div className='flex items-center gap-2 text-sm'>
                <selectedMethod.icon className='h-4 w-4' />
                <span className='font-medium'>
                  Selected: {selectedMethod.label}
                </span>
              </div>
              {selectedMethod.requiresTransactionId && (
                <div className='text-xs text-muted-foreground mt-1'>
                  Transaction ID will be required for this payment method
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className='text-sm text-red-600 flex items-center gap-1'>
            <AlertTriangle className='h-3 w-3' />
            {error}
          </div>
        )}
      </div>
    );
  });

PaymentMethodSelector.displayName = 'PaymentMethodSelector';
