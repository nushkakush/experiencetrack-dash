import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

interface StudentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  scholarshipFilter: string;
  onScholarshipFilterChange: (value: string) => void;
  paymentPlanFilter: string;
  onPaymentPlanFilterChange: (value: string) => void;
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  scholarshipFilter,
  onScholarshipFilterChange,
  paymentPlanFilter,
  onPaymentPlanFilterChange,
  showFilters,
  onShowFiltersChange,
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <div className='space-y-4'>
      {/* Search and Filter Toggle */}
      <div className='flex items-center gap-4'>
        <div className='relative flex-1 max-w-md'>
          <Input
            placeholder='Search students...'
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className='pl-9'
          />
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onShowFiltersChange(!showFilters)}
          className='flex items-center gap-2'
        >
          <Filter className='h-4 w-4' />
          Filters
        </Button>

        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearFilters}
            className='flex items-center gap-2 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
          {/* Status Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-muted-foreground'>
              Invitation Status
            </label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='sent'>Sent</SelectItem>
                <SelectItem value='accepted'>Accepted</SelectItem>
                <SelectItem value='declined'>Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scholarship Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-muted-foreground'>
              Scholarship
            </label>
            <Select value={scholarshipFilter} onValueChange={onScholarshipFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder='All scholarships' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Students</SelectItem>
                <SelectItem value='assigned'>With Scholarship</SelectItem>
                <SelectItem value='not_assigned'>Without Scholarship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Plan Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-muted-foreground'>
              Payment Plan
            </label>
            <Select value={paymentPlanFilter} onValueChange={onPaymentPlanFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder='All payment plans' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Students</SelectItem>
                <SelectItem value='assigned'>With Payment Plan</SelectItem>
                <SelectItem value='not_assigned'>Without Payment Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};
