/**
 * Base service class with common functionality
 * Implements repository pattern for data access layer
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse, PaginatedResponse, FilterParams, AppError } from '@/types/common';
import { APP_CONFIG, ERROR_MESSAGES } from '@/config/constants';

export abstract class BaseService<T = any> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Generic method to fetch data with error handling
   */
  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error(`Database error in ${this.tableName}:`, error);
        throw new AppError(
          error.message || ERROR_MESSAGES.GENERIC_ERROR,
          error.code,
          error.status
        );
      }

      return {
        data: data as T,
        error: null,
        success: true,
      };
    } catch (error) {
      console.error(`Service error in ${this.tableName}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  /**
   * Generic method to fetch paginated data
   */
  protected async fetchPaginated<U>(
    filters: FilterParams = {}
  ): Promise<PaginatedResponse<U>> {
    const {
      page = 1,
      pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = filters;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(this.tableName as any)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Add search functionality if implemented in subclasses
    if (search) {
      query = this.applySearchFilter(query, search);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new AppError(error.message, error.code);
    }

    return {
      data: data as U[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Override this method in subclasses to implement search functionality
   */
  protected applySearchFilter(query: any, search: string): any {
    return query;
  }

  /**
   * Generic CRUD operations
   */
  async findById<U>(id: string): Promise<ApiResponse<U>> {
    return this.executeQuery(async () => {
      return await supabase
        .from(this.tableName as any)
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create<U>(data: Partial<U>): Promise<ApiResponse<U>> {
    return this.executeQuery(async () => {
      return await supabase
        .from(this.tableName as any)
        .insert(data as any)
        .select()
        .single();
    });
  }

  async update<U>(id: string, data: Partial<U>): Promise<ApiResponse<U>> {
    return this.executeQuery(async () => {
      return await supabase
        .from(this.tableName as any)
        .update(data as any)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    return this.executeQuery(async () => {
      return await supabase
        .from(this.tableName as any)
        .delete()
        .eq('id', id);
    });
  }

  /**
   * Batch operations for better performance
   */
  async createMany<U>(items: Partial<U>[]): Promise<ApiResponse<U[]>> {
    return this.executeQuery(async () => {
      return await supabase
        .from(this.tableName as any)
        .insert(items as any)
        .select();
    });
  }

  async updateMany<U>(
    filter: Record<string, any>,
    data: Partial<U>
  ): Promise<ApiResponse<U[]>> {
    return this.executeQuery(async () => {
      let query = supabase
        .from(this.tableName as any)
        .update(data as any);

      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      return await query.select();
    });
  }
}