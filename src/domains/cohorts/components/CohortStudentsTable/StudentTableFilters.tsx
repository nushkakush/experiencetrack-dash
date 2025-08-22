/**
 * Student Table Filters Component
 * Advanced filtering functionality
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { CohortStudentsFilters } from '@/domains/cohorts/hooks/useCohortStudents';

interface StudentTableFiltersProps {
  filters: CohortStudentsFilters;
  onUpdateFilters: (filters: Partial<CohortStudentsFilters>) => void;
  onClearFilters: () => void;
}

export const StudentTableFilters: React.FC<StudentTableFiltersProps> = React.memo(({
  filters,
  onUpdateFilters,
  onClearFilters,
}) => {
  const hasActiveFilters = filters.search || filters.status !== 'all';

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Advanced Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-auto p-1"
          >
            <X className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Sort By</label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onUpdateFilters({ sortBy: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="joined_date">Join Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Sort Order</label>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => onUpdateFilters({ sortOrder: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <button
                onClick={() => onUpdateFilters({ search: '' })}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <button
                onClick={() => onUpdateFilters({ status: 'all' })}
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

StudentTableFilters.displayName = 'StudentTableFilters';
