/**
 * Student Table Header Component
 * Extracted from large CohortStudentsTable.tsx
 */

import React from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { CohortStudentsFilters } from '@/domains/cohorts/hooks/useCohortStudents';

interface StudentTableHeaderProps {
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  filters: CohortStudentsFilters;
  onUpdateFilters: (filters: Partial<CohortStudentsFilters>) => void;
  selectedCount: number;
  totalCount: number;
}

interface SortableHeaderProps {
  label: string;
  sortKey: CohortStudentsFilters['sortBy'];
  currentSort: CohortStudentsFilters['sortBy'];
  currentOrder: CohortStudentsFilters['sortOrder'];
  onSort: (sortBy: CohortStudentsFilters['sortBy']) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
}) => {
  const isActive = currentSort === sortKey;
  
  const handleSort = () => {
    onSort(sortKey);
  };

  const getSortIcon = () => {
    if (!isActive) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return currentOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <TableHead>
      <Button
        variant="ghost"
        onClick={handleSort}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {label}
        {getSortIcon()}
      </Button>
    </TableHead>
  );
};

export const StudentTableHeader: React.FC<StudentTableHeaderProps> = React.memo(({
  isAllSelected,
  onToggleSelectAll,
  onClearSelection,
  filters,
  onUpdateFilters,
  selectedCount,
  totalCount,
}) => {
  const handleSort = (sortBy: CohortStudentsFilters['sortBy']) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    onUpdateFilters({ sortBy, sortOrder: newOrder });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onToggleSelectAll();
    }
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-12">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all students"
            />
            {selectedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedCount}/{totalCount}
              </span>
            )}
          </div>
        </TableHead>
        
        <SortableHeader
          label="Student"
          sortKey="name"
          currentSort={filters.sortBy}
          currentOrder={filters.sortOrder}
          onSort={handleSort}
        />
        
        <SortableHeader
          label="Status"
          sortKey="status"
          currentSort={filters.sortBy}
          currentOrder={filters.sortOrder}
          onSort={handleSort}
        />
        
        <SortableHeader
          label="Joined Date"
          sortKey="joined_date"
          currentSort={filters.sortBy}
          currentOrder={filters.sortOrder}
          onSort={handleSort}
        />
        
        <TableHead>Contact</TableHead>
        <TableHead>Payment Status</TableHead>
        <TableHead className="w-12">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
});

StudentTableHeader.displayName = 'StudentTableHeader';
