import React, { useState } from 'react';
import { Skeleton } from '../../../components/ui/skeleton';
import { SessionCard } from '../../../components/ui/sessions';

import { CalendarDropZone } from './CalendarDropZone';
import { SessionService } from '../../sessions/services/SessionService';
import {
  CBLBoundaryService,
  type CBLVisualBoundaryInfo,
} from '../../../services/cblBoundaryService';
import type { Session } from '../../sessions/types';
import type { CalendarDay } from '../types';
import type { SessionMentorAssignmentWithMentor } from '../../../types/sessionMentorAssignment';
import { cn } from '../../../lib/utils';
import { Sparkles } from 'lucide-react';

interface CalendarDayContentProps {
  day: CalendarDay;
  sessionsPerDay: number;
  plannedSessions: Session[];
  sessionMentorAssignments?: Record<
    string,
    SessionMentorAssignmentWithMentor[]
  >;
  loadingSessions: boolean;
  onDateSelect: (date: Date) => void;
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
  onSessionClick?: (session: Session) => void;
  className?: string;
  cohortId?: string;
  epicId?: string;
}

export const CalendarDayContent: React.FC<CalendarDayContentProps> = ({
  day,
  sessionsPerDay,
  plannedSessions,
  sessionMentorAssignments = {},
  loadingSessions,
  onDateSelect,
  onPlanSession,
  onDropSession,
  onMoveSession,
  onDeleteSession,
  onUpdateSession,
  onEditChallenge,
  onSessionClick,
  className,
  cohortId,
  epicId,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  // Detect CBL boundaries for visual display
  const [cblBoundaries, setCblBoundaries] = React.useState<
    CBLVisualBoundaryInfo[]
  >([]);

  React.useEffect(() => {
    const fetchBoundaries = async () => {
      if (!cohortId || !epicId) {
        setCblBoundaries([]);
        return;
      }
      try {
        const boundaries = await CBLBoundaryService.detectCBLVisualBoundaries(
          plannedSessions,
          cohortId,
          epicId
        );
        // CBL boundaries loaded for visual display
        setCblBoundaries(boundaries);
      } catch (error) {
        console.error('Error fetching CBL boundaries:', error);
        setCblBoundaries([]);
      }
    };
    fetchBoundaries();
  }, [plannedSessions, cohortId, epicId]);

  // Check if current date/slot is between CBL boundaries
  const isSlotBetweenCBLBoundaries = React.useCallback(
    (date: Date, sessionNumber: number) => {
      // Check if slot is within CBL boundaries

      const result = cblBoundaries.some(boundary => {
        if (!boundary.cblStartDate || !boundary.cblEndDate) {
          return false;
        }

        // **FIXED: Normalize dates to remove time components for accurate comparison**
        const currentDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const startDate = new Date(
          boundary.cblStartDate.getFullYear(),
          boundary.cblStartDate.getMonth(),
          boundary.cblStartDate.getDate()
        );
        const endDate = new Date(
          boundary.cblEndDate.getFullYear(),
          boundary.cblEndDate.getMonth(),
          boundary.cblEndDate.getDate()
        );

        const isDateInRange =
          currentDate >= startDate && currentDate <= endDate;

        if (!isDateInRange) return false;

        // If this is the end date, check if the slot is within the CBL session range
        if (currentDate.getTime() === endDate.getTime()) {
          const maxSlot = boundary.cblSlotRange?.max || 1;
          const isSlotInRange = sessionNumber <= maxSlot;
          return isSlotInRange;
        }

        // If this is a middle date (between start and end), all slots are within boundaries
        return isDateInRange;
      });

      return result;
    },
    [cblBoundaries]
  );

  // Global drag end handler to ensure state is always cleared
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragOver(false);
      setHoveredSlot(null);
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  const plannedSessionsForDate = SessionService.getSessionsForDate(
    plannedSessions,
    day.date
  );

  const beginHover = () => {
    setIsDragOver(true);
  };

  const endHover = () => {
    setIsDragOver(false);
    setHoveredSlot(null);
  };

  const getSlotState = (slot: number) => {
    const available = SessionService.isSessionSlotAvailable(
      plannedSessions,
      day.date,
      slot
    );
    return { available };
  };

  const handleDropOnSlot = async (slot: number, e: React.DragEvent) => {
    if (e) e.preventDefault();
    const movedSessionId = e?.dataTransfer.getData('sessionId');
    const sessionType = e?.dataTransfer.getData('sessionType');
    const sessionTitle = e?.dataTransfer.getData('sessionTitle');
    const sourceDateStr = e?.dataTransfer.getData('sessionDate');
    const sourceSlotStr = e?.dataTransfer.getData('sessionNumber');

    // Boundary awareness: block moves from inside CBL to outside, and block any drop that lands outside when source is inside
    const destIsWithinCBL = isSlotBetweenCBLBoundaries(day.date, slot);
    let sourceIsWithinCBL: boolean | null = null;
    if (sourceDateStr && sourceSlotStr) {
      const [y, m, d] = sourceDateStr.split('-').map(Number);
      const sourceDate = new Date(y, (m || 1) - 1, d);
      sourceIsWithinCBL = isSlotBetweenCBLBoundaries(
        sourceDate,
        Number(sourceSlotStr)
      );
    }

    // Only enforce boundary restriction for middle CBL sessions (learn/innovate)
    // Allow moving anchors (challenge_intro / transform) to adjust boundaries
    const isIndividualCBLType = ['learn', 'innovate'].includes(
      sessionType || ''
    );
    if (
      isIndividualCBLType &&
      sourceIsWithinCBL === true &&
      destIsWithinCBL === false
    ) {
      try {
        const { toast } = await import('sonner');
        toast.error(
          'Cannot move Learn/Innovate/Transform outside CBL boundaries'
        );
      } catch (error) {
        console.error('Failed to show toast:', error);
      }
      setIsDragOver(false);
      setHoveredSlot(null);
      return;
    }

    if (movedSessionId && onMoveSession) {
      const destDateStr = ((): string => {
        return (
          day.date.getFullYear() +
          '-' +
          String(day.date.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(day.date.getDate()).padStart(2, '0')
        );
      })();

      // Check if we're dropping on another session (same day, different slot)
      if (sourceDateStr === destDateStr && sourceSlotStr) {
        const sourceSlot = Number(sourceSlotStr);
        if (sourceSlot !== slot) {
          // Find the session in the target slot to swap with
          const targetSession = plannedSessionsForDate.find(
            session => SessionService.getSessionNumber(session) === slot
          );

          if (targetSession) {
            // This will trigger a swap - both sessions will be moved to their new positions
          }
        } else {
          setIsDragOver(false);
          setHoveredSlot(null);
          return;
        }
      }

      onMoveSession(movedSessionId, day.date, slot);
      // Clear drag states after successful move
      setIsDragOver(false);
      setHoveredSlot(null);
      return;
    }

    if (sessionType && sessionTitle && onDropSession) {
      // For new sessions dragged from palette: only allow drop within CBL boundaries for Learn/Innovate/Transform
      const isIndividualCBL = ['learn', 'innovate', 'transform'].includes(
        sessionType
      );
      if (isIndividualCBL && !destIsWithinCBL) {
        try {
          const { toast } = await import('sonner');
          toast.error('Place Learn/Innovate/Transform within CBL boundaries');
        } catch (error) {
          console.error('Failed to show toast:', error);
        }
        setIsDragOver(false);
        setHoveredSlot(null);
        return;
      }

      onDropSession(day.date, slot, sessionType, sessionTitle);
      // Clear drag states after successful drop
      setIsDragOver(false);
      setHoveredSlot(null);
    }
  };

  if (loadingSessions) {
    return (
      <div className={cn('p-2 space-y-2', className)}>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative p-2 min-h-64 h-full flex flex-col transition-all duration-200',
        day.isSelected && 'bg-blue-100',
        className
      )}
      onClick={() => onDateSelect(day.date)}
      onDragEnter={e => {
        beginHover();
      }}
      onDragOver={e => {
        e.preventDefault();
        beginHover();
      }}
      onDragLeave={e => {
        // Only clear if we're leaving the entire cell, not just moving between slots
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          endHover();
        }
      }}
      onDrop={e => {
        // Always clear drag state when drop occurs
        endHover();
      }}
    >
      {/* Date Header */}
      <div className='flex items-center justify-between mb-2'>
        <span
          className={cn(
            'text-sm font-medium',
            day.isToday && 'text-blue-600',
            !day.isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {day.date.getDate()}
        </span>
        {day.isHoliday && (
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                day.holidayType === 'cohort_specific'
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              )}
            >
              {day.holidayType === 'cohort_specific'
                ? 'Cohort Holiday'
                : 'Global Holiday'}
            </span>
          </div>
        )}
      </div>

      {/* Content Area - Grid Layout */}
      <div className='flex flex-col flex-1 gap-1 min-h-0'>
        {day.isHoliday ? (
          <div
            className={cn(
              'relative flex-1 rounded-lg border overflow-hidden',
              day.holidayType === 'cohort_specific'
                ? 'border-pink-200 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100'
                : 'border-indigo-200 bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100'
            )}
          >
            <div className='absolute inset-0 pointer-events-none opacity-15'>
              {/* subtle pattern with icon */}
            </div>
            <div className='relative h-full p-3 flex items-center'>
              <div className='flex items-start gap-3'>
                <div
                  className={cn(
                    'mt-0.5 rounded-md p-1.5',
                    day.holidayType === 'cohort_specific'
                      ? 'bg-pink-200 text-pink-700'
                      : 'bg-indigo-200 text-indigo-700'
                  )}
                >
                  <Sparkles className='h-4 w-4' />
                </div>
                <div className='min-w-0'>
                  <div className='text-sm font-semibold truncate'>
                    {day.holidayTitle || 'Holiday'}
                  </div>
                  <div className='text-xs opacity-80'>
                    {day.holidayType === 'cohort_specific'
                      ? 'Cohort-specific holiday'
                      : 'Global holiday'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-1 min-h-0 flex-1'>
              {Array.from({ length: sessionsPerDay }, (_, index) => {
                const sessionNumber = index + 1;
                const sessionForSlot = plannedSessionsForDate.find(
                  session =>
                    SessionService.getSessionNumber(session) === sessionNumber
                );

                // Check if this slot is between CBL boundaries
                const isBetweenCBL = isSlotBetweenCBLBoundaries(
                  day.date,
                  sessionNumber
                );

                // Calculate how many slots are actually occupied
                const occupiedSlots = plannedSessionsForDate.length;

                // Calculate slot styling based on occupancy and CBL boundaries

                return (
                  <div
                    key={sessionNumber}
                    className={cn('min-h-0 relative flex-1 h-full')}
                  >
                    {sessionForSlot ? (
                      <>
                        <SessionCard
                          session={sessionForSlot}
                          sessionNumber={sessionNumber}
                          className='text-xs h-full'
                          challengeTitle={
                            sessionForSlot.challenge_title || undefined
                          }
                          mentorAssignments={
                            sessionMentorAssignments[sessionForSlot.id] || []
                          }
                          onClick={() => onSessionClick?.(sessionForSlot)}
                          onDragStart={(e, session) => {
                            // Session drag started
                          }}
                          onDragEnd={e => {
                            // Session drag ended
                          }}
                          onDelete={
                            onDeleteSession
                              ? (session, sessionNumber) => {
                                  onDeleteSession(session.id);
                                }
                              : undefined
                          }
                          onUpdate={onUpdateSession}
                        />
                      </>
                    ) : (
                      <div
                        className={cn(
                          'h-full relative group transition-all duration-200',
                          // Color coding for slots between CBL boundaries
                          isBetweenCBL &&
                            'bg-amber-50 border border-amber-200 rounded-lg',
                          // Gray out on holiday
                          day.isHoliday &&
                            'bg-neutral-100 border border-neutral-200 rounded-lg opacity-70'
                        )}
                        onMouseEnter={() => setHoveredSlot(sessionNumber)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {/* Holiday Indicator */}
                        {day.isHoliday && (
                          <div className='absolute top-1 left-1 text-[10px] px-1 py-0.5 rounded bg-neutral-200 text-neutral-700 font-medium'>
                            {day.holidayTitle || 'Holiday'}
                          </div>
                        )}

                        {/* CBL Boundary Indicator */}
                        {isBetweenCBL && (
                          <div className='absolute top-1 left-1 text-xs text-amber-600 font-medium'>
                            CBL
                          </div>
                        )}

                        {/* Hover Add Button (blocked on holiday) */}
                        {hoveredSlot === sessionNumber && !day.isHoliday && (
                          <button
                            onClick={() =>
                              onPlanSession(day.date, sessionNumber)
                            }
                            className={cn(
                              'absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer group',
                              isBetweenCBL
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/70 hover:border-amber-500'
                                : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-300/50 hover:border-blue-400/70'
                            )}
                            title={`Add session to slot ${sessionNumber}${isBetweenCBL ? ' (CBL boundary)' : ''}`}
                          >
                            <div
                              className={cn(
                                'font-medium text-sm',
                                isBetweenCBL
                                  ? 'text-amber-700 hover:text-amber-800'
                                  : 'text-blue-600 hover:text-blue-700'
                              )}
                            >
                              + Add Experience{isBetweenCBL ? ' (CBL)' : ''}
                            </div>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Drop Zone Overlay - covers entire cell */}
      <CalendarDropZone
        sessionsPerDay={sessionsPerDay}
        isActive={isDragOver && !day.isHoliday}
        hoveredSlot={hoveredSlot}
        getSlotState={getSlotState}
        onHoverSlot={slot => {
          setHoveredSlot(slot);
        }}
        onLeave={endHover}
        onDropSlot={(slot, e) => handleDropOnSlot(slot, e)}
      />
    </div>
  );
};
