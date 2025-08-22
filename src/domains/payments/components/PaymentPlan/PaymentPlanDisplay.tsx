/**
 * Payment Plan Display Component
 * Shows current payment plan details and status
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Edit2, 
  Calendar, 
  DollarSign,
  CreditCard,
  Settings 
} from 'lucide-react';
import { PAYMENT_PLAN_OPTIONS, PaymentPlanType } from './PaymentPlanSelector';
import { formatCurrency } from '@/lib/utils';

export interface PaymentPlanData {
  id: string;
  student_id: string;
  payment_plan: PaymentPlanType;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  next_due_date?: string;
  status: 'active' | 'completed' | 'suspended';
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentPlanDisplayProps {
  paymentPlan: PaymentPlanData;
  onEdit: () => void;
  onCustomize: () => void;
  loading?: boolean;
}

export const PaymentPlanDisplay: React.FC<PaymentPlanDisplayProps> = React.memo(({
  paymentPlan,
  onEdit,
  onCustomize,
  loading = false,
}) => {
  const planOption = PAYMENT_PLAN_OPTIONS.find(option => option.value === paymentPlan.payment_plan);
  const IconComponent = planOption?.icon || CreditCard;
  
  const completionPercentage = paymentPlan.total_amount > 0 
    ? Math.round((paymentPlan.paid_amount / paymentPlan.total_amount) * 100) 
    : 0;

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    completed: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
    suspended: { color: 'bg-red-100 text-red-800', label: 'Suspended' },
  };

  const status = statusConfig[paymentPlan.status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconComponent className="h-5 w-5" />
            {paymentPlan.is_custom ? 'Custom ' : ''}{planOption?.label || 'Payment Plan'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={status.color}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>
        
        {planOption && (
          <p className="text-sm text-muted-foreground">
            {planOption.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Payment Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-muted/50 rounded">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold text-lg">{formatCurrency(paymentPlan.total_amount)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-muted-foreground">Paid</div>
            <div className="font-semibold text-lg text-green-600">{formatCurrency(paymentPlan.paid_amount)}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded">
            <div className="text-muted-foreground">Remaining</div>
            <div className="font-semibold text-lg text-orange-600">{formatCurrency(paymentPlan.remaining_amount)}</div>
          </div>
        </div>

        {/* Next Due Date */}
        {paymentPlan.next_due_date && paymentPlan.remaining_amount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium">Next Payment Due</div>
              <div className="text-xs text-muted-foreground">
                {new Date(paymentPlan.next_due_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={loading}
            className="flex-1"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Change Plan
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onCustomize}
            disabled={loading}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>

        {/* Plan Details */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Plan created on {new Date(paymentPlan.created_at).toLocaleDateString()}
          {paymentPlan.is_custom && (
            <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded">
              Custom
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

PaymentPlanDisplay.displayName = 'PaymentPlanDisplay';
