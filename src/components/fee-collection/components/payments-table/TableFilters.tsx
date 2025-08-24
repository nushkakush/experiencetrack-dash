import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface TableFiltersProps {
  searchTerm: string;
  statusFilter: string;
  planFilter: string;
  scholarshipFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPlanFilterChange: (value: string) => void;
  onScholarshipFilterChange: (value: string) => void;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  statusFilter,
  planFilter,
  scholarshipFilter,
  onSearchChange,
  onStatusFilterChange,
  onPlanFilterChange,
  onScholarshipFilterChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="waived">Waived</SelectItem>
          <SelectItem value="partially_waived">Partially Waived</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="verification_pending">Verification Pending</SelectItem>
          <SelectItem value="complete">Complete</SelectItem>
          <SelectItem value="dropped">Dropped</SelectItem>
        </SelectContent>
      </Select>

      <Select value={planFilter} onValueChange={onPlanFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Plans</SelectItem>
          <SelectItem value="one_shot">One-Shot</SelectItem>
          <SelectItem value="sem_wise">Semester-wise</SelectItem>
          <SelectItem value="instalment_wise">Installment-wise</SelectItem>
          <SelectItem value="not_selected">Not Selected</SelectItem>
        </SelectContent>
      </Select>

      <Select value={scholarshipFilter} onValueChange={onScholarshipFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Scholarships" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Scholarships</SelectItem>
          <SelectItem value="with_scholarship">With Scholarship</SelectItem>
          <SelectItem value="without_scholarship">Without Scholarship</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
