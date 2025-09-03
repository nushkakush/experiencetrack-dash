import React from 'react';
import { ProgramCalendarView as RefactoredCalendarView } from '@/domains/calendar';
import type { Session } from '@/domains/sessions/types';

export interface ProgramCalendarViewProps {
  cohortId: string;
  epicId: string;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  sessionsPerDay: number;
  onPlanSession: (date: Date, sessionNumber: number) => void;
  onDropSession?: (
    date: Date,
    sessionNumber: number,
    sessionType: string,
    sessionTitle: string
  ) => void;
  onMoveSession?: (
    sessionId: string,
    newDate: Date,
    newSessionNumber: number
  ) => void;
  onDeleteSession?: (sessionId: string) => void;
  onUpdateSession?: (
    sessionId: string,
    updates: { title: string }
  ) => Promise<void>;
  onEditChallenge?: (challengeId: string, currentTitle: string) => void;
  plannedSessions: Session[];
  loadingSessions: boolean;
  programCode?: string;
}

export const ProgramCalendarView: React.FC<
  ProgramCalendarViewProps
> = props => {
  return <RefactoredCalendarView {...props} />;
};
