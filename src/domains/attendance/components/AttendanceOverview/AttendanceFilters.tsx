/**
 * Attendance Filters Component
 * Filtering options for attendance overview
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { useCohortEpics } from '@/domains/attendance/hooks/useAttendance';

interface AttendanceFiltersProps {
  filters: {
    epicId: string;
    sessionType: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  studentId: string;
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = React.memo(({
  filters,
  onFiltersChange,
  studentId,
}) => {
  // Get available epics for the student's cohort
  const { epics = [] } = useCohortEpics(''); // Would need cohort ID

  const hasActiveFilters = filters.epicId !== '' || 
                           filters.sessionType !== 'all' || 
                           filters.status !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      epicId: '',
      sessionType: 'all',
      status: 'all',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {[
                filters.epicId && 'Epic',
                filters.sessionType !== 'all' && 'Type',
                filters.status !== 'all' && 'Status'
              ].filter(Boolean).length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Epic Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Epic</label>
            <Select
              value={filters.epicId}
              onValueChange={(value) => onFiltersChange({ ...filters, epicId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Epics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Epics</SelectItem>
                {epics.map((epic) => (
                  <SelectItem key={epic.id} value={epic.id}>
                    {epic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Type</label>
            <Select
              value={filters.sessionType}
              onValueChange={(value) => onFiltersChange({ ...filters, sessionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="lecture">Lectures</SelectItem>
                <SelectItem value="lab">Lab Sessions</SelectItem>
                <SelectItem value="workshop">Workshops</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters & Clear */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                
                {filters.epicId && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Epic: {epics.find(e => e.id === filters.epicId)?.name || filters.epicId}
                    <button
                      onClick={() => onFiltersChange({ ...filters, epicId: '' })}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {filters.sessionType !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Type: {filters.sessionType}
                    <button
                      onClick={() => onFiltersChange({ ...filters, sessionType: 'all' })}
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
                      onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AttendanceFilters.displayName = 'AttendanceFilters';
