/**
 * Payment Schedule Actions Component
 * Actions panel for payment schedule management
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Mail, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentScheduleActionsProps {
  paymentPlan: any;
  schedule: any[];
  student: any;
  onRefresh: () => void;
  onSendReminder?: () => void;
  onExportSchedule?: () => void;
  onModifyPlan?: () => void;
  onViewHistory?: () => void;
}

export const PaymentScheduleActions: React.FC<PaymentScheduleActionsProps> = React.memo(({
  paymentPlan,
  schedule,
  student,
  onRefresh,
  onSendReminder,
  onExportSchedule,
  onModifyPlan,
  onViewHistory,
}) => {
  const completionPercentage = React.useMemo(() => {
    if (!paymentPlan.total_amount) return 0;
    return Math.round((paymentPlan.paid_amount / paymentPlan.total_amount) * 100);
  }, [paymentPlan]);

  const nextDueItem = React.useMemo(() => {
    const now = new Date();
    return schedule
      .filter(item => item.status === 'pending' && new Date(item.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  }, [schedule]);

  const overdueCount = React.useMemo(() => {
    const now = new Date();
    return schedule.filter(item => 
      item.status === 'pending' && new Date(item.dueDate) < now
    ).length;
  }, [schedule]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Paid Amount</div>
              <div className="font-semibold text-green-600">
                {formatCurrency(paymentPlan.paid_amount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Remaining</div>
              <div className="font-semibold text-orange-600">
                {formatCurrency(paymentPlan.remaining_amount)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">Total Program Fee</div>
            <div className="text-lg font-bold">
              {formatCurrency(paymentPlan.total_amount)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Quick Actions</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Alerts */}
          <div className="space-y-2">
            {overdueCount > 0 && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {overdueCount} overdue payment{overdueCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {nextDueItem && (
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-2 rounded">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Next due: {formatCurrency(nextDueItem.amount)} on {new Date(nextDueItem.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {onSendReminder && (
              <Button variant="outline" size="sm" onClick={onSendReminder}>
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            )}
            
            {onExportSchedule && (
              <Button variant="outline" size="sm" onClick={onExportSchedule}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            
            {onModifyPlan && (
              <Button variant="outline" size="sm" onClick={onModifyPlan}>
                <CreditCard className="h-4 w-4 mr-2" />
                Modify Plan
              </Button>
            )}
            
            {onViewHistory && (
              <Button variant="outline" size="sm" onClick={onViewHistory}>
                <Calendar className="h-4 w-4 mr-2" />
                View History
              </Button>
            )}
          </div>

          {/* Plan Type Badge */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Plan</span>
              <Badge variant="secondary">{paymentPlan.plan_type?.replace('_', ' ')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

PaymentScheduleActions.displayName = 'PaymentScheduleActions';
