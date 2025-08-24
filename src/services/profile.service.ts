/**
 * Profile service implementing business logic for user profiles
 * Enterprise-level service layer with proper error handling and validation
 */

import { BaseService } from './base.service';
import { UserProfile } from '@/types/auth';
import { ApiResponse, FilterParams } from '@/types/common';
import { supabase } from '@/integrations/supabase/client';

export class ProfileService extends BaseService {
  constructor() {
    super('profiles');
  }

  /**
   * Get profile by user ID
   */
  async getByUserId(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.executeQuery(async () => {
      return await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    });
  }

  /**
   * Update profile with validation
   */
  async updateProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    // Validate updates
    const validatedUpdates = this.validateProfileUpdates(updates);

    return this.executeQuery(async () => {
      return await supabase
        .from('profiles')
        .update(validatedUpdates)
        .eq('user_id', userId)
        .select()
        .single();
    });
  }

  /**
   * Search profiles (for admin users)
   */
  async searchProfiles(filters: FilterParams & { role?: string }) {
    const { role, ...baseFilters } = filters;

    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role as string);
    }

    return this.fetchPaginated<UserProfile>(baseFilters);
  }

  /**
   * Apply search filter for profiles
   */
  protected applySearchFilter(query: unknown, search: string): unknown {
    return (query as unknown).or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  /**
   * Validate profile updates
   */
  private validateProfileUpdates(
    updates: Partial<UserProfile>
  ): Partial<UserProfile> {
    const validated: Partial<UserProfile> = {};

    if (updates.first_name !== undefined) {
      validated.first_name = updates.first_name?.trim() || null;
    }

    if (updates.last_name !== undefined) {
      validated.last_name = updates.last_name?.trim() || null;
    }

    if (updates.email !== undefined) {
      const email = updates.email?.trim().toLowerCase();
      if (email && !this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      validated.email = email || null;
    }

    if (updates.avatar_url !== undefined) {
      validated.avatar_url = updates.avatar_url || null;
    }

    // Don't allow role updates through this method
    // Role updates should go through a separate admin-only method

    return validated;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get profile stats (for dashboard)
   */
  async getProfileStats() {
    return this.executeQuery(async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) throw error;

      const stats =
        profiles?.reduce(
          (acc, profile) => {
            acc[profile.role] = (acc[profile.role] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ) || {};

      return { data: stats, error: null };
    });
  }
}

// Export singleton instance
export const profileService = new ProfileService();
