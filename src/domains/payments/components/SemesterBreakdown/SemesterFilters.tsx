/**
 * Semester Filters Component
 * Filtering options for semester breakdown
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { SemesterData } from './SemesterBreakdownTable';

interface SemesterFiltersProps {
  filters: {
    status: string;
    semester: string;
  };
  onFiltersChange: (filters: any) => void;
  semesters: SemesterData[];
}

export const SemesterFilters: React.FC<SemesterFiltersProps> = React.memo(({
  filters,
  onFiltersChange,
  semesters,
}) => {
  const hasActiveFilters = filters.status !== 'all' || filters.semester !== 'all';

  const statusCounts = React.useMemo(() => {
    return semesters.reduce((acc, semester) => {
      acc[semester.status] = (acc[semester.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [semesters]);

  const clearFilters = () => {
    onFiltersChange({ status: 'all', semester: 'all' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({semesters.length})</SelectItem>
            <SelectItem value="current">Current ({statusCounts.current || 0})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed || 0})</SelectItem>
            <SelectItem value="upcoming">Upcoming ({statusCounts.upcoming || 0})</SelectItem>
            <SelectItem value="overdue">Overdue ({statusCounts.overdue || 0})</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.semester}
          onValueChange={(value) => onFiltersChange({ ...filters, semester: value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={semester.id}>
                {semester.name}
              </SelectItem>
            ))}
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
          
          {filters.semester !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Semester: {semesters.find(s => s.id === filters.semester)?.name}
              <button
                onClick={() => onFiltersChange({ ...filters, semester: 'all' })}
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

SemesterFilters.displayName = 'SemesterFilters';
