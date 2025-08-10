import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SelectedHoliday, Holiday } from '@/types/holiday';

interface HolidayFormProps {
  selectedDates: Date[];
  publishedHolidays: Holiday[];
  existingDraftHolidays: Holiday[];
  onAddHoliday: (holiday: SelectedHoliday) => void;
  onClearDates: () => void;
  onEditHoliday?: (holiday: Holiday) => void;
}

export const HolidayForm = ({ 
  selectedDates, 
  onAddHoliday, 
  onClearDates
}: HolidayFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAddToList = () => {
    if (!title.trim() || selectedDates.length === 0) {
      return;
    }

    const date = selectedDates[0];
    const holiday: SelectedHoliday = {
      id: `${date.getTime()}-${Math.random()}`,
      title: title.trim(),
      description: description.trim(),
      date: format(date, 'yyyy-MM-dd'),
    };
    
    onAddHoliday(holiday);

    // Reset form
    setTitle('');
    setDescription('');
    onClearDates();
  };

  if (selectedDates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Holiday Name *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Independence Day"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (Optional)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about this holiday..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          onClick={handleAddToList} 
          disabled={!title.trim()}
          className="flex-1"
        >
          Add to Draft
        </Button>
        <Button variant="outline" onClick={onClearDates}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
