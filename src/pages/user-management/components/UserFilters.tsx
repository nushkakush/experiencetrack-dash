import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserRole } from '@/types/auth';
import { UserStatus } from '@/types/userManagement';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const UserFilters: React.FC = () => {
  const { state, setFilters } = useUserManagement();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleChange = (role: string) => {
    if (role === 'all') {
      setFilters({ role: undefined });
    } else {
      setFilters({ role: role as UserRole });
    }
  };

  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status: status as UserStatus });
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setFilters({
      dateFrom: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setFilters({
      dateTo: date ? format(date, 'yyyy-MM-dd') : undefined,
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(state.filters).some(
    value => value !== undefined
  );

  return (
    <div className='flex items-center gap-2'>
      {/* Role Filter */}
      <Select
        value={state.filters.role || 'all'}
        onValueChange={handleRoleChange}
      >
        <SelectTrigger className='w-32'>
          <SelectValue placeholder='Role' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Roles</SelectItem>
          <SelectItem value='student'>Student</SelectItem>
          <SelectItem value='super_admin'>Super Admin</SelectItem>
          <SelectItem value='program_manager'>Program Manager</SelectItem>
          <SelectItem value='fee_collector'>Fee Collector</SelectItem>
          <SelectItem value='partnerships_head'>Partnerships Head</SelectItem>
          <SelectItem value='placement_coordinator'>
            Placement Coordinator
          </SelectItem>
          <SelectItem value='equipment_manager'>Equipment Manager</SelectItem>
          <SelectItem value='mentor_manager'>Mentor Manager</SelectItem>
          <SelectItem value='experience_designer'>
            Experience Designer
          </SelectItem>
          <SelectItem value='applications_manager'>
            Applications Manager
          </SelectItem>
          <SelectItem value='application_reviewer'>
            Application Reviewer
          </SelectItem>
          <SelectItem value='litmus_test_reviewer'>
            LITMUS Test Reviewer
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={state.filters.status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className='w-32'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All Status</SelectItem>
          <SelectItem value='active'>Active</SelectItem>
          <SelectItem value='inactive'>Inactive</SelectItem>
          <SelectItem value='suspended'>Suspended</SelectItem>
          <SelectItem value='invited'>Invited</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'justify-start text-left font-normal',
              !state.filters.dateFrom &&
                !state.filters.dateTo &&
                'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {state.filters.dateFrom && state.filters.dateTo
              ? `${format(new Date(state.filters.dateFrom), 'MMM dd')} - ${format(new Date(state.filters.dateTo), 'MMM dd')}`
              : 'Date Range'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <div className='flex gap-2 p-3'>
            <div>
              <div className='text-sm font-medium mb-2'>From</div>
              <Calendar
                mode='single'
                selected={
                  state.filters.dateFrom
                    ? new Date(state.filters.dateFrom)
                    : undefined
                }
                onSelect={handleDateFromChange}
                initialFocus
              />
            </div>
            <div>
              <div className='text-sm font-medium mb-2'>To</div>
              <Calendar
                mode='single'
                selected={
                  state.filters.dateTo
                    ? new Date(state.filters.dateTo)
                    : undefined
                }
                onSelect={handleDateToChange}
                initialFocus
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className='flex items-center gap-1'>
          {state.filters.role && (
            <Badge variant='secondary' className='text-xs'>
              Role: {state.filters.role.replace('_', ' ')}
              <button
                onClick={() => setFilters({ role: undefined })}
                className='ml-1 hover:text-red-600'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
          {state.filters.status && (
            <Badge variant='secondary' className='text-xs'>
              Status: {state.filters.status}
              <button
                onClick={() => setFilters({ status: undefined })}
                className='ml-1 hover:text-red-600'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
          {(state.filters.dateFrom || state.filters.dateTo) && (
            <Badge variant='secondary' className='text-xs'>
              Date Range
              <button
                onClick={() =>
                  setFilters({ dateFrom: undefined, dateTo: undefined })
                }
                className='ml-1 hover:text-red-600'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button
          variant='ghost'
          size='sm'
          onClick={clearFilters}
          className='text-muted-foreground hover:text-foreground'
        >
          Clear All
        </Button>
      )}
    </div>
  );
};
