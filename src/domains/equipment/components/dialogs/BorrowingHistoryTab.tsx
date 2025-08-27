import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Equipment } from '../../types';
import { formatDate } from '@/utils/dateUtils';
import { EquipmentConditionBadge } from '../ui';

interface BorrowingHistoryTabProps {
  equipment: Equipment;
}

export const BorrowingHistoryTab: React.FC<BorrowingHistoryTabProps> = ({
  equipment,
}) => {
  const borrowings = equipment.borrowings || [];

  if (borrowings.length === 0) {
    return (
      <div className='text-center py-8'>
        <Clock className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <h3 className='text-lg font-medium text-muted-foreground'>
          No Borrowing History
        </h3>
        <p className='text-sm text-muted-foreground'>
          This equipment has not been borrowed yet.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Borrowing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{borrowings.length}</div>
              <div className='text-sm text-muted-foreground'>
                Total Borrowings
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {borrowings.filter(b => b.status === 'returned').length}
              </div>
              <div className='text-sm text-muted-foreground'>Returned</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {borrowings.filter(b => b.status === 'active').length}
              </div>
              <div className='text-sm text-muted-foreground'>Active</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {borrowings.filter(b => b.status === 'overdue').length}
              </div>
              <div className='text-sm text-muted-foreground'>Overdue</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borrowing History Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Borrowing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Borrowed Date</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Issue Condition</TableHead>
                <TableHead>Return Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Return Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrowings.map(borrowing => (
                <TableRow key={borrowing.id}>
                  <TableCell>
                    <div className='flex items-center space-x-2'>
                      <User className='h-4 w-4 text-muted-foreground' />
                      <span>
                        {borrowing.student?.first_name}{' '}
                        {borrowing.student?.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(borrowing.borrowed_at)}</TableCell>
                  <TableCell>
                    {formatDate(borrowing.expected_return_date)}
                  </TableCell>
                  <TableCell>
                    <EquipmentConditionBadge
                      condition={borrowing.issue_condition || ''}
                    />
                  </TableCell>
                  <TableCell>
                    <EquipmentConditionBadge
                      condition={borrowing.return_condition || ''}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        borrowing.equipment?.availability_status === 'lost'
                          ? 'destructive'
                          : borrowing.equipment?.condition_status === 'damaged'
                            ? 'destructive'
                            : borrowing.status === 'returned'
                              ? 'default'
                              : borrowing.status === 'active'
                                ? 'secondary'
                                : borrowing.status === 'overdue'
                                  ? 'destructive'
                                  : 'outline'
                      }
                    >
                      {borrowing.equipment?.availability_status === 'lost'
                        ? 'Lost'
                        : borrowing.equipment?.condition_status === 'damaged'
                          ? 'Damaged'
                          : borrowing.status.charAt(0).toUpperCase() +
                            borrowing.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {borrowing.actual_return_date
                      ? formatDate(borrowing.actual_return_date)
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
