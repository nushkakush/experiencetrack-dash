import { supabase } from '@/integrations/supabase/client';
import {
  ProfileExtended,
  ProfileExtendedInsert,
  ProfileExtendedUpdate,
} from '@/types/profileExtended';
import { Logger } from '@/lib/logging/Logger';

export class ProfileExtendedService {
  private static instance: ProfileExtendedService;
  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: Partial<ProfileExtendedUpdate> = {};
  private isSaving = false;

  private constructor() {}

  public static getInstance(): ProfileExtendedService {
    if (!ProfileExtendedService.instance) {
      ProfileExtendedService.instance = new ProfileExtendedService();
    }
    return ProfileExtendedService.instance;
  }

  /**
   * Get profile extended data for the current user
   */
  async getProfileExtended(profileId: string): Promise<ProfileExtended | null> {
    try {
      const { data, error } = await supabase
        .from('profile_extended')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, return null
          return null;
        }
        Logger.getInstance().error('Failed to get profile extended data', {
          error,
        });
        throw error;
      }

      return data;
    } catch (error) {
      Logger.getInstance().error('Error getting profile extended data', {
        error,
      });
      throw error;
    }
  }

  /**
   * Create initial profile extended record
   */
  async createProfileExtended(
    data: ProfileExtendedInsert
  ): Promise<ProfileExtended> {
    try {
      const { data: result, error } = await supabase
        .from('profile_extended')
        .insert(data)
        .select()
        .single();

      if (error) {
        Logger.getInstance().error('Failed to create profile extended', {
          error,
        });
        throw error;
      }

      return result;
    } catch (error) {
      Logger.getInstance().error('Error creating profile extended', { error });
      throw error;
    }
  }

  /**
   * Update profile extended data with debounced auto-save
   */
  async updateProfileExtended(
    profileId: string,
    updates: Partial<ProfileExtendedUpdate>,
    immediate = false
  ): Promise<void> {
    // Merge with pending changes
    this.pendingChanges = { ...this.pendingChanges, ...updates };

    if (immediate) {
      // Save immediately
      await this.savePendingChanges(profileId);
    } else {
      // Debounce the save operation
      this.debouncedSave(profileId);
    }
  }

  /**
   * Debounced save to prevent too many API calls
   */
  private debouncedSave(profileId: string): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.savePendingChanges(profileId);
    }, 1000); // 1 second delay
  }

  /**
   * Save all pending changes to the database
   */
  private async savePendingChanges(profileId: string): Promise<void> {
    if (this.isSaving || Object.keys(this.pendingChanges).length === 0) {
      return;
    }

    this.isSaving = true;
    const changesToSave = { ...this.pendingChanges };
    this.pendingChanges = {};

    try {
      // Check if record exists
      const existingRecord = await this.getProfileExtended(profileId);

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('profile_extended')
          .update(changesToSave)
          .eq('profile_id', profileId);

        if (error) {
          Logger.getInstance().error('Failed to update profile extended', {
            error,
          });
          // Put changes back in pending queue for retry
          this.pendingChanges = { ...this.pendingChanges, ...changesToSave };
        }
      } else {
        // Create new record
        const { error } = await supabase.from('profile_extended').insert({
          profile_id: profileId,
          ...changesToSave,
        });

        if (error) {
          Logger.getInstance().error('Failed to create profile extended', {
            error,
          });
          // Put changes back in pending queue for retry
          this.pendingChanges = { ...this.pendingChanges, ...changesToSave };
        }
      }
    } catch (error) {
      Logger.getInstance().error('Error saving profile extended changes', {
        error,
      });
      // Put changes back in pending queue for retry
      this.pendingChanges = { ...this.pendingChanges, ...changesToSave };
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Force save all pending changes immediately
   */
  async forceSave(profileId: string): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.savePendingChanges(profileId);
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return Object.keys(this.pendingChanges).length;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return Object.keys(this.pendingChanges).length > 0;
  }

  /**
   * Clear pending changes (use with caution)
   */
  clearPendingChanges(): void {
    this.pendingChanges = {};
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}
