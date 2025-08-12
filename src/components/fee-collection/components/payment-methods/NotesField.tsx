import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NotesFieldProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

export const NotesField: React.FC<NotesFieldProps> = ({
  notes,
  onNotesChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes" className="text-left block">Additional Notes</Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Any additional information about this payment..."
        rows={3}
      />
    </div>
  );
};
