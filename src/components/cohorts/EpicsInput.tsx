import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { NewEpicInput } from '@/types/cohort';
import { cn } from '@/lib/utils';
import { cohortsService } from '@/services/cohorts.service';

interface EpicsInputProps {
  value: NewEpicInput[];
  onChange: (epics: NewEpicInput[]) => void;
}

interface EpicOption {
  id: string;
  name: string;
}

export default function EpicsInput({ value, onChange }: EpicsInputProps) {
  const [items, setItems] = useState<NewEpicInput[]>(
    value?.length ? value : [{ duration_months: 1 }]
  );
  const [availableEpics, setAvailableEpics] = useState<EpicOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableEpics();
  }, []);

  const loadAvailableEpics = async () => {
    try {
      const response = await cohortsService.getAllEpics();
      if (response.success && response.data) {
        setAvailableEpics(response.data);
      }
    } catch (error) {
      console.error('Failed to load epics:', error);
    } finally {
      setLoading(false);
    }
  };

  const update = (next: NewEpicInput[]) => {
    setItems(next);
    onChange(next);
  };

  const addEpic = () => {
    update([...items, { duration_months: 1 }]);
  };

  const removeEpic = (index: number) => {
    update(items.filter((_, i) => i !== index));
  };

  const changeEpic = (index: number, patch: Partial<NewEpicInput>) => {
    const next = items.map((e, i) => (i === index ? { ...e, ...patch } : e));
    update(next);
  };

  const handleEpicSelection = (index: number, epicId: string) => {
    const selectedEpic = availableEpics.find(epic => epic.id === epicId);
    if (selectedEpic) {
      changeEpic(index, {
        epic_id: epicId,
        name: undefined, // Clear name when selecting existing epic
      });
    }
  };

  const handleNewEpicName = (index: number, name: string) => {
    changeEpic(index, {
      name,
      epic_id: undefined, // Clear epic_id when creating new epic
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm text-muted-foreground'>
          Epics in this cohort
        </Label>
        <Button type='button' variant='secondary' size='sm' onClick={addEpic}>
          <Plus className='h-4 w-4 mr-2' /> Add epic
        </Button>
      </div>
      <div className='max-h-96 overflow-y-auto space-y-3 pr-2'>
        {items.map((epic, idx) => (
          <div
            key={idx}
            className={cn(
              'grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-md border bg-card p-3'
            )}
          >
            <div className='md:col-span-7'>
              <Label className='text-xs text-muted-foreground'>Epic</Label>
              {epic.epic_id ? (
                // Show selected epic name
                <div className='flex items-center justify-between p-2 border rounded-md bg-muted'>
                  <span className='text-sm'>
                    {availableEpics.find(e => e.id === epic.epic_id)?.name ||
                      'Unknown Epic'}
                  </span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      changeEpic(idx, { epic_id: undefined, name: '' })
                    }
                    className='h-6 px-2'
                  >
                    Change
                  </Button>
                </div>
              ) : (
                // Show selection options
                <div className='space-y-2'>
                  <Select
                    value=''
                    onValueChange={value => {
                      if (value === 'new') {
                        changeEpic(idx, { name: '' });
                      } else if (value) {
                        handleEpicSelection(idx, value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select existing epic or create new' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='new'>➕ Create new epic</SelectItem>
                      {availableEpics.map(availableEpic => (
                        <SelectItem
                          key={availableEpic.id}
                          value={availableEpic.id}
                        >
                          {availableEpic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {epic.name !== undefined && (
                    <Input
                      placeholder='Enter new epic name'
                      value={epic.name}
                      onChange={e => handleNewEpicName(idx, e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
            <div className='md:col-span-3'>
              <Label className='text-xs text-muted-foreground'>
                Duration (months)
              </Label>
              <Input
                type='number'
                min={1}
                value={epic.duration_months}
                onChange={e =>
                  changeEpic(idx, {
                    duration_months: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className='md:col-span-2 flex justify-end'>
              <Button
                variant='ghost'
                size='icon'
                type='button'
                onClick={() => removeEpic(idx)}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className='text-sm text-muted-foreground'>
            No epics yet. Add at least one or keep it empty.
          </div>
        )}
      </div>
    </div>
  );
}
