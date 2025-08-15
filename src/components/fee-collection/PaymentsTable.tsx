import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { StudentPaymentSummary } from '@/types/fee';
import { 
  TableFilters, 
  TableRow as PaymentsTableRow, 
  usePaymentsTable 
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
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  students,
  onStudentSelect,
  feeStructure,
  selectedRows = new Set(),
  onRowSelection,
  onSelectAll,
  onExportSelected
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
    setScholarshipFilter
  } = usePaymentsTable({ students });

  return (
    <div className="space-y-4">
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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                {onSelectAll && (
                  <Checkbox
                    checked={selectedRows.size === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                    aria-label="Select all students"
                  />
                )}
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <PaymentsTableRow
                key={student.student_id}
                student={student}
                selectedRows={selectedRows}
                onStudentSelect={onStudentSelect}
                onRowSelection={onRowSelection}
                feeStructure={feeStructure}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No students found matching the criteria</p>
        </div>
      )}
    </div>
  );
};
