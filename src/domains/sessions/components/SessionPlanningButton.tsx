import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { SessionService } from '../services/SessionService';
import type { Session } from '../types';

interface SessionPlanningButtonProps {
  date: Date;
  sessionsPerDay: number;
  plannedSessions: Session[];
  onPlanSession: (date: Date, sessionNumber: number) => void;
  isDragOver?: boolean;
}

export const SessionPlanningButton: React.FC<SessionPlanningButtonProps> = ({
  date,
  sessionsPerDay,
  plannedSessions,
  onPlanSession,
  isDragOver = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check which session slots are available
  const availableSlots = Array.from(
    { length: sessionsPerDay },
    (_, i) => i + 1
  ).filter(slotNumber =>
    SessionService.isSessionSlotAvailable(plannedSessions, date, slotNumber)
  );

  // Don't show anything if no slots are available
  if (availableSlots.length === 0) {
    return null;
  }

  const handleSessionSelect = (sessionNumber: number) => {
    console.log(
      `🎯 SessionPlanningButton: Planning session for slot ${sessionNumber} on ${date.toDateString()}`
    );
    onPlanSession(date, sessionNumber);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // If only one slot is available, show a simple button
  if (availableSlots.length === 1) {
    return (
      <Button
        variant='ghost'
        size='sm'
        className={`
          h-6 w-6 p-0 rounded-full transition-all duration-200
          ${
            isDragOver
              ? 'bg-blue-500 text-white scale-110 shadow-lg'
              : isHovered
                ? 'bg-blue-100 text-blue-600 scale-105'
                : 'bg-muted/50 text-muted-foreground hover:bg-blue-100 hover:text-blue-600'
          }
        `}
        onClick={() => handleSessionSelect(availableSlots[0])}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={`Plan session for slot ${availableSlots[0]}`}
      >
        <Plus className='h-3 w-3' />
      </Button>
    );
  }

  // If multiple slots are available, show a dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={`
            h-6 w-6 p-0 rounded-full transition-all duration-200
            ${
              isDragOver
                ? 'bg-blue-500 text-white scale-110 shadow-lg'
                : isHovered
                  ? 'bg-blue-100 text-blue-600 scale-105'
                  : 'bg-muted/50 text-muted-foreground hover:bg-blue-100 hover:text-blue-600'
            }
          `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          title={`Plan session (${availableSlots.length} slots available)`}
        >
          <Plus className='h-3 w-3' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {availableSlots.map(slotNumber => (
          <DropdownMenuItem
            key={slotNumber}
            onClick={() => handleSessionSelect(slotNumber)}
            className='cursor-pointer'
          >
            Session {slotNumber}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
