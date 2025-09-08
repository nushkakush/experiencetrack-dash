import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';

interface CohortStatistics {
  // Scholarship Analysis
  averageScholarshipPercentage: number;
  scholarshipDistribution: {
    tier: string;
    count: number;
    percentage: number;
  }[];
  totalScholarshipValue: number;

  // Collection Metrics
  totalPayable: number;
  totalCollected: number;
  collectionRate: number;
  cohortProgress: number;

  // Monthly Analysis
  dueThisMonth: {
    count: number;
    amount: number;
  };
  overdue: {
    count: number;
    amount: number;
  };
  currentMonthPending?: {
    count: number;
    amount: number;
  };
  currentMonthOverdue?: {
    count: number;
    amount: number;
  };
  thisMonthCollected: number;

  // Performance Indicators
  riskStudents: number;
  completionRate: number;
  averagePaymentDelay: number;
}

interface StatisticsDashboardProps {
  statistics?: {
    averageScholarshipPercentage: number;
    scholarshipDistribution: Array<{
      tier: string;
      count: number;
      percentage: number;
    }>;
    totalScholarshipValue: number;
    totalPayable: number;
    totalCollected: number;
    collectionRate: number;
    cohortProgress: number;
    dueThisMonth: {
      count: number;
      amount: number;
    };
    overdue: {
      count: number;
      amount: number;
    };
    currentMonthPending?: {
      count: number;
      amount: number;
    };
    currentMonthOverdue?: {
      count: number;
      amount: number;
    };
    thisMonthCollected: number;
    riskStudents: number;
    completionRate: number;
    averagePaymentDelay: number;
  };
}

export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  statistics: serverStatistics,
}) => {
  console.log('🔍 [StatisticsDashboard] Received statistics:', {
    hasServerStatistics: !!serverStatistics,
    serverStatistics,
    isUsingFallback: !serverStatistics,
  });

  // Only use server-calculated statistics
  const statistics = serverStatistics || {
    averageScholarshipPercentage: 0,
    scholarshipDistribution: [],
    totalScholarshipValue: 0,
    totalPayable: 0,
    totalCollected: 0,
    collectionRate: 0,
    cohortProgress: 0,
    dueThisMonth: { count: 0, amount: 0, students: [] },
    overdue: { count: 0, amount: 0, students: [] },
    currentMonthPending: { count: 0, amount: 0 },
    currentMonthOverdue: { count: 0, amount: 0 },
    thisMonthCollected: 0,
    riskStudents: 0,
    completionRate: 0,
    averagePaymentDelay: 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (rate: number) => {
    if (rate >= 80)
      return <Badge className='bg-green-100 text-green-800'>Excellent</Badge>;
    if (rate >= 60)
      return <Badge className='bg-yellow-100 text-yellow-800'>Good</Badge>;
    return <Badge className='bg-red-100 text-red-800'>Needs Attention</Badge>;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
      {/* Average Scholarship */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Average Scholarship
          </CardTitle>
          <Target className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {statistics.averageScholarshipPercentage.toFixed(1)}%
          </div>
          <div className='text-xs text-muted-foreground'>
            {statistics.scholarshipDistribution.find(d => d.tier === '0-25%')
              ?.count || 0}{' '}
            students with 0-25%
          </div>
          <div className='text-xs text-muted-foreground'>
            Value: {formatCurrency(statistics.totalScholarshipValue)}
          </div>
        </CardContent>
      </Card>

      {/* Collection Rate */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Collection Rate</CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>
            {isNaN(statistics.collectionRate)
              ? '0.0'
              : statistics.collectionRate.toFixed(1)}
            %
          </div>
          <div className='text-xs text-muted-foreground'>
            {formatCurrency(statistics.totalCollected)} /{' '}
            {formatCurrency(statistics.totalPayable)}
          </div>
          <div className='mt-2'>
            <Progress
              value={
                isNaN(statistics.collectionRate) ? 0 : statistics.collectionRate
              }
              className='h-2'
            />
          </div>
          <div className='mt-1'>
            {getStatusBadge(
              isNaN(statistics.collectionRate) ? 0 : statistics.collectionRate
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending and Overdue */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Pending & Overdue
          </CardTitle>
          <AlertTriangle className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-6'>
            {/* Pending Section */}
            <div className='space-y-2'>
              <div className='flex flex-col space-y-1'>
                <span className='text-sm text-muted-foreground'>Pending:</span>
                <span className='font-medium text-sm'>
                  {statistics.dueThisMonth.count} students
                </span>
              </div>
              <div className='text-lg font-bold'>
                {formatCurrency(statistics.dueThisMonth.amount)}
              </div>
            </div>

            {/* Overdue Section */}
            <div className='space-y-2'>
              <div className='flex flex-col space-y-1'>
                <span className='text-sm text-muted-foreground'>Overdue:</span>
                <span className='font-medium text-sm text-red-600'>
                  {statistics.overdue.count} students
                </span>
              </div>
              <div className='text-lg font-bold text-red-600'>
                {formatCurrency(statistics.overdue.amount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Month's Collection */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            This Month's Collection
          </CardTitle>
          <CheckCircle className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-6'>
            {/* This Month's Collection Section */}
            <div className='space-y-2'>
              <div className='flex flex-col space-y-1'>
                <span className='text-sm text-muted-foreground'>
                  Collected:
                </span>
                <span className='font-medium text-sm text-green-600'>
                  0 students
                </span>
              </div>
              <div className='text-lg font-bold text-green-600'>
                {formatCurrency(statistics.thisMonthCollected)}
              </div>
            </div>

            {/* This Month's Pending Section */}
            <div className='space-y-2'>
              <div className='flex flex-col space-y-1'>
                <span className='text-sm text-muted-foreground'>Pending:</span>
                <span className='font-medium text-sm'>
                  {statistics.currentMonthPending?.count || 0} students
                </span>
              </div>
              <div className='text-lg font-bold'>
                {formatCurrency(statistics.currentMonthPending?.amount || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
