import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { 
  AttendanceData, 
  AttendanceContext, 
  CohortStudent, 
  CohortEpic, 
  SessionInfo, 
  AttendanceRecord,
  Cohort
} from '@/types/attendance';

export const useAttendanceData = (cohortId: string | undefined, context: Partial<AttendanceContext>) => {
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
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // Load cohort details
        const { data: cohortData, error: cohortError } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();
        
        if (cohortError) throw cohortError;

        // Load epics
        const epicsData = await AttendanceService.getCohortEpics(cohortId);
        
        // Set active epic as default
        const activeEpic = epicsData.find(epic => epic.is_active);
        const defaultEpic = activeEpic || epicsData[0];
        if (defaultEpic) {
          setSelectedEpic(defaultEpic.id);
        }

        // Load students
        const { data: studentsData, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId);

        if (studentsError) throw studentsError;

        setData(prev => ({
          ...prev,
          cohort: cohortData,
          epics: epicsData,
          students: studentsData || [],
          loading: false,
        }));

      } catch (error) {
        console.error('Error loading initial data:', error);
        setData(prev => ({
          ...prev,
          error: 'Failed to load attendance data',
          loading: false,
        }));
        toast.error('Failed to load attendance data');
      }
    };

    loadInitialData();
  }, [cohortId]);

  // Load sessions when epic or date changes
  useEffect(() => {
    if (!selectedEpic || !cohortId || !context.selectedDate) return;
    
    const loadSessions = async () => {
      try {
        const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
        const sessionInfos = await AttendanceService.getSessionsForDate(cohortId, selectedEpic, sessionDate);
        
        setData(prev => ({
          ...prev,
          sessions: sessionInfos,
        }));
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast.error('Failed to load session data');
      }
    };

    loadSessions();
  }, [selectedEpic, context.selectedDate, cohortId]);

  // Load attendance records when session changes
  useEffect(() => {
    if (!context.selectedSession || !selectedEpic || !cohortId || !context.selectedDate) {
      return;
    }
    
    const loadAttendance = async () => {
      try {
        const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
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
        console.error('Error loading attendance:', error);
        toast.error('Failed to load attendance records');
      }
    };

    loadAttendance();
  }, [context.selectedSession, selectedEpic, context.selectedDate, cohortId]);

  const refetchAttendance = async () => {
    if (!context.selectedSession || !selectedEpic || !cohortId || !context.selectedDate) {
      return;
    }
    
    try {
      const sessionDate = format(context.selectedDate, 'yyyy-MM-dd');
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
      console.error('Error refetching attendance:', error);
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
  };
};
