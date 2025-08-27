import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '@/services/base.service';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import { EquipmentDamageReport, CreateDamageReportData } from '../types';

class EquipmentDamageService extends BaseService<EquipmentDamageReport> {
  constructor() {
    super('equipment_damage_reports');
  }

  async getDamageReports(): Promise<EquipmentDamageReport[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_damage_reports')
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          borrowing:equipment_borrowings(*),
          reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*),
          resolved_by_user:profiles!equipment_damage_reports_resolved_by_fkey(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error(
          'EquipmentDamageService.getDamageReports - error',
          { error }
        );
        throw error;
      }

      return data || [];
    });
  }

  async getDamageReportsByEquipment(
    equipmentId: string
  ): Promise<EquipmentDamageReport[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_damage_reports')
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          borrowing:equipment_borrowings(*),
          reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*),
          resolved_by_user:profiles!equipment_damage_reports_resolved_by_fkey(*)
        `
        )
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error(
          'EquipmentDamageService.getDamageReportsByEquipment - error',
          { error, equipmentId }
        );
        throw error;
      }

      return data || [];
    });
  }

  async createDamageReport(
    damageData: CreateDamageReportData
  ): Promise<EquipmentDamageReport> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_damage_reports')
        .insert({
          ...damageData,
          reported_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          borrowing:equipment_borrowings(*),
          reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentDamageService.createDamageReport - error',
          { error, damageData }
        );
        throw error;
      }

      // Update equipment status to 'maintenance' when damage is reported
      // But only if the equipment is currently available or borrowed
      // Preserve 'lost' and 'damaged' statuses
      await supabase
        .from('equipment')
        .update({ availability_status: 'maintenance' })
        .eq('id', damageData.equipment_id)
        .in('availability_status', ['available', 'borrowed']);

      return data;
    });
  }

  async updateDamageReportStatus(
    reportId: string,
    status: string,
    resolvedBy?: string
  ): Promise<EquipmentDamageReport> {
    return this.executeQuery(async () => {
      const updateData: any = { status };

      if (status === 'resolved' && resolvedBy) {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = resolvedBy;
      }

      const { data, error } = await supabase
        .from('equipment_damage_reports')
        .update(updateData)
        .eq('id', reportId)
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          borrowing:equipment_borrowings(*),
          reported_by_user:profiles!equipment_damage_reports_reported_by_fkey(*),
          resolved_by_user:profiles!equipment_damage_reports_resolved_by_fkey(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentDamageService.updateDamageReportStatus - error',
          { error, reportId, status }
        );
        throw error;
      }

      return data;
    });
  }

  async deleteDamageReport(reportId: string): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('equipment_damage_reports')
        .delete()
        .eq('id', reportId);

      if (error) {
        Logger.getInstance().error(
          'EquipmentDamageService.deleteDamageReport - error',
          { error, reportId }
        );
        throw error;
      }
    });
  }
}

export const equipmentDamageService = new EquipmentDamageService();
