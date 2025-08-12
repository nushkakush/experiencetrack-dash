import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface AddScholarshipButtonProps {
  onAdd: () => void;
  disabled?: boolean;
}

export const AddScholarshipButton: React.FC<AddScholarshipButtonProps> = ({
  onAdd,
  disabled = false
}) => {
  return (
    <div className="text-center">
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Scholarship
      </Button>
    </div>
  );
};
