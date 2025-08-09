import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AttendanceRecord } from '@/types/attendance';

export const useEpicAttendanceData = (cohortId: string | undefined, epicId: string | undefined) => {
  const [epicAttendanceRecords, setEpicAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEpicAttendanceData = async () => {
    if (!cohortId || !epicId) {
      setEpicAttendanceRecords([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get all attendance records for this cohort and epic
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: true });

      if (recordsError) throw recordsError;

      setEpicAttendanceRecords(records || []);
    } catch (err) {
      console.error('Error loading epic attendance data:', err);
      setError('Failed to load epic attendance data');
      setEpicAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEpicAttendanceData();
  }, [cohortId, epicId]);

  return {
    epicAttendanceRecords,
    loading,
    error,
    refetchEpicAttendance: loadEpicAttendanceData,
  };
};
