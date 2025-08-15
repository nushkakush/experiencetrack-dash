import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentPaymentSummary } from '@/types/fee';
import { exportPaymentData } from '@/utils/exportUtils';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentPaymentSummary[];
  selectedRows: Set<string>;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  students,
  selectedRows,
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'selected' | 'all' | 'filtered'>('selected');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [customFilename, setCustomFilename] = useState('');

  const getFilteredStudents = () => {
    let filteredStudents = students;

    // Apply scope filter
    if (exportScope === 'selected') {
      filteredStudents = students.filter(student => selectedRows.has(student.student_id));
    } else if (exportScope === 'filtered') {
      // Apply status filter
      if (statusFilter !== 'all') {
        filteredStudents = filteredStudents.filter(student => {
          const status = getStudentStatus(student);
          return status.toLowerCase().includes(statusFilter.toLowerCase());
        });
      }

      // Apply plan filter
      if (planFilter !== 'all') {
        filteredStudents = filteredStudents.filter(student => 
          student.payment_plan === planFilter
        );
      }
    }

    return filteredStudents;
  };

  const getStudentStatus = (student: StudentPaymentSummary): string => {
    if (!student.payments || student.payments.length === 0) {
      return 'Payment Setup Required';
    }

    const totalPayments = student.payments.length;
    const completedPayments = student.payments.filter(p => p.status === 'paid').length;
    const pendingPayments = student.payments.filter(p => p.status === 'pending').length;

    if (completedPayments === totalPayments) {
      return 'All Payments Complete';
    } else if (completedPayments > 0) {
      return `${completedPayments}/${totalPayments} Paid`;
    } else {
      return `${pendingPayments} Pending`;
    }
  };

  const handleExport = () => {
    const studentsToExport = getFilteredStudents();
    
    if (studentsToExport.length === 0) {
      toast.error('No students match the selected criteria');
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = customFilename || `payment_data_${timestamp}`;
      
      exportPaymentData(studentsToExport, { 
        format: exportFormat,
        includeHeaders,
        filename
      });
      
      toast.success(`Successfully exported ${studentsToExport.length} student(s) as ${exportFormat.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const filteredStudents = getFilteredStudents();
  const availableStatuses = Array.from(new Set(students.map(getStudentStatus)));
  const availablePlans = Array.from(new Set(students.map(s => s.payment_plan).filter(Boolean)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Payment Data</DialogTitle>
          <DialogDescription>
            Choose export options and filters for your payment data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                <SelectItem value="json">JSON (Structured data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Scope */}
          <div className="space-y-2">
            <Label>Export Scope</Label>
            <Select value={exportScope} onValueChange={(value: 'selected' | 'all' | 'filtered') => setExportScope(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Selected Students ({selectedRows.size})</SelectItem>
                <SelectItem value="all">All Students ({students.length})</SelectItem>
                <SelectItem value="filtered">Filtered Students</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters (only show when scope is filtered) */}
          {exportScope === 'filtered' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Plan Filter</Label>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {availablePlans.map(plan => (
                      <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            <Label>Export Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeHeaders"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
              />
              <Label htmlFor="includeHeaders">Include column headers</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Custom Filename (optional)</Label>
              <input
                id="filename"
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="payment_data_2025-08-15"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Students to export: {filteredStudents.length}</p>
              <p>Filename: {customFilename || `payment_data_${new Date().toISOString().split('T')[0]}.${exportFormat}`}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={filteredStudents.length === 0}>
            Export ({filteredStudents.length} students)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
