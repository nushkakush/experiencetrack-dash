import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SessionType } from '@/domains/sessions/types';
import { toast } from 'sonner';
import { CBLBoundaryService } from '@/services/cblBoundaryService';
import { cohortSettingsService } from '@/services/cohortSettingsService';
import type { PlannedSession } from '@/services/sessionPlanningService';

// Dynamic session type options based on context
const getSessionTypeOptions = (
  isBetweenCBLSet: boolean,
  isBetweenMockChallenge: boolean
) => {
  if (isBetweenMockChallenge) {
    // Between Mock Challenge boundaries - show only regular types (no CBL types)
    return [
      {
        value: 'masterclass',
        label: 'Masterclass',
        description: 'Expert-led learning session',
      },
      {
        value: 'workshop',
        label: 'Workshop',
        description: 'Hands-on practical session',
      },
      {
        value: 'gap',
        label: 'GAP Session',
        description: 'Gap analysis and planning',
      },
    ];
  } else if (isBetweenCBLSet) {
    // Between regular CBL set boundaries - show individual CBL types + regular types
    return [
      {
        value: 'learn',
        label: 'Learn Session',
        description: 'Individual learning session',
      },
      {
        value: 'innovate',
        label: 'Innovate Session',
        description: 'Individual innovation session',
      },
      {
        value: 'transform',
        label: 'Transform Session',
        description: 'Individual transformation session',
      },
      {
        value: 'masterclass',
        label: 'Masterclass',
        description: 'Expert-led learning session',
      },
      {
        value: 'workshop',
        label: 'Workshop',
        description: 'Hands-on practical session',
      },
      {
        value: 'gap',
        label: 'GAP Session',
        description: 'Gap analysis and planning',
      },
    ];
  } else {
    // Outside any boundaries - show CBL challenge + Mock Challenge + regular types
    return [
      {
        value: 'cbl',
        label: 'CBL Challenge',
        description: 'Challenge-Based Learning (3 grouped sessions)',
      },
      {
        value: 'mock_challenge',
        label: 'Mock Challenge',
        description: 'Mock Challenge (2 grouped sessions)',
      },
      {
        value: 'masterclass',
        label: 'Masterclass',
        description: 'Expert-led learning session',
      },
      {
        value: 'workshop',
        label: 'Workshop',
        description: 'Hands-on practical session',
      },
      {
        value: 'gap',
        label: 'GAP Session',
        description: 'Gap analysis and planning',
      },
    ];
  }
};

export interface PlanSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    sessionType: SessionType,
    title: string,
    startTime?: string,
    endTime?: string
  ) => void;
  selectedDate: Date;
  sessionNumber: number;
  cohortId: string;
  epicId: string;
  sessionsPerDay: number;
  userId: string;
  plannedSessions: PlannedSession[]; // Add this for boundary detection
}

export const PlanSessionModal: React.FC<PlanSessionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  sessionNumber,
  cohortId,
  epicId,
  sessionsPerDay,
  userId,
  plannedSessions,
}) => {
  const [selectedSessionType, setSelectedSessionType] =
    useState<SessionType | null>(null);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [boundaryInfo, setBoundaryInfo] = useState({
    isBetweenCBLSet: false,
    cblChallengeTitle: null,
    availableSessionTypes: [],
    isMockChallenge: false,
  });

  // Detect CBL boundaries to determine available session types
  useEffect(() => {
    const detectBoundaries = async () => {
      try {
        const info = await CBLBoundaryService.detectCBLBoundaries(
          selectedDate,
          sessionNumber,
          plannedSessions,
          cohortId,
          epicId
        );
        setBoundaryInfo(info);
      } catch (error) {
        console.error('Error detecting CBL boundaries:', error);
        setBoundaryInfo({
          isBetweenCBLSet: false,
          cblChallengeTitle: null,
          availableSessionTypes: [],
          isMockChallenge: false,
        });
      }
    };

    if (isOpen) {
      detectBoundaries();
    }
  }, [isOpen, selectedDate, sessionNumber, plannedSessions, cohortId, epicId]);

  // Detect if we're within a mock challenge boundary
  const isBetweenMockChallenge =
    boundaryInfo.isBetweenCBLSet && boundaryInfo.isMockChallenge;

  // Get dynamic session type options based on context
  const sessionTypeOptions = getSessionTypeOptions(
    boundaryInfo.isBetweenCBLSet,
    isBetweenMockChallenge
  );

  // Load cohort defaults and ensure fresh form on every open
  useEffect(() => {
    if (isOpen) {
      setSelectedSessionType(null);
      setTitle('');
      setIsCreating(false);

      // Load cohort defaults for this session number
      const loadDefaults = async () => {
        try {
          const defaults =
            await cohortSettingsService.getDefaultSessionTimes(cohortId);
          const slotDefault = defaults.find(
            d => d.sessionNumber === sessionNumber
          );
          if (slotDefault) {
            setStartTime(slotDefault.start);
            setEndTime(slotDefault.end);
          } else {
            setStartTime('');
            setEndTime('');
          }
        } catch (error) {
          console.error('Failed to load cohort defaults:', error);
          setStartTime('');
          setEndTime('');
        }
      };

      loadDefaults();
    }
  }, [isOpen, cohortId, sessionNumber]);

  const handleSessionTypeSelect = (sessionType: SessionType) => {
    setSelectedSessionType(sessionType);
  };

  const handleConfirm = async () => {
    if (!selectedSessionType || !title.trim()) {
      toast.error('Please select a session type and enter a title');
      return;
    }

    // Handle regular session creation with optional times
    onConfirm(
      selectedSessionType,
      title,
      startTime || undefined,
      endTime || undefined
    );
  };

  const handleClose = () => {
    setSelectedSessionType(null);
    setTitle('');
    setStartTime('');
    setEndTime('');
    onClose();
  };

  const isFormValid = selectedSessionType && title.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Plan Session</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Title Input */}
          <div className='space-y-2'>
            <Label htmlFor='title'>Session Title</Label>
            <Input
              id='title'
              placeholder='Enter session title'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Session Type Selection */}
          <div className='space-y-2'>
            <Label>Session Type</Label>
            <div className='grid grid-cols-2 gap-3'>
              {sessionTypeOptions.map(option => (
                <Card
                  key={option.value}
                  className={`p-3 cursor-pointer transition-all ${
                    selectedSessionType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    handleSessionTypeSelect(option.value as SessionType)
                  }
                >
                  <div className='text-sm font-medium'>{option.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {option.description}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Session Time Selection */}
          <div className='space-y-3'>
            <Label>Session Time (Optional)</Label>
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-2'>
                <Label
                  htmlFor='start-time'
                  className='text-xs text-muted-foreground'
                >
                  Start Time
                </Label>
                <Input
                  id='start-time'
                  type='time'
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  placeholder='Select start time'
                />
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='end-time'
                  className='text-xs text-muted-foreground'
                >
                  End Time
                </Label>
                <Input
                  id='end-time'
                  type='time'
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  placeholder='Select end time'
                />
              </div>
            </div>
            <div className='text-xs text-muted-foreground'>
              {startTime && endTime
                ? `Session will run from ${startTime} to ${endTime}`
                : startTime || endTime
                  ? 'Please set both start and end times'
                  : 'Times will be set from cohort defaults if available'}
            </div>
          </div>

          {/* CBL Info */}
          {selectedSessionType === 'cbl' && (
            <div className='p-3 bg-muted border border-border rounded-lg'>
              <div className='text-sm text-foreground'>
                <strong>
                  CBL Challenge will be created with 3 grouped sessions:
                </strong>
                <ul className='mt-2 space-y-1 text-xs text-muted-foreground'>
                  <li>
                    • <strong>Slot 1:</strong> Challenge + Learn
                  </li>
                  <li>
                    • <strong>Slot 2:</strong> Innovate
                  </li>
                  <li>
                    • <strong>Slot 3:</strong> Trans + Refl
                  </li>
                </ul>
                <p className='mt-2 text-xs text-muted-foreground'>
                  Sessions will be placed in the next available slots, starting
                  from the selected date.
                </p>
              </div>
            </div>
          )}

          {/* Mock Challenge Info */}
          {selectedSessionType === 'mock_challenge' && (
            <div className='p-3 bg-muted border border-border rounded-lg'>
              <div className='text-sm text-foreground'>
                <strong>
                  Mock Challenge will be created with 2 grouped sessions:
                </strong>
                <ul className='mt-2 space-y-1 text-xs text-muted-foreground'>
                  <li>
                    • <strong>Slot 1:</strong> Challenge Introduction
                  </li>
                  <li>
                    • <strong>Slot 2:</strong> Transform + Reflection
                  </li>
                </ul>
                <p className='mt-2 text-xs text-muted-foreground'>
                  Sessions will be placed in the next available slots, starting
                  from the selected date.
                </p>
              </div>
            </div>
          )}

          {/* Contextual Info for Between CBL Boundaries */}
          {boundaryInfo.isBetweenCBLSet && (
            <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
              <div className='text-sm text-amber-800'>
                <strong>
                  Adding session within{' '}
                  {boundaryInfo.isMockChallenge
                    ? 'Mock Challenge'
                    : 'CBL Challenge'}
                  : "{boundaryInfo.cblChallengeTitle}"
                </strong>
                <p className='mt-2 text-xs'>
                  {boundaryInfo.isMockChallenge
                    ? 'You can add regular sessions (Workshop, Masterclass, Gap) here. This will not create a new challenge.'
                    : 'You can add individual CBL components (Learn, Innovate, Transform) or regular sessions here. This will not create a new CBL challenge.'}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex justify-end space-x-2'>
            <Button variant='outline' onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isFormValid || isCreating}
            >
              {isCreating
                ? 'Creating...'
                : selectedSessionType === 'cbl'
                  ? 'Create CBL Challenge'
                  : boundaryInfo.isBetweenCBLSet
                    ? 'Add Individual Session'
                    : 'Plan Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
