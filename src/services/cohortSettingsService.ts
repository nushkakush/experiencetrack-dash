import { supabase } from '@/integrations/supabase/client';

export interface CohortSessionTimeDefault {
  sessionNumber: number;
  start: string; // HH:mm (local wall clock)
  end: string; // HH:mm (local wall clock)
}

class CohortSettingsService {
  async getDefaultSessionTimes(
    cohortId: string
  ): Promise<CohortSessionTimeDefault[]> {
    const { data, error } = await supabase
      .from('cohorts')
      .select('default_session_times')
      .eq('id', cohortId)
      .single();

    if (error) {
      console.error('Failed to fetch cohort default session times:', error);
      return [];
    }
    const arr = (data?.default_session_times ||
      []) as CohortSessionTimeDefault[];
    return Array.isArray(arr) ? arr : [];
  }

  async setDefaultSessionTimes(
    cohortId: string,
    defaults: CohortSessionTimeDefault[]
  ): Promise<boolean> {
    const { error } = await supabase
      .from('cohorts')
      .update({
        default_session_times: defaults,
        default_session_times_updated_at: new Date().toISOString(),
      })
      .eq('id', cohortId);

    if (error) {
      console.error('Failed to update cohort default session times:', error);
      return false;
    }
    return true;
  }
}

export const cohortSettingsService = new CohortSettingsService();
