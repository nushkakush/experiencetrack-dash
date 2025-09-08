import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StudentPaymentSummary } from '@/types/fee';
import {
  TableFilters,
  TableRow as PaymentsTableRow,
  usePaymentsTable,
} from './components/payments-table';

interface FeeStructureData {
  id: string;
  cohort_id: string;
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  one_shot_discount_percentage: number;
  is_setup_complete: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentsTableProps {
  students: StudentPaymentSummary[];
  onStudentSelect: (student: StudentPaymentSummary) => void;
  feeStructure?: FeeStructureData;
  selectedRows?: Set<string>;
  onRowSelection?: (studentId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  onExportSelected?: () => void;
  onVerificationUpdate?: () => void;
  onPendingCountUpdate?: () => void;
  // Pagination props
  pageSize?: number;
  showPagination?: boolean;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  students,
  onStudentSelect,
  feeStructure,
  selectedRows = new Set(),
  onRowSelection,
  onSelectAll,
  onExportSelected,
  onVerificationUpdate,
  onPendingCountUpdate,
  pageSize = 25,
  showPagination = true,
}) => {
  const {
    searchTerm,
    statusFilter,
    planFilter,
    scholarshipFilter,
    filteredStudents,
    setSearchTerm,
    setStatusFilter,
    setPlanFilter,
    setScholarshipFilter,
  } = usePaymentsTable({ students });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / currentPageSize);
  const startIndex = currentPage * currentPageSize;
  const endIndex = startIndex + currentPageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter, planFilter, scholarshipFilter]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setCurrentPageSize(Number(newPageSize));
    setCurrentPage(0);
  };

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <TableFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        planFilter={planFilter}
        scholarshipFilter={scholarshipFilter}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onPlanFilterChange={setPlanFilter}
        onScholarshipFilterChange={setScholarshipFilter}
      />

      {/* Table */}
      <div className='border rounded-lg'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>
                {onSelectAll && (
                  <Checkbox
                    checked={
                      selectedRows.size === filteredStudents.length &&
                      filteredStudents.length > 0
                    }
                    onCheckedChange={checked => onSelectAll(checked as boolean)}
                    aria-label='Select all students'
                  />
                )}
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.map(student => (
              <PaymentsTableRow
                key={student.student_id}
                student={student}
                selectedRows={selectedRows}
                onStudentSelect={onStudentSelect}
                onRowSelection={onRowSelection}
                feeStructure={feeStructure}
                onVerificationUpdate={onVerificationUpdate}
                onPendingCountUpdate={onPendingCountUpdate}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-muted-foreground'>
            No students found matching the criteria
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {showPagination && filteredStudents.length > 0 && (
        <div className='flex items-center justify-between px-2 py-4'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm text-muted-foreground'>
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
            </p>
            <div className='flex items-center space-x-2'>
              <p className='text-sm text-muted-foreground'>Rows per page:</p>
              <Select
                value={currentPageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className='w-20'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='25'>25</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                  <SelectItem value='100'>100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className='h-4 w-4' />
              Previous
            </Button>

            <div className='flex items-center space-x-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i;
                } else if (currentPage < 3) {
                  pageNumber = i;
                } else if (currentPage >= totalPages - 3) {
                  pageNumber = totalPages - 5 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handlePageChange(pageNumber)}
                    className='w-8 h-8 p-0'
                  >
                    {pageNumber + 1}
                  </Button>
                );
              })}
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
