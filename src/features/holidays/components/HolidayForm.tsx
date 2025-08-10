import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import type { SelectedHoliday, Holiday } from '@/types/holiday';

interface HolidayFormProps {
  selectedDates: Date[];
  publishedHolidays: Holiday[];
  onAddHoliday: (holiday: SelectedHoliday) => void;
  onClearDates: () => void;
  onEditHoliday?: (holiday: Holiday) => void;
}

export const HolidayForm = ({ 
  selectedDates, 
  publishedHolidays, 
  onAddHoliday, 
  onClearDates,
  onEditHoliday
}: HolidayFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [existingHoliday, setExistingHoliday] = useState<Holiday | null>(null);

  // Check if any selected date has an existing published holiday
  useEffect(() => {
    if (selectedDates.length === 1) {
      const selectedDate = format(selectedDates[0], 'yyyy-MM-dd');
      const existing = publishedHolidays.find(holiday => holiday.date === selectedDate);
      setExistingHoliday(existing || null);
      
      if (existing) {
        setTitle(existing.title);
        setDescription(existing.description || '');
      } else {
        setTitle('');
        setDescription('');
      }
    } else if (selectedDates.length > 1) {
      // Check if any of the selected dates have existing holidays
      const existingDates = selectedDates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return publishedHolidays.find(holiday => holiday.date === dateStr);
      }).filter(Boolean);
      
      if (existingDates.length > 0) {
        setExistingHoliday(existingDates[0] as Holiday);
        setTitle('');
        setDescription('');
      } else {
        setExistingHoliday(null);
        setTitle('');
        setDescription('');
      }
    } else {
      setExistingHoliday(null);
      setTitle('');
      setDescription('');
    }
  }, [selectedDates, publishedHolidays]);

  const handleAddToList = () => {
    if (!title.trim()) {
      return;
    }

    selectedDates.forEach(date => {
      const holiday: SelectedHoliday = {
        id: `${date.getTime()}-${Math.random()}`,
        title: title.trim(),
        description: description.trim(),
        date: format(date, 'yyyy-MM-dd'),
      };
      onAddHoliday(holiday);
    });

    // Reset form
    setTitle('');
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

        {existingHoliday && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {selectedDates.length === 1 ? (
                <>
                  This date already has a published holiday: <strong>{existingHoliday.title}</strong>
                  <Badge variant="secondary" className="ml-2">Published</Badge>
                </>
              ) : (
                <>
                  One or more selected dates have existing holidays. You cannot add new holidays to dates that already have published holidays.
                  <Badge variant="secondary" className="ml-2">Published</Badge>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Holiday Name *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Independence Day"
            disabled={existingHoliday !== null}
          />
          {existingHoliday && (
            <p className="text-xs text-muted-foreground">
              This field is disabled because a holiday already exists for this date
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details about this holiday..."
            rows={3}
            disabled={existingHoliday !== null}
          />
          {existingHoliday && (
            <p className="text-xs text-muted-foreground">
              This field is disabled because a holiday already exists for this date
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!existingHoliday && (
            <Button 
              onClick={handleAddToList} 
              disabled={!title.trim()}
            >
              Add to List
            </Button>
          )}
          {existingHoliday && onEditHoliday && (
            <Button 
              variant="outline"
              onClick={() => onEditHoliday(existingHoliday)}
            >
              Edit Holiday
            </Button>
          )}
          <Button variant="outline" onClick={onClearDates}>
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
