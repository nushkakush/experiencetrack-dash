/**
 * Refactored Cohort Students Table
 * Replaces the monolithic 969-line component with a modular, maintainable structure
 */

import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Filter, Download } from 'lucide-react';
import { StudentTableHeader } from './StudentTableHeader';
import { StudentTableRow } from './StudentTableRow';
import { StudentTableFilters } from './StudentTableFilters';
import { StudentTableActions } from './StudentTableActions';
import { useCohortStudents } from '@/domains/cohorts/hooks/useCohortStudents';
import { ConfirmationDialog } from '@/shared/components/Dialog';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { CohortStudent } from '@/types/cohort';

interface CohortStudentsTableProps {
  cohortId: string;
  cohortName?: string;
  onAddStudent?: () => void;
  onEditStudent?: (student: CohortStudent) => void;
  onManagePayments?: (student: CohortStudent) => void;
  onManageScholarships?: (student: CohortStudent) => void;
  onSendEmail?: (student: CohortStudent) => void;
}

export const CohortStudentsTable: React.FC<CohortStudentsTableProps> = React.memo(({
  cohortId,
  cohortName,
  onAddStudent,
  onEditStudent,
  onManagePayments,
  onManageScholarships,
  onSendEmail,
}) => {

  const { hasPermission } = useFeaturePermissions();
  const [showFilters, setShowFilters] = React.useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);

  const {
    students,
    statistics,
    isLoading,
    error,
    bulkActionLoading,
    isRemovingStudent,
    filters,
    updateFilters,
    selectedStudents,
    toggleStudentSelection,
    selectAllStudents,
    clearSelection,
    isAllSelected,
    removeStudent,
    bulkRemoveStudents,
    refetch,
  } = useCohortStudents({ cohortId });



  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load students</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSelectedStudents = selectedStudents.size > 0;
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canDeleteStudents = hasPermission('cohorts.delete_students');

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statistics.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statistics.dropped}</div>
            <p className="text-sm text-muted-foreground">Dropped</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Students in {cohortName || 'Cohort'}
              <Badge variant="secondary" className="ml-2">
                {students.length}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              {canManageStudents && onAddStudent && (
                <Button onClick={onAddStudent} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          </div>

          {/* Search and Basic Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="max-w-sm"
              />
            </div>
            
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value as any })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <StudentTableFilters
              filters={filters}
              onUpdateFilters={updateFilters}
              onClearFilters={() => updateFilters({
                search: '',
                status: 'all',
                sortBy: 'name',
                sortOrder: 'asc',
              })}
            />
          )}

          {/* Bulk Actions */}
          {hasSelectedStudents && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedStudents.size} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear selection
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                {canDeleteStudents && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    disabled={bulkActionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Selected
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {filters.search || filters.status !== 'all' 
                  ? 'No students match the current filters'
                  : 'No students in this cohort yet'
                }
              </div>
              {canManageStudents && onAddStudent && !filters.search && filters.status === 'all' && (
                <Button onClick={onAddStudent} className="mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <StudentTableHeader
                isAllSelected={isAllSelected}
                onToggleSelectAll={selectAllStudents}
                onClearSelection={clearSelection}
                filters={filters}
                onUpdateFilters={updateFilters}
                selectedCount={selectedStudents.size}
                totalCount={students.length}
              />
              <TableBody>
                {students.map((student) => (
                  <StudentTableRow
                    key={student.student?.id || student.id}
                    student={student}
                    isSelected={selectedStudents.has(student.student?.id || '')}
                    onToggleSelection={toggleStudentSelection}
                    onEdit={onEditStudent}
                    onRemove={canDeleteStudents ? removeStudent : undefined}
                    onManagePayments={onManagePayments}
                    onManageScholarships={onManageScholarships}
                    onSendEmail={onSendEmail}
                    isRemoving={isRemovingStudent}
                    showActions={canManageStudents}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title="Remove Selected Students"
        message={`Are you sure you want to remove ${selectedStudents.size} students from this cohort? This action cannot be undone.`}
        confirmLabel="Remove Students"
        onConfirm={async () => {
          await bulkRemoveStudents();
          setShowBulkDeleteDialog(false);
        }}
        confirmLoading={bulkActionLoading}
        type="danger"
      />
    </div>
  );
});

CohortStudentsTable.displayName = 'CohortStudentsTable';
