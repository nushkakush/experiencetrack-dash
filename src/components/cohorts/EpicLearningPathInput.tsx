import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EpicLearningPathsService } from '@/services/epicLearningPaths.service';
import { EpicsService } from '@/services/epics.service';
import type { EpicLearningPath } from '@/types/epicLearningPath';
import type { Epic } from '@/types/epic';
import type { NewEpicInput } from '@/types/cohort';

interface EpicLearningPathInputProps {
  value?: {
    epicLearningPathId?: string;
    epics?: NewEpicInput[];
  };
  onChange: (value: {
    epicLearningPathId?: string;
    epics?: NewEpicInput[];
  }) => void;
}

export default function EpicLearningPathInput({
  value,
  onChange,
}: EpicLearningPathInputProps) {
  const [epicLearningPaths, setEpicLearningPaths] = useState<
    EpicLearningPath[]
  >([]);
  const [selectedPath, setSelectedPath] = useState<EpicLearningPath | null>(
    null
  );
  const [pathEpics, setPathEpics] = useState<Epic[]>([]);
  const [epicsWithDuration, setEpicsWithDuration] = useState<NewEpicInput[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Load available Epic Learning Paths
  useEffect(() => {
    const loadEpicLearningPaths = async () => {
      try {
        const { data } = await EpicLearningPathsService.getEpicLearningPaths();
        setEpicLearningPaths(data);

        // If there's a pre-selected path, load it
        if (value?.epicLearningPathId) {
          const path = data.find(p => p.id === value.epicLearningPathId);
          if (path) {
            setSelectedPath(path);
            await loadEpicsFromPath(path);
          }
        }
      } catch (error) {
        console.error('Failed to load epic learning paths:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEpicLearningPaths();
  }, [value?.epicLearningPathId]);

  // Load epics from selected path
  const loadEpicsFromPath = async (path: EpicLearningPath) => {
    try {
      if (path.epics.length === 0) {
        setPathEpics([]);
        setEpicsWithDuration([]);
        return;
      }

      // Get epic details from the database
      const epicIds = path.epics.map(e => e.id);
      const { data: epics } = await EpicsService.getEpics({});
      const pathEpicsData = epics
        .filter(epic => epicIds.includes(epic.id))
        .sort((a, b) => {
          const aOrder = path.epics.find(e => e.id === a.id)?.order || 0;
          const bOrder = path.epics.find(e => e.id === b.id)?.order || 0;
          return aOrder - bOrder;
        });

      setPathEpics(pathEpicsData);

      // Create NewEpicInput format with default duration
      const newEpicsWithDuration = pathEpicsData.map((epic, index) => ({
        epic_id: epic.id,
        duration_months: value?.epics?.[index]?.duration_months || 1,
      }));

      setEpicsWithDuration(newEpicsWithDuration);

      // Update parent component
      onChange({
        epicLearningPathId: path.id,
        epics: newEpicsWithDuration,
      });
    } catch (error) {
      console.error('Failed to load epics from path:', error);
    }
  };

  const handlePathSelection = async (pathId: string) => {
    const path = epicLearningPaths.find(p => p.id === pathId);
    if (path) {
      setSelectedPath(path);
      await loadEpicsFromPath(path);
    }
  };

  const handleDurationChange = (index: number, duration: number) => {
    const updatedEpics = [...epicsWithDuration];
    updatedEpics[index] = {
      ...updatedEpics[index],
      duration_months: duration,
    };
    setEpicsWithDuration(updatedEpics);

    onChange({
      epicLearningPathId: selectedPath?.id,
      epics: updatedEpics,
    });
  };

  if (loading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-4 w-48' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Epic Learning Path Selection */}
      <div className='space-y-2'>
        <Label>Epic Learning Path</Label>
        <Select
          value={selectedPath?.id || ''}
          onValueChange={handlePathSelection}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select an Epic Learning Path' />
          </SelectTrigger>
          <SelectContent>
            {epicLearningPaths.map(path => (
              <SelectItem key={path.id} value={path.id}>
                {path.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Path Description */}
      {selectedPath && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>{selectedPath.title}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {selectedPath.description && (
              <p className='text-sm text-muted-foreground'>
                {selectedPath.description}
              </p>
            )}

            {selectedPath.outcomes && selectedPath.outcomes.length > 0 && (
              <div>
                <h4 className='font-medium mb-2'>Learning Outcomes</h4>
                <ul className='text-sm text-muted-foreground space-y-1'>
                  {selectedPath.outcomes.slice(0, 3).map((outcome, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <span className='text-primary'>•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                  {selectedPath.outcomes.length > 3 && (
                    <li className='text-xs italic'>
                      ... and {selectedPath.outcomes.length - 3} more outcomes
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Epics from Selected Path */}
      {pathEpics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>
              Epics in this Learning Path
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Set the duration (in months) for each epic in the cohort
            </p>
          </CardHeader>
          <CardContent className='space-y-4'>
            {pathEpics.map((epic, index) => (
              <div
                key={epic.id}
                className='flex items-center gap-4 p-4 border rounded-lg'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Badge variant='outline'>#{index + 1}</Badge>
                    <h4 className='font-medium'>{epic.name}</h4>
                  </div>
                  {epic.description && (
                    <p className='text-sm text-muted-foreground'>
                      {epic.description}
                    </p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <Label htmlFor={`duration-${index}`} className='text-sm'>
                    Duration (months):
                  </Label>
                  <Input
                    id={`duration-${index}`}
                    type='number'
                    min={1}
                    value={epicsWithDuration[index]?.duration_months || 1}
                    onChange={e =>
                      handleDurationChange(index, Number(e.target.value) || 1)
                    }
                    className='w-20'
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
