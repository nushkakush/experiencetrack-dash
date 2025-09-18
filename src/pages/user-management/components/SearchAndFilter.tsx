import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
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
import {
  Search,
  X,
  Calendar as CalendarIcon,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { UserRole } from '@/types/auth';
import { UserStatus } from '@/types/userManagement';
import { cn } from '@/lib/utils';

interface SearchAndFilterProps {
  onSearchChange: (searchTerm: string) => void;
  onRoleFilterChange: (roles: UserRole[]) => void;
  onStatusFilterChange: (statuses: UserStatus[]) => void;
  onDateRangeChange: (dateRange: { from?: Date; to?: Date }) => void;
  onClearFilters: () => void;
  searchTerm: string;
  selectedRoles: UserRole[];
  selectedStatuses: UserStatus[];
  dateRange: { from?: Date; to?: Date };
  isLoading?: boolean;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'program_manager', label: 'Program Manager' },
  { value: 'fee_collector', label: 'Fee Collector' },
  { value: 'partnerships_head', label: 'Partnerships Head' },
  { value: 'placement_coordinator', label: 'Placement Coordinator' },
  { value: 'applications_manager', label: 'Applications Manager' },
  { value: 'application_reviewer', label: 'Application Reviewer' },
  { value: 'litmus_test_reviewer', label: 'Litmus Test Reviewer' },
];

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'invited', label: 'Invited' },
];

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onDateRangeChange,
  onClearFilters,
  searchTerm,
  selectedRoles,
  selectedStatuses,
  dateRange,
  isLoading = false,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearchChange]);

  // Sync local search term with prop
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleRoleToggle = useCallback(
    (role: UserRole) => {
      const newRoles = selectedRoles.includes(role)
        ? selectedRoles.filter(r => r !== role)
        : [...selectedRoles, role];
      console.log('🔍 [FILTER] Role filter changed:', { role, newRoles, previousRoles: selectedRoles });
      onRoleFilterChange(newRoles);
    },
    [selectedRoles, onRoleFilterChange]
  );

  const handleStatusToggle = useCallback(
    (status: UserStatus) => {
      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status];
      console.log('🔍 [FILTER] Status filter changed:', { status, newStatuses, previousStatuses: selectedStatuses });
      onStatusFilterChange(newStatuses);
    },
    [selectedStatuses, onStatusFilterChange]
  );

  const handleClearFilters = useCallback(() => {
    setLocalSearchTerm('');
    onClearFilters();
  }, [onClearFilters]);

  const hasActiveFilters = 
    localSearchTerm.trim() !== '' ||
    selectedRoles.length > 0 ||
    selectedStatuses.length > 0 ||
    dateRange.from ||
    dateRange.to;

  const getRoleColor = (role: UserRole) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      program_manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fee_collector: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      partnerships_head: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      placement_coordinator: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      applications_manager: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      application_reviewer: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      litmus_test_reviewer: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getStatusColor = (status: UserStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      invited: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="pl-10 pr-4"
            disabled={isLoading}
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="w-full lg:w-48">
          <Select
            value={selectedRoles.length > 0 ? selectedRoles[0] : ""}
            onValueChange={(value) => {
              console.log('🔍 [FILTER] Role dropdown changed:', { value, currentRoles: selectedRoles });
              if (value === "all") {
                onRoleFilterChange([]);
              } else {
                onRoleFilterChange([value as UserRole]);
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full lg:w-48">
          <Select
            value={selectedStatuses.length > 0 ? selectedStatuses[0] : ""}
            onValueChange={(value) => {
              console.log('🔍 [FILTER] Status dropdown changed:', { value, currentStatuses: selectedStatuses });
              if (value === "all") {
                onStatusFilterChange([]);
              } else {
                onStatusFilterChange([value as UserStatus]);
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filters */}
        <div className="flex gap-2 w-full lg:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[140px]",
                  !dateRange.from && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, "MMM dd") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[140px]",
                  !dateRange.to && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, "MMM dd") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading}
            className="shrink-0"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
          {localSearchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: "{localSearchTerm}"
              <X
                className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded-sm"
                onClick={() => setLocalSearchTerm('')}
              />
            </Badge>
          )}
          {selectedRoles.map((role) => (
            <Badge
              key={role}
              variant="secondary"
              className={cn("gap-1", getRoleColor(role))}
            >
              {ROLE_OPTIONS.find(r => r.value === role)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded-sm"
                onClick={() => handleRoleToggle(role)}
              />
            </Badge>
          ))}
          {selectedStatuses.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className={cn("gap-1", getStatusColor(status))}
            >
              {STATUS_OPTIONS.find(s => s.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded-sm"
                onClick={() => handleStatusToggle(status)}
              />
            </Badge>
          ))}
          {dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              From: {format(dateRange.from, "MMM dd, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded-sm"
                onClick={() => onDateRangeChange({ ...dateRange, from: undefined })}
              />
            </Badge>
          )}
          {dateRange.to && (
            <Badge variant="secondary" className="gap-1">
              To: {format(dateRange.to, "MMM dd, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-destructive/20 rounded-sm"
                onClick={() => onDateRangeChange({ ...dateRange, to: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
