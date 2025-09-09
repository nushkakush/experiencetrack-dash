/**
 * Payment Plan Selector Component
 * Handles payment plan option selection UI
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, IndianRupee } from 'lucide-react';

export type PaymentPlanType = 'one_shot' | 'sem_wise' | 'instalment_wise';

export interface PaymentPlanOption {
  value: PaymentPlanType;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

export const PAYMENT_PLAN_OPTIONS: PaymentPlanOption[] = [
  {
    value: 'one_shot',
    label: 'One Shot Payment',
    description: 'Full amount due at once',
    icon: IndianRupee,
  },
  {
    value: 'sem_wise',
    label: 'Semester Wise',
    description: 'Split across semesters',
    icon: Calendar,
  },
  {
    value: 'instalment_wise',
    label: 'Instalment Wise',
    description: 'Monthly installments',
    icon: CreditCard,
  },
];

interface PaymentPlanSelectorProps {
  selectedPlan: PaymentPlanType | '';
  onPlanSelect: (plan: PaymentPlanType) => void;
  disabled?: boolean;
  currentPlan?: PaymentPlanType;
  hasCustomPlan?: boolean;
}

export const PaymentPlanSelector: React.FC<PaymentPlanSelectorProps> =
  React.memo(
    ({
      selectedPlan,
      onPlanSelect,
      disabled = false,
      currentPlan,
      hasCustomPlan = false,
    }) => {
      return (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium'>Choose payment structure:</p>
            {currentPlan && (
              <div className='text-xs text-muted-foreground'>
                Current: {hasCustomPlan ? 'Custom ' : ''}
                {
                  PAYMENT_PLAN_OPTIONS.find(opt => opt.value === currentPlan)
                    ?.label
                }
              </div>
            )}
          </div>

          <div className='grid gap-2'>
            {PAYMENT_PLAN_OPTIONS.map(option => {
              const IconComponent = option.icon;
              const isSelected = selectedPlan === option.value;
              const isCurrent = currentPlan === option.value;

              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onPlanSelect(option.value)}
                  disabled={disabled}
                  className={`justify-start h-auto p-3 ${
                    isCurrent && !isSelected
                      ? 'border-primary/50 bg-primary/5'
                      : ''
                  }`}
                >
                  <div className='flex items-center gap-3 w-full'>
                    <IconComponent className='h-4 w-4 flex-shrink-0' />
                    <div className='text-left flex-1'>
                      <div className='font-medium flex items-center gap-2'>
                        {option.label}
                        {isCurrent && (
                          <span className='text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded'>
                            Current
                          </span>
                        )}
                      </div>
                      <div className='text-sm opacity-70'>
                        {option.description}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      );
    }
  );

PaymentPlanSelector.displayName = 'PaymentPlanSelector';
