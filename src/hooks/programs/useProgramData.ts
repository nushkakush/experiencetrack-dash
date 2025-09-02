import { useState, useEffect } from 'react';
import { supabase, connectionManager } from '@/integrations/supabase/client';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { CohortStudent, CohortEpic, Cohort } from '@/types/attendance';
import { Logger } from '@/lib/logging/Logger';

interface ProgramData {
  cohort: Cohort | null;
  students: CohortStudent[];
  epics: CohortEpic[];
  loading: boolean;
  error: string | null;
}

export const useProgramData = (cohortId: string | undefined) => {
  const [data, setData] = useState<ProgramData>({
    cohort: null,
    students: [],
    epics: [],
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
        Logger.getInstance().error('Error loading initial program data', {
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

  // Set up real-time subscription for epic changes
  useEffect(() => {
    if (!cohortId) return;

    const channelName = `program-epics-${cohortId}`;

    const channel = connectionManager
      .createChannel(channelName)
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
  }, [cohortId, selectedEpic]);

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
      if (!currentEpicExists && epicsData.length > 0) {
        const activeEpic = epicsData.find(epic => epic.is_active);
        setSelectedEpic(activeEpic ? activeEpic.id : epicsData[0].id);
      }
    } catch (error) {
      Logger.getInstance().error('Error refetching epics', {
        error,
        cohortId,
      });
      toast.error('Failed to refresh epics');
    }
  };

  return {
    ...data,
    selectedEpic,
    setSelectedEpic,
    refetchEpics,
  };
};
