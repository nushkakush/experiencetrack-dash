import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SelectedHoliday } from '@/types/holiday';

interface HolidayFormProps {
  selectedDates: Date[];
  onAddHoliday: (holiday: SelectedHoliday) => void;
  onClearDates: () => void;
}

export const HolidayForm = ({ selectedDates, onAddHoliday, onClearDates }: HolidayFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddToList = () => {
    if (!name.trim()) {
      return;
    }

    selectedDates.forEach(date => {
      const holiday: SelectedHoliday = {
        id: `${date.getTime()}-${Math.random()}`,
        name: name.trim(),
        description: description.trim(),
        date: format(date, 'yyyy-MM-dd'),
        isRecurring: false,
      };
      onAddHoliday(holiday);
    });

    // Reset form
    setName('');
    setDescription('');
    onClearDates();
  };

  if (selectedDates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add Holiday Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Selected dates: {selectedDates.map(date => format(date, 'MMM d, yyyy')).join(', ')}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Holiday Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
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

        <div className="flex gap-2">
          <Button onClick={handleAddToList} disabled={!name.trim()}>
            Add to List
          </Button>
          <Button variant="outline" onClick={onClearDates}>
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
