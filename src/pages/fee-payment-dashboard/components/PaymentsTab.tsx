import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PaymentsTable } from '@/components/fee-collection/PaymentsTable';
import { ExportDialog } from '@/components/fee-collection/ExportDialog';
import { StudentPaymentSummary } from '@/types/fee';

interface PaymentsTabProps {
  students: StudentPaymentSummary[];
  selectedRows: Set<string>;
  feeStructure: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onStudentSelect: (student: StudentPaymentSummary) => void;
  onCloseStudentDetails: () => void;
  onRowSelection: (studentId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onExportSelected: (students: StudentPaymentSummary[]) => void;
}

export const PaymentsTab: React.FC<PaymentsTabProps> = ({
  students,
  selectedRows,
  feeStructure,
  onStudentSelect,
  onCloseStudentDetails,
  onRowSelection,
  onSelectAll,
  onExportSelected
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Payments</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExportDialogOpen(true)}
            disabled={students.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <PaymentsTable
          students={students}
          onStudentSelect={onStudentSelect}
          feeStructure={feeStructure}
          selectedRows={selectedRows}
          onRowSelection={onRowSelection}
          onSelectAll={onSelectAll}
        />
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        students={students}
        selectedRows={selectedRows}
      />
    </div>
  );
};
