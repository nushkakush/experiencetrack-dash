import { useState, useEffect, useCallback } from 'react';
import { supabase, connectionManager } from '@/integrations/supabase/client';
import type { AttendanceRecord } from '@/types/attendance';

export const useEpicAttendanceData = (
  cohortId: string | undefined,
  epicId: string | undefined
) => {
  const [epicAttendanceRecords, setEpicAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEpicAttendanceData = useCallback(async () => {
    if (!cohortId || !epicId) {
      setEpicAttendanceRecords([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        '🔍 useEpicAttendanceData: Loading from new daily_attendance_records table'
      );

      // Get all daily attendance records for this cohort and epic
      const { data: dailyRecords, error: recordsError } = await supabase
        .from('daily_attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: true });

      if (recordsError) throw recordsError;

      // Convert daily records to individual attendance records for compatibility
      const allRecords: AttendanceRecord[] = [];

      (dailyRecords || []).forEach(dailyRecord => {
        const sessions = dailyRecord.attendance_data?.sessions || [];

        sessions.forEach(session => {
          const students = session.students || {};

          Object.entries(students).forEach(([studentId, studentData]) => {
            allRecords.push({
              id: `${dailyRecord.id}-${session.session_number}-${studentId}`,
              student_id: studentId,
              cohort_id: cohortId,
              epic_id: epicId,
              session_number: session.session_number,
              session_date: dailyRecord.session_date,
              status: studentData.status,
              absence_type: studentData.absence_type || null,
              reason: studentData.reason || null,
              marked_by: session.marked_by,
              created_at: dailyRecord.created_at,
              updated_at: studentData.marked_at,
            });
          });
        });
      });

      console.log(
        '✅ useEpicAttendanceData: Converted daily records to individual records:',
        {
          dailyRecords: dailyRecords?.length || 0,
          individualRecords: allRecords.length,
        }
      );

      setEpicAttendanceRecords(allRecords);
    } catch (err) {
      console.error('Error loading epic attendance data:', err);
      setError('Failed to load epic attendance data');
      setEpicAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [cohortId, epicId]);

  useEffect(() => {
    loadEpicAttendanceData();
  }, [cohortId, epicId, loadEpicAttendanceData]);

  // Set up real-time subscription for epic attendance changes
  useEffect(() => {
    if (!cohortId || !epicId) return;

    const channelName = `epic-attendance-${cohortId}-${epicId}`;

    console.log(
      '🔄 useEpicAttendanceData: Setting up real-time subscription for daily_attendance_records'
    );

    // Set up real-time subscription for daily attendance records with unique channel name
    const channel = connectionManager
      .createChannel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_attendance_records',
          filter: `cohort_id=eq.${cohortId} and epic_id=eq.${epicId}`,
        },
        payload => {
          console.log(
            '🔄 useEpicAttendanceData: Real-time update received for daily attendance records'
          );
          // Reload epic attendance data when daily attendance records change
          loadEpicAttendanceData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      connectionManager.removeChannel(channelName);
    };
  }, [cohortId, epicId, loadEpicAttendanceData]);

  return {
    epicAttendanceRecords,
    loading,
    error,
    refetchEpicAttendance: loadEpicAttendanceData,
  };
};
