import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase, connectionManager } from '@/integrations/supabase/client';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type {
  AttendanceData,
  AttendanceContext,
  CohortStudent,
  CohortEpic,
  SessionInfo,
  AttendanceRecord,
  Cohort,
} from '@/types/attendance';
import { Logger } from '@/lib/logging/Logger';

export const useAttendanceData = (
  cohortId: string | undefined,
  context: Partial<AttendanceContext>
) => {
  const [data, setData] = useState<AttendanceData>({
    cohort: null,
    students: [],
    epics: [],
    sessions: [],
    attendanceRecords: [],
    loading: true,
    error: null,
  });

  const [selectedEpic, setSelectedEpic] = useState<string>('');

  // Load initial data (cohort, students, epics)
  useEffect(() => {
    if (!cohortId) return;

    const loadInitialData = async () => {
      try {
        // Load cohort data directly from database
        const { data: cohortData, error: cohortError } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();

        if (cohortError) throw cohortError;

        // Load epics
        const epicsData = await AttendanceService.getCohortEpics(cohortId);

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId)
          .neq('dropped_out_status', 'dropped_out');

        if (studentsError) throw studentsError;

        setData(prev => ({
          ...prev,
          cohort: cohortData,
          students: studentsData || [],
          epics: epicsData,
          loading: false,
        }));

        // Set the active epic as selected if available, otherwise the first epic
        if (epicsData.length > 0 && !selectedEpic) {
          const activeEpic = epicsData.find(epic => epic.is_active);
          setSelectedEpic(activeEpic ? activeEpic.id : epicsData[0].id);
        }
      } catch (error) {
        Logger.getInstance().error('Error loading initial data', {
          error,
          cohortId,
        });
        setData(prev => ({
          ...prev,
          error: 'Failed to load cohort data',
          loading: false,
        }));
      }
    };

    loadInitialData();
  }, [cohortId]);

  // Load sessions when epic or date changes
  useEffect(() => {
    if (!selectedEpic || !cohortId || !context.selectedDate) return;

    const loadSessions = async () => {
      const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
      try {
        const sessionInfos = await AttendanceService.getSessionsForDate(
          cohortId,
          selectedEpic,
          sessionDate
        );

        setData(prev => ({
          ...prev,
          sessions: sessionInfos,
        }));
      } catch (error) {
        Logger.getInstance().error('Error loading sessions', {
          error,
          cohortId,
          selectedEpic,
          sessionDate,
        });
        toast.error('Failed to load session data');
      }
    };

    loadSessions();
  }, [selectedEpic, context.selectedDate, cohortId]);

  // Load attendance records when session changes
  useEffect(() => {
    if (
      !context.selectedSession ||
      !selectedEpic ||
      !cohortId ||
      !context.selectedDate
    ) {
      return;
    }

    const loadAttendance = async () => {
      const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
      try {
        const attendanceData = await AttendanceService.getSessionAttendance(
          cohortId,
          selectedEpic,
          context.selectedSession,
          sessionDate
        );

        setData(prev => ({
          ...prev,
          attendanceRecords: attendanceData,
        }));
      } catch (error) {
        Logger.getInstance().error('Error loading attendance', {
          error,
          cohortId,
          selectedEpic,
          sessionDate,
        });
        toast.error('Failed to load attendance records');
      }
    };

    loadAttendance();
  }, [context.selectedSession, selectedEpic, context.selectedDate, cohortId]);

  // Set up real-time subscriptions for attendance changes
  useEffect(() => {
    if (!cohortId || !selectedEpic || !context.selectedDate) return;

    const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
    const channelName = `attendance-${cohortId}-${selectedEpic}-${sessionDate}`;

    // Create a single channel for all attendance-related changes with unique name
    const attendanceChannel = connectionManager
      .createChannel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cancelled_sessions',
          filter: `cohort_id=eq.${cohortId} and epic_id=eq.${selectedEpic} and session_date=eq.${sessionDate}`,
        },
        payload => {
          // Reload sessions when cancelled sessions change
          const loadSessions = async () => {
            try {
              const sessionInfos = await AttendanceService.getSessionsForDate(
                cohortId,
                selectedEpic,
                sessionDate
              );
              setData(prev => ({
                ...prev,
                sessions: sessionInfos,
              }));
            } catch (error) {
              Logger.getInstance().error('Error reloading sessions', {
                error,
                cohortId,
                selectedEpic,
                sessionDate,
              });
            }
          };
          loadSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `cohort_id=eq.${cohortId} and epic_id=eq.${selectedEpic}`,
        },
        payload => {
          // Reload attendance records when they change
          if (context.selectedSession) {
            const loadAttendance = async () => {
              try {
                const attendanceData =
                  await AttendanceService.getSessionAttendance(
                    cohortId,
                    selectedEpic,
                    context.selectedSession,
                    sessionDate
                  );
                setData(prev => ({
                  ...prev,
                  attendanceRecords: attendanceData,
                }));
              } catch (error) {
                Logger.getInstance().error('Error reloading attendance', {
                  error,
                  cohortId,
                  selectedEpic,
                  sessionDate,
                });
              }
            };
            loadAttendance();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cohort_epics',
          filter: `cohort_id=eq.${cohortId}`,
        },
        payload => {
          // Reload epics when they change (e.g., when active epic is set)
          const loadEpics = async () => {
            try {
              const epicsData =
                await AttendanceService.getCohortEpics(cohortId);
              setData(prev => ({
                ...prev,
                epics: epicsData,
              }));

              // Update selected epic if current selection is no longer valid or if active epic changed
              const currentEpicExists = epicsData.find(
                epic => epic.id === selectedEpic
              );
              if (!currentEpicExists) {
                const activeEpic = epicsData.find(epic => epic.is_active);
                setSelectedEpic(
                  activeEpic ? activeEpic.id : epicsData[0]?.id || ''
                );
              }
            } catch (error) {
              Logger.getInstance().error('Error reloading epics', {
                error,
                cohortId,
              });
            }
          };
          loadEpics();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      connectionManager.removeChannel(channelName);
    };
  }, [cohortId, selectedEpic, context.selectedDate, context.selectedSession]);

  const refetchAttendance = async () => {
    if (
      !context.selectedSession ||
      !selectedEpic ||
      !cohortId ||
      !context.selectedDate
    ) {
      return;
    }

    const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
    try {
      const attendanceData = await AttendanceService.getSessionAttendance(
        cohortId,
        selectedEpic,
        context.selectedSession,
        sessionDate
      );

      setData(prev => ({
        ...prev,
        attendanceRecords: attendanceData,
      }));
    } catch (error) {
      Logger.getInstance().error('Error refetching attendance', {
        error,
        cohortId,
        selectedEpic,
        sessionDate,
      });
    }
  };

  const refetchSessions = async () => {
    if (!selectedEpic || !cohortId || !context.selectedDate) {
      return;
    }

    const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
    try {
      const sessionInfos = await AttendanceService.getSessionsForDate(
        cohortId,
        selectedEpic,
        sessionDate
      );

      setData(prev => ({
        ...prev,
        sessions: sessionInfos,
      }));
    } catch (error) {
      Logger.getInstance().error('Error refetching sessions', {
        error,
        cohortId,
        selectedEpic,
        sessionDate,
      });
    }
  };

  const refetchEpics = async () => {
    if (!cohortId) return;

    try {
      const epicsData = await AttendanceService.getCohortEpics(cohortId);
      setData(prev => ({
        ...prev,
        epics: epicsData,
      }));

      // Update selected epic if current selection is no longer valid
      const currentEpicExists = epicsData.find(
        epic => epic.id === selectedEpic
      );
      if (!currentEpicExists) {
        const activeEpic = epicsData.find(epic => epic.is_active);
        setSelectedEpic(activeEpic ? activeEpic.id : epicsData[0]?.id || '');
      }
    } catch (error) {
      Logger.getInstance().error('Error refetching epics', { error, cohortId });
    }
  };

  const getCurrentEpic = () => {
    return data.epics.find(epic => epic.id === selectedEpic) || null;
  };

  return {
    ...data,
    selectedEpic,
    setSelectedEpic,
    currentEpic: getCurrentEpic(),
    refetchAttendance,
    refetchSessions,
    refetchEpics,
  };
};
