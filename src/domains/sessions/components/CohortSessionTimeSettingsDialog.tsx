import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Clock, Trash2, Edit2, Check, X } from 'lucide-react';
import {
  cohortSettingsService,
  CohortSessionTimeDefault,
} from '@/services/cohortSettingsService';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cohortId: string;
  sessionsPerDay: number;
}

export const CohortSessionTimeSettingsDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  cohortId,
  sessionsPerDay,
}) => {
  const [rows, setRows] = React.useState<CohortSessionTimeDefault[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [originalRows, setOriginalRows] = React.useState<
    CohortSessionTimeDefault[]
  >([]);

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const defaults =
          await cohortSettingsService.getDefaultSessionTimes(cohortId);
        const map: Record<number, CohortSessionTimeDefault> = {};
        for (const d of defaults) map[d.sessionNumber] = d;
        const next: CohortSessionTimeDefault[] = Array.from(
          { length: sessionsPerDay },
          (_, i) => {
            const n = i + 1;
            return map[n] || { sessionNumber: n, start: '', end: '' };
          }
        );
        setRows(next);
        setOriginalRows([...next]);

        // Check if any session has configured times
        const hasConfiguredTimes = next.some(row => row.start && row.end);
        // Open in edit mode if no times are configured, otherwise view mode
        setIsEditing(!hasConfiguredTimes);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, cohortId, sessionsPerDay]);

  const updateCell = (idx: number, key: 'start' | 'end', value: string) => {
    setRows(prev =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    );
  };

  const removeSession = (idx: number) => {
    if (rows.length <= 1) return; // Keep at least one session
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setRows([...originalRows]);
    setIsEditing(false);
  };

  const onSave = async () => {
    setLoading(true);
    try {
      const sanitized = rows
        .filter(r => r.start && r.end)
        .map(r => ({
          sessionNumber: r.sessionNumber,
          start: r.start,
          end: r.end,
        }));
      await cohortSettingsService.setDefaultSessionTimes(cohortId, sanitized);
      setOriginalRows([...rows]);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return 'Not set';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5 text-blue-600' />
            Session Time Defaults
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            {isEditing
              ? 'Set default start and end times for each session slot. These will be automatically applied when creating new sessions.'
              : 'Current default session times. Click Edit to modify these settings.'}
          </div>

          <div className='space-y-3'>
            {rows.map((r, i) => (
              <Card
                key={r.sessionNumber}
                className='p-4 border border-gray-200 hover:border-blue-300 transition-colors'
              >
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                      <span className='text-sm font-semibold text-blue-700'>
                        {r.sessionNumber}
                      </span>
                    </div>
                    <Label className='text-sm font-medium'>
                      Session {r.sessionNumber}
                    </Label>
                  </div>

                  <div className='flex items-center gap-3 flex-1'>
                    {isEditing ? (
                      <>
                        <div className='flex-1'>
                          <Label
                            htmlFor={`start-${i}`}
                            className='text-xs text-muted-foreground'
                          >
                            Start Time
                          </Label>
                          <Input
                            id={`start-${i}`}
                            type='time'
                            value={r.start}
                            onChange={e =>
                              updateCell(i, 'start', e.target.value)
                            }
                            className='mt-1'
                          />
                        </div>

                        <div className='flex items-center justify-center mt-6'>
                          <div className='w-2 h-0.5 bg-gray-300'></div>
                        </div>

                        <div className='flex-1'>
                          <Label
                            htmlFor={`end-${i}`}
                            className='text-xs text-muted-foreground'
                          >
                            End Time
                          </Label>
                          <Input
                            id={`end-${i}`}
                            type='time'
                            value={r.end}
                            onChange={e => updateCell(i, 'end', e.target.value)}
                            className='mt-1'
                          />
                        </div>

                        {rows.length > 1 && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeSession(i)}
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground mb-1'>
                            Start Time
                          </div>
                          <div className='text-sm font-medium text-foreground'>
                            {formatTime(r.start)}
                          </div>
                        </div>

                        <div className='flex items-end justify-center pb-1'>
                          <div className='w-2 h-0.5 bg-muted-foreground'></div>
                        </div>

                        <div className='flex-1'>
                          <div className='text-xs text-muted-foreground mb-1'>
                            End Time
                          </div>
                          <div className='text-sm font-medium text-foreground'>
                            {formatTime(r.end)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          {isEditing ? (
            <>
              <Button
                variant='outline'
                onClick={cancelEditing}
                disabled={loading}
              >
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={loading}
                className='bg-blue-600 hover:bg-blue-700'
              >
                <Check className='h-4 w-4 mr-2' />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={startEditing}
                className='flex items-center gap-2'
              >
                <Edit2 className='h-4 w-4' />
                Edit
              </Button>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
