import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '@/services/base.service';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import { EquipmentBlacklist, CreateBlacklistData } from '../types';
import { CohortStudent } from '@/types/cohort';

class EquipmentBlacklistService extends BaseService<EquipmentBlacklist> {
  constructor() {
    super('equipment_blacklist');
  }

  async getBlacklistedStudents(): Promise<EquipmentBlacklist[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_blacklist')
        .select(
          `
          *,
          student:cohort_students(
            *,
            cohort:cohorts(*)
          ),
          blacklisted_by_user:profiles!equipment_blacklist_blacklisted_by_fkey(*)
        `
        )
        .order('blacklisted_at', { ascending: false });

      if (error) {
        Logger.getInstance().error(
          'EquipmentBlacklistService.getBlacklistedStudents - error',
          { error }
        );
        throw error;
      }

      return data || [];
    });
  }

  async blacklistStudent(
    blacklistData: CreateBlacklistData
  ): Promise<EquipmentBlacklist> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_blacklist')
        .insert({
          ...blacklistData,
          blacklisted_by: (await supabase.auth.getUser()).data.user?.id,
          blacklisted_at: new Date().toISOString(),
        })
        .select(
          `
          *,
          student:cohort_students(
            *,
            cohort:cohorts(*)
          ),
          blacklisted_by_user:profiles!equipment_blacklist_blacklisted_by_fkey(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentBlacklistService.blacklistStudent - error',
          { error, blacklistData }
        );
        throw error;
      }

      return data;
    });
  }

  async removeFromBlacklist(blacklistId: string): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('equipment_blacklist')
        .delete()
        .eq('id', blacklistId);

      if (error) {
        Logger.getInstance().error(
          'EquipmentBlacklistService.removeFromBlacklist - error',
          { error, blacklistId }
        );
        throw error;
      }
    });
  }

  async isStudentBlacklisted(studentId: string): Promise<boolean> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_blacklist')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) {
        Logger.getInstance().error(
          'EquipmentBlacklistService.isStudentBlacklisted - error',
          { error, studentId }
        );
        throw error;
      }

      return !!data;
    });
  }

  async getCohortStudents(cohortId: string): Promise<CohortStudent[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('cohort_students')
        .select(
          `
          *,
          cohort:cohorts(*)
        `
        )
        .eq('cohort_id', cohortId)
        .order('first_name', { ascending: true });

      if (error) {
        Logger.getInstance().error(
          'EquipmentBlacklistService.getCohortStudents - error',
          { error, cohortId }
        );
        throw error;
      }

      return data || [];
    });
  }
}

export const equipmentBlacklistService = new EquipmentBlacklistService();
