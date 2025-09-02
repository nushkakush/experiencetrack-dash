import { useState, useEffect, useCallback } from 'react';
import { useCalendar } from '../../calendar/hooks/useCalendar';
import { useProgramStore } from '../../../stores/programStore';
import { cblService } from '../../../services/cblService';
import { sessionPlanningService } from '../../../services/sessionPlanningService';
import type { Session } from '../../sessions/types';
import type { CBLSession } from '../types';

export const useProgramCalendar = (
  cohortId: string | undefined,
  epicId: string | undefined,
  initialDate: Date = new Date()
) => {
  // Calendar state
  const {
    currentMonth,
    calendarDays,
    weekDayLabels,
    navigateToPreviousMonth,
    navigateToNextMonth,
    selectDate,
    selectedDate: calendarSelectedDate,
  } = useCalendar(initialDate);

  // Program store state
  const {
    currentEpic,
    plannedSessions,
    cblSessions,
    loadingSessions,
    loadingCBLSessions,
    setCurrentEpic,
    setPlannedSessions,
    setCBLSessions,
    setLoadingSessions,
    setLoadingCBLSessions,
    setSelectedDate,
  } = useProgramStore();

  // Local state
  const [selectedDate, setLocalSelectedDate] = useState<Date | null>(
    initialDate
  );

  // Fetch CBL sessions when component mounts or cohort/epic changes
  useEffect(() => {
    const fetchCBLSessions = async () => {
      if (!cohortId || !epicId) return;

      setLoadingCBLSessions(true);
      try {
        const challengesResult = await cblService.getCBLChallenges(
          cohortId,
          epicId
        );
        if (challengesResult.success && challengesResult.data) {
          // Fetch sessions for all challenges
          const allSessions: CBLSession[] = [];
          for (const challenge of challengesResult.data) {
            const sessionsResult = await cblService.getCBLSessions(
              challenge.id
            );
            if (sessionsResult.success && sessionsResult.data) {
              allSessions.push(...sessionsResult.data);
            }
          }
          setCBLSessions(allSessions);
        }
      } catch (error) {
        console.error('Error fetching CBL sessions:', error);
      } finally {
        setLoadingCBLSessions(false);
      }
    };

    fetchCBLSessions();
  }, [cohortId, epicId, setCBLSessions, setLoadingCBLSessions]);

  // Fetch planned sessions when epic changes
  useEffect(() => {
    const fetchPlannedSessions = async () => {
      if (!cohortId || !epicId) return;

      setLoadingSessions(true);
      try {
        const result = await sessionPlanningService.getPlannedSessions(
          cohortId,
          epicId
        );
        if (result.success) {
          setPlannedSessions(result.data || []);
        } else {
          console.error('Failed to fetch planned sessions:', result.error);
        }
      } catch (error) {
        console.error('Error fetching planned sessions:', error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchPlannedSessions();
  }, [cohortId, epicId, setPlannedSessions, setLoadingSessions]);

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      setLocalSelectedDate(date);
      setSelectedDate(date);
      selectDate(date);
    },
    [setSelectedDate, selectDate]
  );

  // Handle session planning
  const handlePlanSession = useCallback((date: Date, sessionNumber: number) => {
    // Intentionally left for parent to open planning modal; defaults will be applied during creation
  }, []);

  // Update epic
  const updateEpic = useCallback(
    (epic: any) => {
      setCurrentEpic(epic);
    },
    [setCurrentEpic]
  );

  return {
    // Calendar state
    currentMonth,
    calendarDays,
    weekDayLabels,
    selectedDate,

    // Program state
    currentEpic,
    plannedSessions,
    cblSessions,
    loadingSessions,
    loadingCBLSessions,

    // Actions
    navigateToPreviousMonth,
    navigateToNextMonth,
    handleDateSelect,
    handlePlanSession,
    updateEpic,
  };
};
