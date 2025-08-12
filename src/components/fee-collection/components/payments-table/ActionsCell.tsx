import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Mail } from 'lucide-react';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummary } from '@/types/fee';

interface ActionsCellProps {
  student: StudentPaymentSummary;
  onStudentSelect: (student: StudentPaymentSummary) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({ student, onStudentSelect }) => {
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onStudentSelect(student);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement send communication
          }}
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  );
};
