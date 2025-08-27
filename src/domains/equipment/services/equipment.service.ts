import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '@/services/base.service';
import { ApiResponse, AppError } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import {
  Equipment,
  CreateEquipmentFormData,
  EquipmentListResponse,
} from '../types';
import {
  equipmentCategoriesService,
  equipmentLocationsService,
} from './equipmentCategories.service';

class EquipmentService extends BaseService<Equipment> {
  constructor() {
    super('equipment');
  }

  async getEquipment(
    page: number = 1,
    limit: number = 10,
    search?: string,
    category_id?: string,
    availability_status?: string
  ): Promise<EquipmentListResponse> {
    Logger.getInstance().info('EquipmentService.getEquipment', {
      page,
      limit,
      search,
      category_id,
      availability_status,
    });

    let query = supabase
      .from('equipment')
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*),
        borrowings:equipment_borrowings(
          id,
          status,
          borrowed_at,
          expected_return_date,
          student:cohort_students(
            id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,serial_number.ilike.%${search}%`
      );
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (availability_status) {
      query = query.eq('availability_status', availability_status);
    }

    const { data, error } = await query.range(
      (page - 1) * limit,
      page * limit - 1
    );

    if (error) {
      Logger.getInstance().error(
        'EquipmentService.getEquipment - query error',
        { error }
      );
      throw error;
    }

    // Get count separately
    let countQuery = supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,serial_number.ilike.%${search}%`
      );
    }

    if (category_id) {
      countQuery = countQuery.eq('category_id', category_id);
    }

    if (availability_status) {
      countQuery = countQuery.eq('availability_status', availability_status);
    }

    const { count } = await countQuery;

    Logger.getInstance().info(
      'EquipmentService.getEquipment - returning data',
      {
        equipmentCount: data?.length || 0,
        total: count || 0,
        page,
        limit,
      }
    );

    return {
      equipment: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  async getEquipmentById(id: string): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        category:equipment_categories(*),
        location:equipment_locations(*),
        borrowings:equipment_borrowings(
          *,
          student:cohort_students(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      Logger.getInstance().error('EquipmentService.getEquipmentById - error', {
        error,
        id,
      });
      throw error;
    }

    return data;
  }

  async createEquipment(data: CreateEquipmentFormData): Promise<Equipment> {
    return this.executeQuery(async () => {
      const { data: equipment, error } = await supabase
        .from('equipment')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select(
          `
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error('EquipmentService.createEquipment - error', {
          error,
          data,
        });
        throw error;
      }

      return equipment;
    });
  }

  async updateEquipment(
    id: string,
    data: Partial<CreateEquipmentFormData>
  ): Promise<Equipment> {
    return this.executeQuery(async () => {
      const { data: equipment, error } = await supabase
        .from('equipment')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error('EquipmentService.updateEquipment - error', {
          error,
          id,
          data,
        });
        throw error;
      }

      return equipment;
    });
  }

  async deleteEquipment(id: string): Promise<void> {
    try {
      // First check if equipment has active borrowings
      const { data: activeBorrowings, error: borrowingsError } = await supabase
        .from('equipment_borrowings')
        .select('id, student_id')
        .eq('equipment_id', id)
        .eq('status', 'active');

      if (borrowingsError) {
        Logger.getInstance().error(
          'EquipmentService.deleteEquipment - error checking borrowings',
          { error: borrowingsError, id }
        );
        throw new AppError(
          borrowingsError.message || 'Failed to check equipment borrowings'
        );
      }

      if (activeBorrowings && activeBorrowings.length > 0) {
        const errorMessage = `Cannot delete equipment: It has ${activeBorrowings.length} active borrowing(s). Please return the equipment first.`;
        Logger.getInstance().error(
          'EquipmentService.deleteEquipment - equipment has active borrowings',
          {
            equipmentId: id,
            activeBorrowingsCount: activeBorrowings.length,
            borrowings: activeBorrowings,
          }
        );
        throw new AppError(errorMessage);
      }

      // Check for damage reports
      const { data: damageReports, error: damageError } = await supabase
        .from('equipment_damage_reports')
        .select('id')
        .eq('equipment_id', id);

      if (damageError) {
        Logger.getInstance().error(
          'EquipmentService.deleteEquipment - error checking damage reports',
          { error: damageError, id }
        );
        throw new AppError(
          damageError.message || 'Failed to check equipment damage reports'
        );
      }

      if (damageReports && damageReports.length > 0) {
        Logger.getInstance().warn(
          'EquipmentService.deleteEquipment - equipment has damage reports',
          {
            equipmentId: id,
            damageReportsCount: damageReports.length,
          }
        );
        // Continue with deletion but log the warning
      }

      // Proceed with deletion
      const { error } = await supabase.from('equipment').delete().eq('id', id);

      if (error) {
        Logger.getInstance().error('EquipmentService.deleteEquipment - error', {
          error,
          id,
        });

        // Handle foreign key constraint violations with a user-friendly message
        if (
          error.code === '23503' &&
          error.message.includes('equipment_borrowings')
        ) {
          throw new AppError(
            'Cannot delete equipment: It has active borrowings. Please return the equipment first.'
          );
        }

        throw new AppError(error.message || 'Failed to delete equipment');
      }

      Logger.getInstance().info('EquipmentService.deleteEquipment - success', {
        equipmentId: id,
      });
    } catch (error) {
      Logger.getInstance().error(
        'EquipmentService.deleteEquipment - unexpected error',
        { error, id }
      );
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message);
      }
      throw new AppError('Failed to delete equipment. Please try again.');
    }
  }

  async updateEquipmentStatus(id: string, status: string): Promise<Equipment> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment')
        .update({
          availability_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          category:equipment_categories(*),
          location:equipment_locations(*)
        `
        )
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentService.updateEquipmentStatus - error',
          { error, id, status }
        );
        throw error;
      }

      return data;
    });
  }

  // Delegate to specialized services
  async getCategories() {
    Logger.getInstance().info('EquipmentService.getCategories - starting');
    try {
      const categories = await equipmentCategoriesService.getCategories();
      Logger.getInstance().info('EquipmentService.getCategories - response', {
        responseType: typeof categories,
        hasData: !!categories,
        isArray: Array.isArray(categories),
        categoriesCount: categories?.length || 0,
      });

      Logger.getInstance().info(
        'EquipmentService.getCategories - processed categories',
        {
          categoriesCount: categories.length,
          categories: categories.map(c => ({ id: c.id, name: c.name })),
        }
      );

      return {
        categories,
        total: categories.length,
      };
    } catch (error) {
      Logger.getInstance().error('EquipmentService.getCategories - error', {
        error,
      });
      throw error;
    }
  }

  async getLocations() {
    Logger.getInstance().info('EquipmentService.getLocations - starting');
    try {
      const locations = await equipmentLocationsService.getLocations();
      Logger.getInstance().info('EquipmentService.getLocations - response', {
        responseType: typeof locations,
        hasData: !!locations,
        isArray: Array.isArray(locations),
        locationsCount: locations?.length || 0,
      });

      Logger.getInstance().info(
        'EquipmentService.getLocations - processed locations',
        {
          locationsCount: locations.length,
          locations: locations.map(l => ({ id: l.id, name: l.name })),
        }
      );

      return {
        locations,
        total: locations.length,
      };
    } catch (error) {
      Logger.getInstance().error('EquipmentService.getLocations - error', {
        error,
      });
      throw error;
    }
  }

  async createCategory(categoryData: any) {
    return equipmentCategoriesService.createCategory(categoryData);
  }

  async createLocation(locationData: any) {
    return equipmentLocationsService.createLocation(locationData);
  }

  async getEquipmentStats() {
    const { data, error } = await supabase
      .from('equipment')
      .select('availability_status, condition_status');

    if (error) {
      Logger.getInstance().error('EquipmentService.getEquipmentStats - error', {
        error,
      });
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      available:
        data?.filter(e => e.availability_status === 'available').length || 0,
      borrowed:
        data?.filter(e => e.availability_status === 'borrowed').length || 0,
      maintenance:
        data?.filter(e => e.availability_status === 'maintenance').length || 0,
      damaged: data?.filter(e => e.condition_status === 'damaged').length || 0,
      lost: data?.filter(e => e.availability_status === 'lost').length || 0,
    };

    return stats;
  }

  // Equipment status management methods
  async markAsLost(id: string): Promise<Equipment> {
    return this.updateEquipmentStatus(id, 'lost');
  }

  async markAsDamaged(id: string): Promise<Equipment> {
    return this.updateEquipmentStatus(id, 'damaged');
  }

  async markAsActive(id: string): Promise<Equipment> {
    return this.updateEquipmentStatus(id, 'available');
  }

  async markAsRetired(id: string): Promise<Equipment> {
    return this.updateEquipmentStatus(id, 'retired');
  }

  async cloneEquipment(id: string): Promise<Equipment> {
    // Get the original equipment
    const original = await this.getEquipmentById(id);
    if (!original) {
      throw new Error('Equipment not found');
    }

    // Create a copy with modified name
    const cloneData = {
      ...original,
      name: `${original.name} (Copy)`,
      serial_number: `${original.serial_number}_copy`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    delete cloneData.id; // Remove the ID so it creates a new record

    return this.createEquipment(cloneData);
  }

  async getRecentBorrowings(limit: number = 5) {
    const { data, error } = await supabase
      .from('equipment_borrowings')
      .select(
        `
        *,
        equipment:equipment(*),
        student:cohort_students(*)
      `
      )
      .order('borrowed_at', { ascending: false })
      .limit(limit);

    if (error) {
      Logger.getInstance().error(
        'EquipmentService.getRecentBorrowings - error',
        { error }
      );
      throw error;
    }

    return data || [];
  }

  async getOverdueBorrowings() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('equipment_borrowings')
      .select(
        `
        *,
        equipment:equipment(*),
        student:cohort_students(*)
      `
      )
      .lt('expected_return_date', today)
      .eq('status', 'active');

    if (error) {
      Logger.getInstance().error(
        'EquipmentService.getOverdueBorrowings - error',
        { error }
      );
      throw error;
    }

    return data || [];
  }
}

export const equipmentService = new EquipmentService();
