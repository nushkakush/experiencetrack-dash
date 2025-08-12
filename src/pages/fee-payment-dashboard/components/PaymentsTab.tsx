import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PaymentsTable } from '@/components/fee-collection/PaymentsTable';
import { StudentPaymentDetails } from '@/components/fee-collection/StudentPaymentDetails';
import { StudentPaymentSummary } from '@/types/fee';

interface PaymentsTabProps {
  students: StudentPaymentSummary[];
  selectedStudent: StudentPaymentSummary | null;
  selectedRows: Set<string>;
  feeStructure: any;
  onStudentSelect: (student: StudentPaymentSummary) => void;
  onCloseStudentDetails: () => void;
  onRowSelection: (studentId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onExportSelected: () => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  students,
  selectedStudent,
  selectedRows,
  feeStructure,
  onStudentSelect,
  onCloseStudentDetails,
  onRowSelection,
  onSelectAll,
  onExportSelected
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onExportSelected}
          disabled={selectedRows.size === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Selected ({selectedRows.size})
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Payments Table */}
        <div className="flex-1">
          <PaymentsTable
            students={students}
            onStudentSelect={onStudentSelect}
            selectedStudent={selectedStudent}
            feeStructure={feeStructure}
            selectedRows={selectedRows}
            onRowSelection={onRowSelection}
            onSelectAll={onSelectAll}
          />
        </div>

        {/* Student Details Sidebar */}
        {selectedStudent && (
          <StudentPaymentDetails
            student={selectedStudent}
            onClose={onCloseStudentDetails}
          />
        )}
      </div>
    </div>
  );
};
