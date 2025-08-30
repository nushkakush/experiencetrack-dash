import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserPlus } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { Scholarship } from '@/types/fee';
import MarkDroppedOutDialog from './MarkDroppedOutDialog';
import { useCohortStudentsTable } from './hooks/useCohortStudentsTable';
import {
  StudentFilters,
  StudentTableRow,
  EmailConfirmationDialog,
  BulkActions,
  BulkSelectionCheckbox,
} from './components';

interface CohortStudentsTableProps {
  students: CohortStudent[];
  scholarships?: Scholarship[];
  onStudentDeleted: () => void;
  onStudentUpdated?: (
    studentId: string,
    updates: Partial<CohortStudent>
  ) => void;
  onScholarshipAssigned?: () => void;
  loading?: boolean;
  isRefreshing?: boolean;
  cohortName?: string;
}

export default function CohortStudentsTable({
  students,
  scholarships = [],
  onStudentDeleted,
  onStudentUpdated,
  onScholarshipAssigned,
  loading = false,
  isRefreshing = false,
  cohortName,
}: CohortStudentsTableProps) {
  const {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    scholarshipFilter,
    setScholarshipFilter,
    paymentPlanFilter,
    setPaymentPlanFilter,
    showFilters,
    setShowFilters,
    deletingStudentId,
    invitingStudentId,
    emailConfirmationDialog,
    scholarshipAssignments,
    scholarshipDetails,
    loadingScholarships,
    updatingScholarshipId,
    paymentPlanAssignments,
    paymentPlanDetails,
    loadingPaymentPlans,
    updatingPaymentPlanId,
    customFeeStructures,
    isFeeSetupComplete,
    loadingFeeSetup,
    droppedOutDialogOpen,
    setDroppedOutDialogOpen,
    selectedStudentForDropout,
    setSelectedStudentForDropout,

    // Bulk selection state
    selectedStudentIds,
    selectedStudents,
    filteredSelectedStudents,
    isAllSelected,
    isIndeterminate,
    isBulkProcessing,

    // Computed values
    filteredStudents,
    hasActiveFilters,
    canManageStudents,
    canEditStudents,
    canAssignScholarships,

    // Actions
    clearFilters,
    handleScholarshipAssigned,
    handlePaymentPlanUpdated,
    openEmailConfirmation,
    closeEmailConfirmation,
    confirmSendEmail,
    shouldShowEmailOption,
    handleDeleteStudent,
    handleMarkAsDroppedOut,
    handleDroppedOutSuccess,
    handleReverted,
    refreshData,

    // Bulk selection actions
    handleSelectAll,
    handleSelectStudent,
    handleClearSelection,
    handleBulkAssignScholarship,
    handleBulkAssignPaymentPlan,
    handleBulkDeleteStudents,
  } = useCohortStudentsTable({
    students,
    scholarships,
    onStudentDeleted,
    onStudentUpdated,
    cohortName,
  });

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='flex items-center space-x-4 p-4 border rounded-lg'
          >
            <div className='h-10 w-10 bg-gray-200 rounded-full animate-pulse' />
            <div className='space-y-2 flex-1'>
              <div className='h-4 bg-gray-200 rounded w-32 animate-pulse' />
              <div className='h-3 bg-gray-200 rounded w-24 animate-pulse' />
            </div>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
          </div>
        ))}
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    if (students.length === 0) {
      return (
        <div className='text-center py-8'>
          <UserPlus className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Students Found
          </h3>
          <p className='text-gray-600'>
            Add students to the cohort to see them here.
          </p>
        </div>
      );
    } else {
      return (
        <div className='space-y-4'>
          <StudentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            scholarshipFilter={scholarshipFilter}
            onScholarshipFilterChange={setScholarshipFilter}
            paymentPlanFilter={paymentPlanFilter}
            onPaymentPlanFilterChange={setPaymentPlanFilter}
            showFilters={showFilters}
            onShowFiltersChange={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          <div className='text-center py-8'>
            <div className='h-12 w-12 text-gray-400 mx-auto mb-4'>
              <svg
                className='h-12 w-12'
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
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Students Match Your Search
            </h3>
            <p className='text-gray-600'>
              Try adjusting your search terms or filters.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className='space-y-4'>
      {/* Search and Filter Section */}
      <StudentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        scholarshipFilter={scholarshipFilter}
        onScholarshipFilterChange={setScholarshipFilter}
        paymentPlanFilter={paymentPlanFilter}
        onPaymentPlanFilterChange={setPaymentPlanFilter}
        showFilters={showFilters}
        onShowFiltersChange={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedStudents={filteredSelectedStudents}
        scholarships={scholarships}
        onAssignScholarship={handleBulkAssignScholarship}
        onAssignPaymentPlan={handleBulkAssignPaymentPlan}
        onDeleteStudents={handleBulkDeleteStudents}
        disabled={isBulkProcessing}
      />

      {/* Results Summary */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='text-sm text-muted-foreground'>
            {filteredStudents.length} of {students.length} students
          </div>
          {isRefreshing && (
            <div className='flex items-center gap-1 text-xs text-blue-600'>
              <div className='h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent'></div>
              <span>Refreshing...</span>
            </div>
          )}
          {(loadingScholarships || loadingPaymentPlans) && (
            <div className='flex items-center gap-1 text-xs text-amber-600'>
              <div className='h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent'></div>
              <span>Loading fee details...</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>
                <BulkSelectionCheckbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  indeterminate={isIndeterminate}
                  disabled={isBulkProcessing}
                  showSelectAll={true}
                  onClearSelection={handleClearSelection}
                  selectedCount={filteredSelectedStudents.length}
                  totalCount={filteredStudents.length}
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              {canAssignScholarships && (
                <TableHead>
                  <div className='flex items-center gap-2'>
                    Scholarship
                    {loadingScholarships && (
                      <div className='h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent'></div>
                    )}
                  </div>
                </TableHead>
              )}
              {canAssignScholarships && (
                <TableHead>
                  <div className='flex items-center gap-2'>
                    Payment Plan
                    {loadingPaymentPlans && (
                      <div className='h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent'></div>
                    )}
                  </div>
                </TableHead>
              )}
              {canManageStudents && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map(student => (
              <StudentTableRow
                key={student.id}
                student={student}
                scholarships={scholarships}
                scholarshipAssignments={scholarshipAssignments}
                scholarshipDetails={scholarshipDetails}
                loadingScholarships={loadingScholarships}
                updatingScholarshipId={updatingScholarshipId}
                paymentPlanAssignments={paymentPlanAssignments}
                paymentPlanDetails={paymentPlanDetails}
                loadingPaymentPlans={loadingPaymentPlans}
                updatingPaymentPlanId={updatingPaymentPlanId}
                customFeeStructures={customFeeStructures}
                isFeeSetupComplete={isFeeSetupComplete}
                deletingStudentId={deletingStudentId}
                invitingStudentId={invitingStudentId}
                canManageStudents={canManageStudents}
                canEditStudents={canEditStudents}
                canAssignScholarships={canAssignScholarships}
                onStudentUpdated={onStudentUpdated}
                onStudentDeleted={onStudentDeleted}
                onScholarshipAssigned={handleScholarshipAssigned}
                onPaymentPlanUpdated={handlePaymentPlanUpdated}
                onOpenEmailConfirmation={openEmailConfirmation}
                onMarkAsDroppedOut={handleMarkAsDroppedOut}
                onDeleteStudent={handleDeleteStudent}
                shouldShowEmailOption={shouldShowEmailOption}
                // Bulk selection props
                isSelected={selectedStudentIds.has(student.id)}
                onSelectChange={checked =>
                  handleSelectStudent(student.id, checked)
                }
                isBulkProcessing={isBulkProcessing}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mark Dropped Out Dialog */}
      <MarkDroppedOutDialog
        open={droppedOutDialogOpen}
        onOpenChange={setDroppedOutDialogOpen}
        student={selectedStudentForDropout}
        onMarkedAsDroppedOut={handleDroppedOutSuccess}
        onReverted={handleReverted}
      />

      {/* Email Confirmation Dialog */}
      <EmailConfirmationDialog
        open={emailConfirmationDialog.open}
        onOpenChange={closeEmailConfirmation}
        student={emailConfirmationDialog.student}
        onConfirm={confirmSendEmail}
      />
    </div>
  );
}
