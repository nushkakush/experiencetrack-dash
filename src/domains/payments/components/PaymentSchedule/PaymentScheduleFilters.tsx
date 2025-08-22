/**
 * Payment Schedule Filters Component
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PaymentScheduleFiltersProps {
  filters: {
    status: string;
    type: string;
  };
  onFiltersChange: (filters: any) => void;
  schedule: any[];
}

export const PaymentScheduleFilters: React.FC<PaymentScheduleFiltersProps> = React.memo(({
  filters,
  onFiltersChange,
  schedule,
}) => {
  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all';

  const statusCounts = React.useMemo(() => {
    return schedule.reduce((acc, item) => {
      const isOverdue = item.status === 'pending' && new Date(item.dueDate) < new Date();
      const status = isOverdue ? 'overdue' : item.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [schedule]);

  const typeCounts = React.useMemo(() => {
    return schedule.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [schedule]);

  const clearFilters = () => {
    onFiltersChange({ status: 'all', type: 'all' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({schedule.length})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending || 0})</SelectItem>
            <SelectItem value="paid">Paid ({statusCounts.paid || 0})</SelectItem>
            <SelectItem value="overdue">Overdue ({statusCounts.overdue || 0})</SelectItem>
            <SelectItem value="partially_paid">Partially Paid ({statusCounts.partially_paid || 0})</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="admission_fee">Admission Fee ({typeCounts.admission_fee || 0})</SelectItem>
            <SelectItem value="semester_fee">Semester Fee ({typeCounts.semester_fee || 0})</SelectItem>
            <SelectItem value="installment">Installment ({typeCounts.installment || 0})</SelectItem>
            <SelectItem value="one_shot">One Shot ({typeCounts.one_shot || 0})</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Type: {filters.type}
              <button
                onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

PaymentScheduleFilters.displayName = 'PaymentScheduleFilters';
