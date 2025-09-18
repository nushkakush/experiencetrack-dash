import { useMemo, useState, useEffect } from 'react';
import { addMonths, formatISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cohortsService } from '@/services/cohorts.service';
import { NewCohortInput, NewEpicInput } from '@/types/cohort';
import EpicLearningPathInput from './EpicLearningPathInput';
import { cn } from '@/lib/utils';

function toISODate(date: Date) {
  // Check if the date is valid before formatting
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided to toISODate');
  }
  return formatISO(date, { representation: 'date' });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface CohortWizardProps {
  onCreated?: () => void;
  onClose?: () => void;
}

export default function CohortWizard({
  onCreated,
  onClose,
}: CohortWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [checkingId, setCheckingId] = useState<boolean>(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);

  const [name, setName] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [startDate, setStartDate] = useState(toISODate(new Date()));
  const [duration, setDuration] = useState(6);
  const [endDate, setEndDate] = useState(toISODate(addMonths(new Date(), 6)));
  const [description, setDescription] = useState('');
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const [maxStudents, setMaxStudents] = useState(50);
  const [epicLearningData, setEpicLearningData] = useState<{
    epicLearningPathId?: string;
    epics?: NewEpicInput[];
  }>({});

  // Track if end date has been manually edited
  const [isEndDateManuallyEdited, setIsEndDateManuallyEdited] = useState(false);

  useMemo(() => {
    const auto = slugify(name || 'cohort');
    const rnd = Math.floor(100 + Math.random() * 900);
    if (!cohortId) {
      setCohortId(`${auto}-${rnd}`);
    }
  }, [name]); // eslint-disable-line

  // Auto-calculate end date when start date or duration changes (only if not manually edited)
  useEffect(() => {
    if (!isEndDateManuallyEdited && startDate) {
      const startDateObj = new Date(startDate);
      // Check if the date is valid before processing
      if (!isNaN(startDateObj.getTime())) {
        const newEnd = addMonths(startDateObj, Number(duration) || 1);
        setEndDate(toISODate(newEnd));
      }
    }
  }, [startDate, duration, isEndDateManuallyEdited]);

  // Reset manual edit flag when start date or duration changes
  useEffect(() => {
    setIsEndDateManuallyEdited(false);
  }, [startDate, duration]);

  const handleEndDateChange = (value: string) => {
    // Only update if the value is a valid date string or empty
    if (value === '' || !isNaN(new Date(value).getTime())) {
      setEndDate(value);
      setIsEndDateManuallyEdited(true);
    }
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    setIsEndDateManuallyEdited(false); // Reset flag when duration changes
  };

  const handleStartDateChange = (value: string) => {
    // Only update if the value is a valid date string or empty
    if (value === '' || !isNaN(new Date(value).getTime())) {
      setStartDate(value);
      setIsEndDateManuallyEdited(false); // Reset flag when start date changes
    }
  };

  const validateStep1 = async () => {
    if (!name.trim()) {
      toast.error('Please enter a cohort name.');
      return false;
    }
    if (!cohortId.trim()) {
      toast.error('Cohort ID is required.');
      return false;
    }
    if (!maxStudents || maxStudents < 1) {
      toast.error('Maximum students must be at least 1.');
      return false;
    }
    if (maxStudents > 1000) {
      toast.error('Maximum students cannot exceed 1000.');
      return false;
    }

    // Validate that end date is after start date
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (endDateObj <= startDateObj) {
      toast.error('End date must be after start date.');
      return false;
    }

    setCheckingId(true);
    const unique = await cohortsService.isCohortIdUnique(cohortId.trim());
    setCheckingId(false);
    setIdAvailable(unique);
    if (!unique) {
      toast.error('Cohort ID is already taken. Please choose a different one.');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    const input: NewCohortInput = {
      name: name.trim(),
      cohort_id: cohortId.trim(),
      start_date: startDate,
      duration_months: Number(duration) || 1,
      end_date: endDate,
      description: description.trim(),
      sessions_per_day: Number(sessionsPerDay) || 1,
      max_students: Number(maxStudents) || 50,
      epic_learning_path_id: epicLearningData.epicLearningPathId,
    };

    const filteredEpics = (epicLearningData.epics || []).filter(
      e =>
        (e.epic_id || (e.name && e.name.trim())) &&
        (Number(e.duration_months) || 0) > 0
    );

    const res = await cohortsService.createWithEpics(input, filteredEpics);
    if (res.success) {
      toast.success('Cohort created successfully!');
      onCreated?.();
      onClose?.();
    } else {
      toast.error(res.error || 'Failed to create cohort. Please try again.');
      console.error('Cohort creation failed:', res.error);
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold'>Create Cohort</h2>
        <p className='text-muted-foreground'>
          Set up a cohort and its epics in two quick steps.
        </p>
      </div>

      <div className='mb-6'>
        <div className='flex items-center gap-2 text-sm'>
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              step === 1 ? 'bg-primary' : 'bg-muted'
            )}
          />
          <span
            className={cn(
              step === 1 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Step 1: Cohort details
          </span>
          <Separator orientation='vertical' className='mx-2' />
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              step === 2 ? 'bg-primary' : 'bg-muted'
            )}
          />
          <span
            className={cn(
              step === 2 ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Step 2: Epics
          </span>
        </div>
      </div>

      {step === 1 && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Cohort name</Label>
            <Input
              placeholder='e.g. Full Stack Web Dev - 2025'
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Cohort ID</Label>
            <Input
              placeholder='auto-generated (editable)'
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              onBlur={async () => {
                if (cohortId.trim()) {
                  setCheckingId(true);
                  const unique = await cohortsService.isCohortIdUnique(
                    cohortId.trim()
                  );
                  setCheckingId(false);
                  setIdAvailable(unique);
                }
              }}
            />
            {checkingId && (
              <p className='text-xs text-muted-foreground'>
                Checking availability...
              </p>
            )}
            {idAvailable === false && (
              <p className='text-xs text-destructive'>
                This ID is already taken.
              </p>
            )}
            {idAvailable === true && (
              <p className='text-xs text-emerald-500'>This ID is available.</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label>Start date</Label>
            <Input
              type='date'
              value={startDate}
              onChange={e => handleStartDateChange(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Duration (months)</Label>
            <Input
              type='number'
              min={1}
              value={duration}
              onChange={e => handleDurationChange(Number(e.target.value) || 1)}
            />
          </div>
          <div className='space-y-2'>
            <Label>End date</Label>
            <Input
              type='date'
              value={endDate}
              onChange={e => handleEndDateChange(e.target.value)}
            />
            {isEndDateManuallyEdited ? (
              <p className='text-xs text-muted-foreground'>Manually edited</p>
            ) : (
              <p className='text-xs text-muted-foreground'>
                Auto-calculated from duration
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label>Sessions per day</Label>
            <Input
              type='number'
              min={1}
              value={sessionsPerDay}
              onChange={e => setSessionsPerDay(Number(e.target.value) || 1)}
            />
          </div>
          <div className='space-y-2'>
            <Label>Maximum students</Label>
            <Input
              type='number'
              min={1}
              value={maxStudents}
              onChange={e => setMaxStudents(Number(e.target.value) || 50)}
              placeholder='Enter maximum number of students'
            />
          </div>
          <div className='md:col-span-2 space-y-2'>
            <Label>Description</Label>
            <Textarea
              placeholder='Describe the cohort...'
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className='md:col-span-2 flex items-center justify-end gap-2 pt-2'>
            <Button variant='secondary' onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (await validateStep1()) setStep(2);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className='space-y-6'>
          <EpicLearningPathInput
            value={epicLearningData}
            onChange={setEpicLearningData}
          />
          <div className='flex items-center justify-between'>
            <Button variant='ghost' onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleCreate}>Create cohort</Button>
          </div>
        </div>
      )}
    </div>
  );
}
