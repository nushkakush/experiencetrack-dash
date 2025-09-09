import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, User, IndianRupee } from 'lucide-react';
import { EquipmentDamageReport } from '../../types';
import { formatDate, formatCurrency } from '@/utils/dateUtils';

interface DamageReportsTabProps {
  damageReports: EquipmentDamageReport[];
  isLoading: boolean;
  error: Error | null;
}

export const DamageReportsTab: React.FC<DamageReportsTabProps> = ({
  damageReports,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='h-4 bg-muted rounded w-1/4 mb-4'></div>
          <div className='space-y-3'>
            <div className='h-20 bg-muted rounded'></div>
            <div className='h-20 bg-muted rounded'></div>
            <div className='h-20 bg-muted rounded'></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-red-600'>
          Error Loading Damage Reports
        </h3>
        <p className='text-sm text-muted-foreground'>{error.message}</p>
      </div>
    );
  }

  if (damageReports.length === 0) {
    return (
      <div className='text-center py-8'>
        <AlertTriangle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <h3 className='text-lg font-medium text-muted-foreground'>
          No Damage Reports
        </h3>
        <p className='text-sm text-muted-foreground'>
          This equipment has no reported damage or loss incidents.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Damage Reports Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{damageReports.length}</div>
              <div className='text-sm text-muted-foreground'>Total Reports</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {damageReports.filter(r => r.status === 'reported').length}
              </div>
              <div className='text-sm text-muted-foreground'>Reported</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {damageReports.filter(r => r.status === 'under_review').length}
              </div>
              <div className='text-sm text-muted-foreground'>Under Review</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {damageReports.filter(r => r.status === 'resolved').length}
              </div>
              <div className='text-sm text-muted-foreground'>Resolved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Reports List */}
      <div className='space-y-4'>
        {damageReports.map(report => (
          <Card key={report.id}>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>Damage Report</CardTitle>
                <Badge
                  variant={
                    report.status === 'resolved'
                      ? 'default'
                      : report.status === 'under_review'
                        ? 'secondary'
                        : report.status === 'reported'
                          ? 'outline'
                          : 'destructive'
                  }
                >
                  {report.status.replace('_', ' ').charAt(0).toUpperCase() +
                    report.status.replace('_', ' ').slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-3'>
              <p className='text-sm'>{report.damage_description}</p>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div className='flex items-center space-x-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span>
                    <span className='font-medium'>Reported:</span>{' '}
                    {formatDate(report.created_at)}
                  </span>
                </div>

                {report.borrowing ? (
                  <div className='flex items-center space-x-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>
                      <span className='font-medium'>Borrowed by:</span>{' '}
                      {report.borrowing.student?.first_name}{' '}
                      {report.borrowing.student?.last_name}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center space-x-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span>
                      <span className='font-medium'>Status:</span> Not borrowed
                    </span>
                  </div>
                )}

                {report.estimated_repair_cost && (
                  <div className='flex items-center space-x-2'>
                    <IndianRupee className='h-4 w-4 text-muted-foreground' />
                    <span>
                      <span className='font-medium'>Est. Cost:</span>{' '}
                      {formatCurrency(report.estimated_repair_cost)}
                    </span>
                  </div>
                )}

                {report.actual_repair_cost && (
                  <div className='flex items-center space-x-2'>
                    <IndianRupee className='h-4 w-4 text-muted-foreground' />
                    <span>
                      <span className='font-medium'>Actual Cost:</span>{' '}
                      {formatCurrency(report.actual_repair_cost)}
                    </span>
                  </div>
                )}
              </div>

              {report.borrowing && (
                <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
                  <p className='text-sm font-medium mb-2 text-blue-800 dark:text-blue-200'>
                    Borrowing Information:
                  </p>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='font-medium'>Student:</span>{' '}
                      {report.borrowing.student?.first_name}{' '}
                      {report.borrowing.student?.last_name}
                    </div>
                    <div>
                      <span className='font-medium'>Borrowed:</span>{' '}
                      {formatDate(report.borrowing.borrowed_at)}
                    </div>
                    <div>
                      <span className='font-medium'>Expected Return:</span>{' '}
                      {formatDate(report.borrowing.expected_return_date)}
                    </div>
                    <div>
                      <span className='font-medium'>Status:</span>{' '}
                      {report.borrowing.status}
                    </div>
                  </div>
                </div>
              )}

              {report.resolved_by_user && (
                <div className='mt-3 p-3 bg-muted rounded-lg'>
                  <p className='text-sm font-medium mb-1'>Resolved by:</p>
                  <p className='text-sm'>
                    {report.resolved_by_user.first_name}{' '}
                    {report.resolved_by_user.last_name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
