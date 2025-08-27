import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { EquipmentDamageReport } from '@/types/equipment';

interface DamageReportsListProps {
  reports: EquipmentDamageReport[];
  loading?: boolean;
}

export const DamageReportsList: React.FC<DamageReportsListProps> = ({
  reports,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'reported':
        return 'secondary';
      case 'under_review':
        return 'default';
      case 'repair_approved':
        return 'default';
      case 'repair_completed':
        return 'default';
      case 'replacement_approved':
        return 'default';
      case 'resolved':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      default:
        return <Clock className='h-4 w-4 text-orange-500' />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Damage Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map(i => (
              <div key={i} className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Damage Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8 text-gray-500'>
            <AlertTriangle className='h-12 w-12 mx-auto mb-4 text-gray-300' />
            <p>No damage reports found for this equipment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5' />
          Damage Reports ({reports.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Borrowing Info</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(report => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-gray-400' />
                    {formatDate(report.created_at)}
                  </div>
                </TableCell>
                <TableCell className='max-w-xs'>
                  <div className='truncate' title={report.damage_description}>
                    {report.damage_description}
                  </div>
                </TableCell>
                <TableCell>
                  {report.borrowing ? (
                    <div className='space-y-1'>
                      <div className='text-sm'>
                        <span className='font-medium'>Student:</span>{' '}
                        {report.borrowing.student?.first_name}{' '}
                        {report.borrowing.student?.last_name}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Borrowed: {formatDate(report.borrowing.borrowed_at)}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Expected Return:{' '}
                        {formatDate(report.borrowing.expected_return_date)}
                      </div>
                    </div>
                  ) : (
                    <span className='text-gray-400'>Not borrowed</span>
                  )}
                </TableCell>
                <TableCell>
                  {report.estimated_repair_cost ? (
                    <div className='flex items-center gap-1'>
                      <DollarSign className='h-4 w-4 text-green-500' />₹
                      {report.estimated_repair_cost.toLocaleString()}
                    </div>
                  ) : (
                    <span className='text-gray-400'>Not specified</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(report.status)}
                    className='flex items-center gap-1'
                  >
                    {getStatusIcon(report.status)}
                    {report.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {report.reported_by_user ? (
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 text-gray-400' />
                      {report.reported_by_user.first_name}{' '}
                      {report.reported_by_user.last_name}
                    </div>
                  ) : (
                    <span className='text-gray-400'>Unknown</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
