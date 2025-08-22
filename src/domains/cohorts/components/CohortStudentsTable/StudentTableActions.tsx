/**
 * Student Table Actions Component
 * Bulk actions and table-level operations
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, MoreHorizontal, Mail, FileText, Users } from 'lucide-react';

interface StudentTableActionsProps {
  selectedCount: number;
  totalCount: number;
  onExportSelected?: () => void;
  onExportAll?: () => void;
  onBulkEmail?: () => void;
  onGenerateReport?: () => void;
  disabled?: boolean;
}

export const StudentTableActions: React.FC<StudentTableActionsProps> = React.memo(({
  selectedCount,
  totalCount,
  onExportSelected,
  onExportAll,
  onBulkEmail,
  onGenerateReport,
  disabled = false,
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center space-x-2">
      {/* Quick Export Button */}
      {onExportAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExportAll}
          disabled={disabled}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      )}

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onExportAll && (
            <DropdownMenuItem onClick={onExportAll}>
              <Download className="mr-2 h-4 w-4" />
              Export All ({totalCount})
            </DropdownMenuItem>
          )}
          
          {hasSelection && onExportSelected && (
            <DropdownMenuItem onClick={onExportSelected}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected ({selectedCount})
            </DropdownMenuItem>
          )}
          
          {hasSelection && onBulkEmail && (
            <DropdownMenuItem onClick={onBulkEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email Selected ({selectedCount})
            </DropdownMenuItem>
          )}
          
          {onGenerateReport && (
            <DropdownMenuItem onClick={onGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

StudentTableActions.displayName = 'StudentTableActions';
