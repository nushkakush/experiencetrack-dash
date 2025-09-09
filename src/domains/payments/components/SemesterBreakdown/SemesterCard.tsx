/**
 * Semester Card Component
 * Individual semester display with payment information
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  IndianRupee,
  Eye,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { SemesterData } from './SemesterBreakdownTable';
import { formatCurrency, formatDate } from '@/lib/utils';

interface SemesterCardProps {
  semester: SemesterData;
  onPayInstallment?: (installmentId: string) => void;
  onViewDetails?: (semesterId: string) => void;
}

const statusConfig = {
  upcoming: {
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    label: 'Upcoming',
  },
  current: {
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    label: 'Current',
  },
  completed: {
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle,
    label: 'Completed',
  },
  overdue: {
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    label: 'Overdue',
  },
};

export const SemesterCard: React.FC<SemesterCardProps> = React.memo(
  ({ semester, onPayInstallment, onViewDetails }) => {
    const config = statusConfig[semester.status];
    const Icon = config.icon;

    const completionPercentage =
      semester.totalFee > 0
        ? Math.round((semester.paidAmount / semester.totalFee) * 100)
        : 0;

    const nextInstallment = semester.installments
      .filter(inst => inst.status === 'pending' || inst.status === 'overdue')
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )[0];

    const overdueInstallments = semester.installments.filter(inst => {
      if (inst.status !== 'pending') return false;
      return new Date(inst.dueDate) < new Date();
    });

    return (
      <Card
        className={semester.status === 'current' ? 'ring-2 ring-primary' : ''}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>{semester.name}</CardTitle>
            <Badge className={config.color}>
              <Icon className='w-3 h-3 mr-1' />
              {config.label}
            </Badge>
          </div>

          <div className='text-sm text-muted-foreground'>
            {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Payment Progress */}
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Payment Progress</span>
              <span className='font-medium'>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className='h-2' />
          </div>

          {/* Payment Summary */}
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <div className='text-muted-foreground'>Total Fee</div>
              <div className='font-semibold'>
                {formatCurrency(semester.totalFee)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground'>Paid</div>
              <div className='font-semibold text-green-600'>
                {formatCurrency(semester.paidAmount)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground'>Remaining</div>
              <div className='font-semibold text-orange-600'>
                {formatCurrency(semester.remainingAmount)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground'>Installments</div>
              <div className='font-semibold'>
                {semester.installments.length}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {overdueInstallments.length > 0 && (
            <div className='flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded text-sm'>
              <AlertTriangle className='h-4 w-4' />
              <span>
                {overdueInstallments.length} overdue installment
                {overdueInstallments.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Next Payment */}
          {nextInstallment && (
            <div className='space-y-2'>
              <div className='text-sm font-medium'>Next Payment</div>
              <div className='flex items-center justify-between p-2 bg-muted rounded'>
                <div>
                  <div className='text-sm font-medium'>
                    {formatCurrency(nextInstallment.amount)}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Due: {formatDate(nextInstallment.dueDate)}
                  </div>
                </div>
                {onPayInstallment && (
                  <Button
                    size='sm'
                    onClick={() => onPayInstallment(nextInstallment.id)}
                  >
                    <CreditCard className='h-3 w-3 mr-1' />
                    Pay
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex space-x-2 pt-2'>
            {onViewDetails && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onViewDetails(semester.id)}
                className='flex-1'
              >
                <Eye className='h-4 w-4 mr-2' />
                View Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

SemesterCard.displayName = 'SemesterCard';
