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
        // Debug database connection first
        console.log('🔍 useAttendanceData: Testing database connection...');
        await AttendanceService.debugDatabaseConnection();

        // Load cohort data directly from database
        const { data: cohortData, error: cohortError } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();

        if (cohortError) throw cohortError;

        // Load epics
        console.log(
          '🔄 useAttendanceData: Loading epics for cohort:',
          cohortId
        );
        const epicsData = await AttendanceService.getCohortEpics(cohortId);
        console.log('✅ useAttendanceData: Epics loaded successfully:', {
          count: epicsData.length,
          epics: epicsData.map(epic => ({
            id: epic.id,
            name: epic.epic?.name || 'Unknown',
            is_active: epic.is_active,
          })),
        });

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId)
          .neq('dropped_out_status', 'dropped_out');

        if (studentsError) throw studentsError;

        console.log(
          '🔄 useAttendanceData: Setting data state with epics:',
          epicsData.length
        );
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
          const epicToSelect = activeEpic ? activeEpic.id : epicsData[0].id;
          console.log('🎯 useAttendanceData: Setting selected epic:', {
            activeEpic: activeEpic?.id,
            selectedEpic: epicToSelect,
            epicName: activeEpic?.epic?.name || epicsData[0]?.epic?.name,
          });
          setSelectedEpic(epicToSelect);
        } else {
          console.log(
            '⚠️ useAttendanceData: No epics to select or epic already selected:',
            {
              epicsCount: epicsData.length,
              selectedEpic: selectedEpic,
            }
          );
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
          table: 'daily_attendance_records',
          filter: `cohort_id=eq.${cohortId} and epic_id=eq.${selectedEpic}`,
        },
        payload => {
          console.log(
            '🔄 useAttendanceData: Real-time update received for daily attendance records'
          );
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
    console.log(
      '🔄 useAttendanceData.refetchAttendance: Starting attendance refetch...',
      {
        selectedSession: context.selectedSession,
        selectedEpic: selectedEpic,
        cohortId: cohortId,
        selectedDate: context.selectedDate,
      }
    );

    if (
      !context.selectedSession ||
      !selectedEpic ||
      !cohortId ||
      !context.selectedDate
    ) {
      console.warn(
        '⚠️ useAttendanceData.refetchAttendance: Missing required parameters, skipping refetch'
      );
      return;
    }

    const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
    console.log(
      '🔄 useAttendanceData.refetchAttendance: Fetching attendance for:',
      {
        cohortId,
        selectedEpic,
        contextSelectedSession: context.selectedSession,
        sessionDate,
      }
    );

    try {
      const attendanceData = await AttendanceService.getSessionAttendance(
        cohortId,
        selectedEpic,
        context.selectedSession,
        sessionDate
      );

      console.log(
        '✅ useAttendanceData.refetchAttendance: Attendance data fetched successfully:',
        {
          recordsCount: attendanceData?.length || 0,
          sampleRecord: attendanceData?.[0]
            ? {
                studentId: attendanceData[0].student_id,
                status: attendanceData[0].status,
                sessionNumber: attendanceData[0].session_number,
              }
            : null,
        }
      );

      setData(prev => ({
        ...prev,
        attendanceRecords: attendanceData,
      }));
    } catch (error) {
      console.error(
        '❌ useAttendanceData.refetchAttendance: Error fetching attendance:',
        error
      );
      Logger.getInstance().error('Error refetching attendance', {
        error,
        cohortId,
        selectedEpic,
        sessionDate,
      });
    }
  };

  const refetchSessions = async () => {
    console.log(
      '🔄 useAttendanceData.refetchSessions: Starting sessions refetch...',
      {
        selectedEpic: selectedEpic,
        cohortId: cohortId,
        selectedDate: context.selectedDate,
      }
    );

    if (!selectedEpic || !cohortId || !context.selectedDate) {
      console.warn(
        '⚠️ useAttendanceData.refetchSessions: Missing required parameters, skipping refetch'
      );
      return;
    }

    const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
    console.log(
      '🔄 useAttendanceData.refetchSessions: Fetching sessions for:',
      {
        cohortId,
        selectedEpic,
        sessionDate,
      }
    );

    try {
      const sessionInfos = await AttendanceService.getSessionsForDate(
        cohortId,
        selectedEpic,
        sessionDate
      );

      console.log(
        '✅ useAttendanceData.refetchSessions: Sessions fetched successfully:',
        {
          sessionsCount: sessionInfos?.length || 0,
          sessions:
            sessionInfos?.map(session => ({
              sessionNumber: session.sessionNumber,
              isCancelled: session.isCancelled,
              startTime: session.startTime,
              endTime: session.endTime,
            })) || [],
        }
      );

      setData(prev => ({
        ...prev,
        sessions: sessionInfos,
      }));
    } catch (error) {
      console.error(
        '❌ useAttendanceData.refetchSessions: Error fetching sessions:',
        error
      );
      Logger.getInstance().error('Error refetching sessions', {
        error,
        cohortId,
        selectedEpic,
        sessionDate,
      });
    }
  };

  const refetchEpics = async () => {
    if (!cohortId) {
      console.log('⚠️ useAttendanceData.refetchEpics: No cohortId provided');
      return;
    }

    console.log(
      '🔄 useAttendanceData.refetchEpics: Refetching epics for cohort:',
      cohortId
    );
    try {
      const epicsData = await AttendanceService.getCohortEpics(cohortId);
      console.log(
        '✅ useAttendanceData.refetchEpics: Epics refetched successfully:',
        {
          count: epicsData.length,
          epics: epicsData.map(epic => ({
            id: epic.id,
            name: epic.epic?.name || 'Unknown',
            is_active: epic.is_active,
          })),
        }
      );

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
        const newSelectedEpic = activeEpic
          ? activeEpic.id
          : epicsData[0]?.id || '';
        console.log(
          '🔄 useAttendanceData.refetchEpics: Updating selected epic:',
          {
            oldSelectedEpic: selectedEpic,
            newSelectedEpic: newSelectedEpic,
            reason: 'current selection no longer valid',
          }
        );
        setSelectedEpic(newSelectedEpic);
      } else {
        console.log(
          '✅ useAttendanceData.refetchEpics: Current selected epic still valid:',
          selectedEpic
        );
      }
    } catch (error) {
      console.error(
        '❌ useAttendanceData.refetchEpics: Error refetching epics:',
        error
      );
      Logger.getInstance().error('Error refetching epics', { error, cohortId });
    }
  };

  const getCurrentEpic = () => {
    const currentEpic =
      data.epics.find(epic => epic.id === selectedEpic) || null;
    console.log(
      '🔍 useAttendanceData.getCurrentEpic: Calculating current epic:',
      {
        selectedEpic: selectedEpic,
        epicsCount: data.epics.length,
        epics: data.epics.map(epic => ({
          id: epic.id,
          name: epic.epic?.name || epic.name,
        })),
        currentEpic: currentEpic
          ? {
              id: currentEpic.id,
              name: currentEpic.epic?.name || currentEpic.name,
              is_active: currentEpic.is_active,
            }
          : null,
      }
    );
    return currentEpic;
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
