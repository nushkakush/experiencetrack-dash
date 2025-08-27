import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '@/services/base.service';
import { ApiResponse } from '@/types/common';
import { Logger } from '@/lib/logging/Logger';
import {
  EquipmentCategory,
  EquipmentLocation,
  CreateCategoryFormData,
  CreateLocationFormData,
  CategoryListResponse,
  LocationListResponse,
} from '../types';

class EquipmentCategoriesService extends BaseService<EquipmentCategory> {
  constructor() {
    super('equipment_categories');
  }

  async getCategories(): Promise<EquipmentCategory[]> {
    Logger.getInstance().info(
      'EquipmentCategoriesService.getCategories - starting database query'
    );

    const { data, error } = await supabase
      .from('equipment_categories')
      .select('*')
      .order('name', { ascending: true });

    Logger.getInstance().info(
      'EquipmentCategoriesService.getCategories - query result',
      {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        error: error?.message || null,
      }
    );

    if (error) {
      Logger.getInstance().error(
        'EquipmentCategoriesService.getCategories - error',
        { error }
      );
      throw error;
    }

    Logger.getInstance().info(
      'EquipmentCategoriesService.getCategories - returning data',
      {
        categories: data?.map(c => ({ id: c.id, name: c.name })) || [],
      }
    );

    return data || [];
  }

  async createCategory(
    categoryData: CreateCategoryFormData
  ): Promise<EquipmentCategory> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .insert({
          ...categoryData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select('*')
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentCategoriesService.createCategory - error',
          { error, categoryData }
        );
        throw error;
      }

      return data;
    });
  }

  async updateCategory(
    id: string,
    categoryData: Partial<CreateCategoryFormData>
  ): Promise<EquipmentCategory> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_categories')
        .update({
          ...categoryData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentCategoriesService.updateCategory - error',
          { error, id, categoryData }
        );
        throw error;
      }

      return data;
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('equipment_categories')
        .delete()
        .eq('id', id);

      if (error) {
        Logger.getInstance().error(
          'EquipmentCategoriesService.deleteCategory - error',
          { error, id }
        );
        throw error;
      }
    });
  }
}

class EquipmentLocationsService extends BaseService<EquipmentLocation> {
  constructor() {
    super('equipment_locations');
  }

  async getLocations(): Promise<EquipmentLocation[]> {
    Logger.getInstance().info(
      'EquipmentLocationsService.getLocations - starting database query'
    );

    const { data, error } = await supabase
      .from('equipment_locations')
      .select('*')
      .order('name', { ascending: true });

    Logger.getInstance().info(
      'EquipmentLocationsService.getLocations - query result',
      {
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        error: error?.message || null,
      }
    );

    if (error) {
      Logger.getInstance().error(
        'EquipmentLocationsService.getLocations - error',
        { error }
      );
      throw error;
    }

    Logger.getInstance().info(
      'EquipmentLocationsService.getLocations - returning data',
      {
        locations: data?.map(l => ({ id: l.id, name: l.name })) || [],
      }
    );

    return data || [];
  }

  async createLocation(
    locationData: CreateLocationFormData
  ): Promise<EquipmentLocation> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_locations')
        .insert({
          ...locationData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select('*')
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentLocationsService.createLocation - error',
          { error, locationData }
        );
        throw error;
      }

      return data;
    });
  }

  async updateLocation(
    id: string,
    locationData: Partial<CreateLocationFormData>
  ): Promise<EquipmentLocation> {
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('equipment_locations')
        .update({
          ...locationData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        Logger.getInstance().error(
          'EquipmentLocationsService.updateLocation - error',
          { error, id, locationData }
        );
        throw error;
      }

      return data;
    });
  }

  async deleteLocation(id: string): Promise<void> {
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from('equipment_locations')
        .delete()
        .eq('id', id);

      if (error) {
        Logger.getInstance().error(
          'EquipmentLocationsService.deleteLocation - error',
          { error, id }
        );
        throw error;
      }
    });
  }
}

export const equipmentCategoriesService = new EquipmentCategoriesService();
export const equipmentLocationsService = new EquipmentLocationsService();
