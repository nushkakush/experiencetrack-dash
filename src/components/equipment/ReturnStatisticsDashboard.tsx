import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ReturnProcessingService } from '@/services/returnProcessing.service';

interface ReturnStatistics {
  totalReturns: number;
  overdueReturns: number;
  damagedReturns: number;
  averageReturnTime: number;
}

interface ReturnStatisticsDashboardProps {
  className?: string;
}

export function ReturnStatisticsDashboard({
  className,
}: ReturnStatisticsDashboardProps) {
  const [statistics, setStatistics] = useState<ReturnStatistics>({
    totalReturns: 0,
    overdueReturns: 0,
    damagedReturns: 0,
    averageReturnTime: 0,
  });
  const [timeRange, setTimeRange] = useState('30'); // days
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const stats = await ReturnProcessingService.getReturnStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading return statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOverduePercentage = () => {
    if (statistics.totalReturns === 0) return 0;
    return (
      (statistics.overdueReturns / statistics.totalReturns) *
      100
    ).toFixed(1);
  };

  const getDamagedPercentage = () => {
    if (statistics.totalReturns === 0) return 0;
    return (
      (statistics.damagedReturns / statistics.totalReturns) *
      100
    ).toFixed(1);
  };

  const getAverageReturnTimeText = () => {
    if (statistics.averageReturnTime === 0) return '0 days';
    return `${statistics.averageReturnTime.toFixed(1)} days`;
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value <= threshold) {
      return <TrendingDown className='h-4 w-4 text-green-600' />;
    }
    return <TrendingUp className='h-4 w-4 text-red-600' />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Return Statistics</h2>
          <p className='text-muted-foreground'>
            Overview of equipment return performance
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
              <SelectItem value='365'>Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='sm'
            onClick={loadStatistics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Total Returns */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Returns</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? '...' : statistics.totalReturns}
            </div>
            <p className='text-xs text-muted-foreground'>
              In the last {timeRange} days
            </p>
          </CardContent>
        </Card>

        {/* Overdue Returns */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Overdue Returns
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <div className='text-2xl font-bold text-orange-600'>
                {isLoading ? '...' : statistics.overdueReturns}
              </div>
              {!isLoading &&
                getTrendIcon(parseFloat(getOverduePercentage()), 10)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {getOverduePercentage()}% of total returns
            </p>
          </CardContent>
        </Card>

        {/* Damaged Returns */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Damaged Returns
            </CardTitle>
            <XCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <div className='text-2xl font-bold text-red-600'>
                {isLoading ? '...' : statistics.damagedReturns}
              </div>
              {!isLoading &&
                getTrendIcon(parseFloat(getDamagedPercentage()), 5)}
            </div>
            <p className='text-xs text-muted-foreground'>
              {getDamagedPercentage()}% of total returns
            </p>
          </CardContent>
        </Card>

        {/* Average Return Time */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Return Time
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <div className='text-2xl font-bold'>
                {isLoading ? '...' : getAverageReturnTimeText()}
              </div>
              {!isLoading && getTrendIcon(statistics.averageReturnTime, 7)}
            </div>
            <p className='text-xs text-muted-foreground'>Days past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Return Performance */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Return Performance</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>On-time Returns</span>
              <Badge variant='default'>
                {statistics.totalReturns - statistics.overdueReturns} /{' '}
                {statistics.totalReturns}
              </Badge>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-green-600 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${statistics.totalReturns > 0 ? ((statistics.totalReturns - statistics.overdueReturns) / statistics.totalReturns) * 100 : 0}%`,
                }}
              />
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span>
                {statistics.totalReturns > 0
                  ? (
                      ((statistics.totalReturns - statistics.overdueReturns) /
                        statistics.totalReturns) *
                      100
                    ).toFixed(1)
                  : 0}
                % on-time return rate
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Condition Performance */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Condition Performance</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                Good Condition Returns
              </span>
              <Badge variant='default'>
                {statistics.totalReturns - statistics.damagedReturns} /{' '}
                {statistics.totalReturns}
              </Badge>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${statistics.totalReturns > 0 ? ((statistics.totalReturns - statistics.damagedReturns) / statistics.totalReturns) * 100 : 0}%`,
                }}
              />
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Package className='h-4 w-4 text-blue-600' />
              <span>
                {statistics.totalReturns > 0
                  ? (
                      ((statistics.totalReturns - statistics.damagedReturns) /
                        statistics.totalReturns) *
                      100
                    ).toFixed(1)
                  : 0}
                % good condition rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {parseFloat(getOverduePercentage()) > 10 && (
              <div className='flex items-start gap-3 p-3 bg-orange-50 rounded-lg'>
                <AlertTriangle className='h-5 w-5 text-orange-600 mt-0.5' />
                <div>
                  <h4 className='font-medium text-orange-800'>
                    High Overdue Rate
                  </h4>
                  <p className='text-sm text-orange-700'>
                    {getOverduePercentage()}% of returns are overdue. Consider
                    implementing stricter return policies or automated
                    reminders.
                  </p>
                </div>
              </div>
            )}

            {parseFloat(getDamagedPercentage()) > 5 && (
              <div className='flex items-start gap-3 p-3 bg-red-50 rounded-lg'>
                <XCircle className='h-5 w-5 text-red-600 mt-0.5' />
                <div>
                  <h4 className='font-medium text-red-800'>High Damage Rate</h4>
                  <p className='text-sm text-red-700'>
                    {getDamagedPercentage()}% of returns are damaged. Consider
                    improving equipment handling training or implementing damage
                    waivers.
                  </p>
                </div>
              </div>
            )}

            {statistics.averageReturnTime > 7 && (
              <div className='flex items-start gap-3 p-3 bg-yellow-50 rounded-lg'>
                <Clock className='h-5 w-5 text-yellow-600 mt-0.5' />
                <div>
                  <h4 className='font-medium text-yellow-800'>
                    Long Average Return Time
                  </h4>
                  <p className='text-sm text-yellow-700'>
                    Average return time is {getAverageReturnTimeText()}.
                    Consider reviewing borrowing periods or implementing early
                    return incentives.
                  </p>
                </div>
              </div>
            )}

            {parseFloat(getOverduePercentage()) <= 10 &&
              parseFloat(getDamagedPercentage()) <= 5 &&
              statistics.averageReturnTime <= 7 && (
                <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
                  <CheckCircle className='h-5 w-5 text-green-600 mt-0.5' />
                  <div>
                    <h4 className='font-medium text-green-800'>
                      Excellent Performance
                    </h4>
                    <p className='text-sm text-green-700'>
                      All metrics are within acceptable ranges. Keep up the good
                      work!
                    </p>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
