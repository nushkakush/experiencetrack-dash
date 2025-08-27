import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '@/services/base.service';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import {
  EquipmentBorrowing,
  CreateBorrowingFormData,
  BorrowingListResponse,
  ReturnEquipmentData,
  EquipmentReturn,
} from '../types';

class EquipmentBorrowingService extends BaseService<EquipmentBorrowing> {
  constructor() {
    super('equipment_borrowings');
  }

  async getBorrowings(
    page: number = 1,
    limit: number = 10,
    filters: {
      student_id?: string;
      equipment_id?: string;
      status?: string;
      cohort_id?: string;
      date_from?: string;
      date_to?: string;
      isOverdue?: boolean;
    } = {}
  ): Promise<BorrowingListResponse> {
    return this.executeQuery(async () => {
      Logger.getInstance().info('EquipmentBorrowingService.getBorrowings', {
        page,
        limit,
        filters,
      });

      let query = supabase
        .from('equipment_borrowings')
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          student:cohort_students(
            *,
            cohort:cohorts(*)
          ),
          returned_to_user:profiles!equipment_borrowings_returned_to_fkey(*)
        `
        )
        .order('borrowed_at', { ascending: false });

      // Apply filters
      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }

      if (filters.equipment_id) {
        query = query.eq('equipment_id', filters.equipment_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.cohort_id && filters.cohort_id !== 'all') {
        query = query.eq('student.cohort_id', filters.cohort_id);
      }

      if (filters.date_from) {
        query = query.gte('borrowed_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('borrowed_at', filters.date_to);
      }

      // Note: We'll filter out retired equipment after fetching since Supabase
      // doesn't reliably support filtering on joined tables with neq

      if (filters.isOverdue) {
        // Get today's date only (without time) for consistent comparison
        const today = new Date().toISOString().split('T')[0];
        query = query.lt('expected_return_date', today);
      }

      const { data, error } = await query.range(
        (page - 1) * limit,
        page * limit - 1
      );

      if (error) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.getBorrowings - query error',
          { error }
        );
        throw error;
      }

      // Filter out retired/decommissioned equipment after fetching
      const filteredData =
        data?.filter(
          borrowing =>
            borrowing.equipment &&
            borrowing.equipment.availability_status !== 'retired' &&
            borrowing.equipment.availability_status !== 'decommissioned'
        ) || [];

      return {
        borrowings: filteredData,
        total: filteredData.length, // Note: This affects pagination but ensures correct filtering
        page,
        limit,
        totalPages: Math.ceil(filteredData.length / limit),
      };
    });
  }

  async getOverdueBorrowings(): Promise<EquipmentBorrowing[]> {
    return this.executeQuery(async () => {
      // Get today's date only (without time) for consistent comparison
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('equipment_borrowings')
        .select(
          `
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          student:cohort_students(
            *,
            cohort:cohorts(*)
          )
        `
        )
        .eq('status', 'active')
        .lt('expected_return_date', today)
        .order('expected_return_date', { ascending: true });

      if (error) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.getOverdueBorrowings - error',
          { error }
        );
        throw error;
      }

      // Filter out retired/decommissioned equipment after fetching
      const filteredData =
        data?.filter(
          borrowing =>
            borrowing.equipment &&
            borrowing.equipment.availability_status !== 'retired' &&
            borrowing.equipment.availability_status !== 'decommissioned'
        ) || [];

      return filteredData;
    });
  }

  async createBorrowing(
    borrowingData: CreateBorrowingFormData
  ): Promise<EquipmentBorrowing[]> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_borrowings')
        .insert(
          borrowingData.equipment_ids.map(equipment_id => ({
            equipment_id,
            student_id: borrowingData.student_id,
            borrowed_at: new Date().toISOString(),
            expected_return_date: borrowingData.expected_return_date,
            reason: borrowingData.reason,
            notes: borrowingData.notes,
            status: 'active',
          }))
        ).select(`
          *,
          equipment:equipment(
            *,
            category:equipment_categories(*),
            location:equipment_locations(*)
          ),
          student:cohort_students(
            *,
            cohort:cohorts(*)
          )
        `);

      if (error) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.createBorrowing - error',
          { error, borrowingData }
        );
        throw error;
      }

      // Update equipment status to borrowed
      await supabase
        .from('equipment')
        .update({ availability_status: 'borrowed' })
        .in('id', borrowingData.equipment_ids);

      return data || [];
    });
  }

  async returnEquipment(
    returnData: ReturnEquipmentData
  ): Promise<EquipmentReturn> {
    return this.executeQuery(async () => {
      // Get the borrowing details first
      const { data: borrowing, error: borrowingError } = await supabase
        .from('equipment_borrowings')
        .select('*')
        .eq('id', returnData.borrowing_id)
        .single();

      if (borrowingError) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.returnEquipment - borrowing fetch error',
          { error: borrowingError }
        );
        throw borrowingError;
      }

      // Create return record
      const { data: returnRecord, error: returnError } = await supabase
        .from('equipment_returns')
        .insert({
          borrowing_id: returnData.borrowing_id,
          equipment_id: borrowing.equipment_id,
          student_id: borrowing.student_id,
          returned_at: returnData.returned_at,
          condition: returnData.condition,
          notes: returnData.notes,
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select(
          `
          *,
          borrowing:equipment_borrowings(*),
          equipment:equipment(*),
          student:cohort_students(*),
          processed_by_user:profiles!equipment_returns_processed_by_fkey(*)
        `
        )
        .single();

      if (returnError) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.returnEquipment - return creation error',
          { error: returnError }
        );
        throw returnError;
      }

      // Update borrowing status
      await supabase
        .from('equipment_borrowings')
        .update({
          status: 'returned',
          actual_return_date: returnData.returned_at,
          return_condition: returnData.condition,
          returned_to: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', returnData.borrowing_id);

      // Update equipment status and condition
      await supabase
        .from('equipment')
        .update({
          availability_status: 'available',
          condition_status: returnData.condition,
          condition_notes: returnData.notes,
        })
        .eq('id', borrowing.equipment_id);

      return returnRecord;
    });
  }

  async deleteBorrowing(borrowingId: string): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('equipment_borrowings')
        .delete()
        .eq('id', borrowingId);

      if (error) {
        Logger.getInstance().error(
          'EquipmentBorrowingService.deleteBorrowing - error',
          { error, borrowingId }
        );
        throw error;
      }
    });
  }
}

export const equipmentBorrowingService = new EquipmentBorrowingService();
