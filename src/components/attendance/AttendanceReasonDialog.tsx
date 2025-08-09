import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CohortStudent, AbsenceType } from '@/types/attendance';

interface AttendanceReasonDialogProps {
  open: boolean;
  student: CohortStudent | null;
  status: 'absent' | 'late';
  reason: string;
  absenceType: AbsenceType;
  processing: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onAbsenceTypeChange: (type: AbsenceType) => void;
  onConfirm: () => void;
}

export const AttendanceReasonDialog: React.FC<AttendanceReasonDialogProps> = ({
  open,
  student,
  status,
  reason,
  absenceType,
  processing,
  onOpenChange,
  onReasonChange,
  onAbsenceTypeChange,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Mark {student?.first_name} {student?.last_name} as {status}
          </DialogTitle>
          <DialogDescription>
            Please provide additional details for this {status} status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={absenceType} onValueChange={onAbsenceTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informed">Informed</SelectItem>
                <SelectItem value="uninformed">Uninformed</SelectItem>
                {status === 'absent' && (
                  <SelectItem value="exempted">Exempted</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {absenceType !== 'uninformed' && (
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder={`Please provide a reason for the ${status} status...`}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={processing}>
            {processing ? 'Confirming...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
