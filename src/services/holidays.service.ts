import { supabase } from '@/integrations/supabase/client';
import type { Holiday, CreateHolidayRequest, UpdateHolidayRequest, HolidayType, HolidayStatus } from '@/types/holiday';

export class HolidaysService {
  /**
   * Get all holidays with optional filtering
   */
  static async getHolidays(options?: {
    holidayType?: HolidayType;
    status?: HolidayStatus;
    cohortId?: string;
    year?: number;
  }): Promise<Holiday[]> {
    let query = supabase
      .from('holidays')
      .select('*')
      .order('date', { ascending: true });

    if (options?.holidayType) {
      query = query.eq('holiday_type', options.holidayType);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.cohortId) {
      query = query.eq('cohort_id', options.cohortId);
    }

    if (options?.year) {
      const startDate = `${options.year}-01-01`;
      const endDate = `${options.year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch holidays: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get global holidays
   */
  static async getGlobalHolidays(status?: HolidayStatus): Promise<Holiday[]> {
    return this.getHolidays({ 
      holidayType: 'global',
      status 
    });
  }

  /**
   * Get cohort-specific holidays
   */
  static async getCohortHolidays(cohortId: string, status?: HolidayStatus): Promise<Holiday[]> {
    return this.getHolidays({ 
      holidayType: 'cohort_specific',
      cohortId,
      status 
    });
  }

  /**
   * Create a new holiday
   */
  static async createHoliday(holiday: CreateHolidayRequest): Promise<Holiday> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('holidays')
      .insert({
        ...holiday,
        created_by: userData.user?.id,
        status: holiday.status || 'draft'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create holiday: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing holiday
   */
  static async updateHoliday(update: UpdateHolidayRequest): Promise<Holiday> {
    const { id, ...updateData } = update;

    const { data, error } = await supabase
      .from('holidays')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update holiday: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a holiday
   */
  static async deleteHoliday(id: string): Promise<void> {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete holiday: ${error.message}`);
    }
  }

  /**
   * Publish multiple holidays (change status from draft to published)
   */
  static async publishHolidays(holidayIds: string[]): Promise<Holiday[]> {
    const { data, error } = await supabase
      .from('holidays')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .in('id', holidayIds)
      .select();

    if (error) {
      throw new Error(`Failed to publish holidays: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create or update multiple holidays in batch
   */
  static async upsertHolidays(holidays: CreateHolidayRequest[]): Promise<Holiday[]> {
    const { data: userData } = await supabase.auth.getUser();

    const holidaysWithUser = holidays.map(holiday => ({
      ...holiday,
      created_by: userData.user?.id,
      status: holiday.status || 'draft'
    }));

    const { data, error } = await supabase
      .from('holidays')
      .upsert(holidaysWithUser, {
        onConflict: 'date,holiday_type,cohort_id'
      })
      .select();

    if (error) {
      throw new Error(`Failed to upsert holidays: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if a date is a holiday
   */
  static async isHoliday(date: string, cohortId?: string): Promise<boolean> {
    let query = supabase
      .from('holidays')
      .select('id')
      .eq('date', date)
      .eq('status', 'published');

    // Check both global holidays and cohort-specific holidays if cohortId is provided
    if (cohortId) {
      query = query.or(`holiday_type.eq.global,and(holiday_type.eq.cohort_specific,cohort_id.eq.${cohortId})`);
    } else {
      query = query.eq('holiday_type', 'global');
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(`Failed to check holiday: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }
}
