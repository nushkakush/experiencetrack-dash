import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { HolidaysService } from '@/services/holidays.service';
import type { Holiday, SelectedHoliday } from '@/types/holiday';

export interface HolidayManagementState {
  selectedDates: Date[];
  draftHolidays: SelectedHoliday[];
  publishedHolidays: Holiday[];
  loading: boolean;
  saving: boolean;
  publishing: boolean;
}

export interface HolidayManagementActions {
  setSelectedDates: (dates: Date[]) => void;
  addHoliday: (holiday: SelectedHoliday) => void;
  updateHoliday: (id: string, updates: Partial<SelectedHoliday>) => void;
  removeHoliday: (id: string) => void;
  saveDrafts: () => Promise<void>;
  publishHolidays: () => Promise<void>;
  deletePublishedHoliday: (id: string) => Promise<void>;
  loadHolidays: () => Promise<void>;
  clearDrafts: () => void;
}

export const useHolidayManagement = (
  scope: 'global' | 'cohort',
  cohortId?: string
) => {
  const [state, setState] = useState<HolidayManagementState>({
    selectedDates: [],
    draftHolidays: [],
    publishedHolidays: [],
    loading: false,
    saving: false,
    publishing: false,
  });

  const updateState = useCallback((updates: Partial<HolidayManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadHolidays = useCallback(async () => {
    updateState({ loading: true });
    try {
      const holidays = scope === 'global' 
        ? await HolidaysService.getGlobalHolidays()
        : await HolidaysService.getCohortHolidays(cohortId!);
      
      updateState({ publishedHolidays: holidays });
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      updateState({ loading: false });
    }
  }, [scope, cohortId, updateState]);

  const addHoliday = useCallback((holiday: SelectedHoliday) => {
    setState(prev => ({
      ...prev,
      draftHolidays: [...prev.draftHolidays, holiday],
    }));
  }, []);

  const updateHoliday = useCallback((id: string, updates: Partial<SelectedHoliday>) => {
    setState(prev => ({
      ...prev,
      draftHolidays: prev.draftHolidays.map(h => 
        h.id === id ? { ...h, ...updates } : h
      ),
    }));
  }, []);

  const removeHoliday = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      draftHolidays: prev.draftHolidays.filter(h => h.id !== id),
    }));
  }, []);

  const saveDrafts = useCallback(async () => {
    if (state.draftHolidays.length === 0) {
      toast.error('No holidays to save');
      return;
    }

    updateState({ saving: true });
    try {
      for (const holiday of state.draftHolidays) {
        if (scope === 'global') {
          await HolidaysService.createGlobalHoliday(holiday);
        } else {
          await HolidaysService.createCohortHoliday(cohortId!, holiday);
        }
      }
      
      toast.success(`${state.draftHolidays.length} holiday(s) saved successfully`);
      setState(prev => ({ ...prev, draftHolidays: [] }));
      await loadHolidays();
    } catch (error) {
      console.error('Error saving holidays:', error);
      toast.error('Failed to save holidays');
    } finally {
      updateState({ saving: false });
    }
  }, [state.draftHolidays, scope, cohortId, loadHolidays, updateState]);

  const publishHolidays = useCallback(async () => {
    if (state.draftHolidays.length === 0) {
      toast.error('No holidays to publish');
      return;
    }

    updateState({ publishing: true });
    try {
      for (const holiday of state.draftHolidays) {
        if (scope === 'global') {
          await HolidaysService.createGlobalHoliday({ ...holiday, isPublished: true });
        } else {
          await HolidaysService.createCohortHoliday(cohortId!, { ...holiday, isPublished: true });
        }
      }
      
      toast.success(`${state.draftHolidays.length} holiday(s) published successfully`);
      setState(prev => ({ ...prev, draftHolidays: [] }));
      await loadHolidays();
    } catch (error) {
      console.error('Error publishing holidays:', error);
      toast.error('Failed to publish holidays');
    } finally {
      updateState({ publishing: false });
    }
  }, [state.draftHolidays, scope, cohortId, loadHolidays, updateState]);

  const deletePublishedHoliday = useCallback(async (id: string) => {
    updateState({ loading: true });
    try {
      await HolidaysService.deleteHoliday(id);
      toast.success('Holiday deleted successfully');
      await loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    } finally {
      updateState({ loading: false });
    }
  }, [loadHolidays, updateState]);

  const clearDrafts = useCallback(() => {
    setState(prev => ({ ...prev, draftHolidays: [], selectedDates: [] }));
  }, []);

  const setSelectedDates = useCallback((dates: Date[]) => {
    setState(prev => ({ ...prev, selectedDates: dates }));
  }, []);

  // Load holidays on mount
  useEffect(() => {
    if (scope === 'cohort' && !cohortId) return;
    loadHolidays();
  }, [loadHolidays, scope, cohortId]);

  const actions: HolidayManagementActions = {
    setSelectedDates,
    addHoliday,
    updateHoliday,
    removeHoliday,
    saveDrafts,
    publishHolidays,
    deletePublishedHoliday,
    loadHolidays,
    clearDrafts,
  };

  return {
    state,
    actions,
  };
};
