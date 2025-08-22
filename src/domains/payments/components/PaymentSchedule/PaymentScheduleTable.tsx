/**
 * Refactored Payment Schedule Table
 * Replaces the monolithic 622-line PaymentSchedule.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, Plus, FileText } from 'lucide-react';
import { PaymentScheduleItem } from './PaymentScheduleItem';
import { PaymentScheduleActions } from './PaymentScheduleActions';
import { PaymentScheduleFilters } from './PaymentScheduleFilters';
import { useStudentPaymentPlan } from '@/domains/payments/hooks/usePayments';
import { StudentPaymentSummary } from '@/types/fee';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentScheduleTableProps {
  student: StudentPaymentSummary;
  onRecordPayment?: (scheduleItem: any) => void;
  onViewDetails?: (scheduleItem: any) => void;
  onExportSchedule?: () => void;
  showActions?: boolean;
}

export const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = React.memo(({
  student,
  onRecordPayment,
  onViewDetails,
  onExportSchedule,
  showActions = true,
}) => {
  const { paymentPlan, schedule, isLoading, scheduleLoading } = useStudentPaymentPlan(student.id);
  const [filters, setFilters] = React.useState({
    status: 'all',
    type: 'all',
  });

  // Filter schedule items
  const filteredSchedule = React.useMemo(() => {
    if (!schedule) return [];
    
    return schedule.filter(item => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.type !== 'all' && item.type !== filters.type) return false;
      return true;
    });
  }, [schedule, filters]);

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (!schedule) return { total: 0, paid: 0, pending: 0, overdue: 0 };

    const now = new Date();
    return schedule.reduce((acc, item) => {
      acc.total += item.amount;
      
      switch (item.status) {
        case 'paid':
          acc.paid += item.amount;
          break;
        case 'pending':
          if (new Date(item.dueDate) < now) {
            acc.overdue += item.amount;
          } else {
            acc.pending += item.amount;
          }
          break;
        default:
          acc.pending += item.amount;
      }
      
      return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });
  }, [schedule]);

  if (isLoading || scheduleLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading payment schedule...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentPlan || !schedule?.length) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            No payment schedule found for this student
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatCurrency(summary.total)}</div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid)}</div>
            <p className="text-sm text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pending)}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.overdue)}</div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Schedule Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Payment Schedule</span>
              <Badge variant="secondary">{filteredSchedule.length} items</Badge>
            </CardTitle>
            
            {showActions && (
              <div className="flex items-center space-x-2">
                {onExportSchedule && (
                  <Button variant="outline" size="sm" onClick={onExportSchedule}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
                {onRecordPayment && (
                  <Button size="sm" onClick={() => onRecordPayment(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <PaymentScheduleFilters
            filters={filters}
            onFiltersChange={setFilters}
            schedule={schedule}
          />
        </CardHeader>

        <CardContent>
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                No payment items match the current filters
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  {showActions && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedule.map((item) => (
                  <PaymentScheduleItem
                    key={item.id}
                    item={item}
                    onRecordPayment={onRecordPayment}
                    onViewDetails={onViewDetails}
                    showActions={showActions}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actions Panel */}
      {showActions && (
        <PaymentScheduleActions
          paymentPlan={paymentPlan}
          schedule={schedule}
          student={student}
          onRefresh={() => window.location.reload()} // TODO: Implement proper refresh
        />
      )}
    </div>
  );
});

PaymentScheduleTable.displayName = 'PaymentScheduleTable';
