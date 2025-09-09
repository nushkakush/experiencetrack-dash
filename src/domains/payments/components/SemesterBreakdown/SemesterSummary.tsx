/**
 * Semester Summary Component
 * Overview statistics for all semesters
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  IndianRupee,
  Calendar,
  CheckCircle,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SemesterData } from './SemesterBreakdownTable';

interface SemesterSummaryData {
  totalFee: number;
  paidAmount: number;
  remainingAmount: number;
  completionPercentage: number;
  totalSemesters: number;
  completedSemesters: number;
  currentSemester?: SemesterData;
}

interface SemesterSummaryProps {
  summary: SemesterSummaryData;
}

export const SemesterSummary: React.FC<SemesterSummaryProps> = React.memo(
  ({ summary }) => {
    const progressColor =
      summary.completionPercentage >= 80
        ? 'bg-green-500'
        : summary.completionPercentage >= 60
          ? 'bg-yellow-500'
          : 'bg-red-500';

    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Program Fee */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Program Fee
            </CardTitle>
            <IndianRupee className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(summary.totalFee)}
            </div>
            <div className='flex items-center space-x-2 mt-2'>
              <Progress
                value={summary.completionPercentage}
                className='flex-1 h-2'
              />
              <span className='text-sm text-muted-foreground'>
                {summary.completionPercentage}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Amount Paid */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Amount Paid</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {formatCurrency(summary.paidAmount)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              {summary.completionPercentage}% of total fee
            </p>
          </CardContent>
        </Card>

        {/* Remaining Amount */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Remaining Amount
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {formatCurrency(summary.remainingAmount)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              {(100 - summary.completionPercentage).toFixed(0)}% pending
            </p>
          </CardContent>
        </Card>

        {/* Semester Progress */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Semester Progress
            </CardTitle>
            <BookOpen className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.completedSemesters}/{summary.totalSemesters}
            </div>
            <div className='flex items-center space-x-2 mt-2'>
              {summary.currentSemester && (
                <Badge variant='secondary' className='text-xs'>
                  Current: {summary.currentSemester.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

SemesterSummary.displayName = 'SemesterSummary';
