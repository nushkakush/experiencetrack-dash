import { supabase } from '@/integrations/supabase/client';
import {
  ProfileExtended,
  ProfileExtendedInsert,
  ProfileExtendedUpdate,
} from '@/types/profileExtended';
import { Logger } from '@/lib/logging/Logger';
import { MeritoService } from './merito.service';

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
    let saveSuccessful = false;

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
        } else {
          saveSuccessful = true;
          Logger.getInstance().info('Successfully updated profile extended', {
            profileId,
            fieldsUpdated: Object.keys(changesToSave),
          });
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
        } else {
          saveSuccessful = true;
          Logger.getInstance().info('Successfully created profile extended', {
            profileId,
            fieldsCreated: Object.keys(changesToSave),
          });
        }
      }

      // If save was successful and we have significant profile data, sync to Meritto
      console.log('💾 Save completed, checking if should sync to MERITTO:', {
        saveSuccessful,
        changesCount: Object.keys(changesToSave).length,
        changes: Object.keys(changesToSave)
      });
      
      if (saveSuccessful && this.shouldSyncToMerito(changesToSave)) {
        console.log('✅ Triggering real-time MERITTO sync...');
        // Use real-time sync for auto-save (non-blocking)
        this.realtimeSyncToMerito(profileId).catch(error => {
          console.warn('Real-time sync failed during auto-save:', error);
        });
      } else {
        console.log('⏭️ Skipping MERITTO sync:', {
          saveSuccessful,
          shouldSync: this.shouldSyncToMerito(changesToSave)
        });
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
   * Force save and explicitly sync to Meritto (for extended registration completion)
   */
  async forceSaveAndSyncToMerito(profileId: string): Promise<void> {
    // First force save all pending changes
    await this.forceSave(profileId);
    
    // Then explicitly sync to Meritto
    await this.syncExtendedRegistrationToMerito(profileId);
  }

  /**
   * Real-time sync to Meritto (called during form changes)
   */
  async realtimeSyncToMerito(profileId: string, additionalData?: any): Promise<void> {
    try {
      console.log('🚀 Starting real-time MERITTO sync for profileId:', profileId);
      
      // Get the application data to get the application ID
      const applicationData = await this.getApplicationData(profileId);
      if (!applicationData) {
        console.log('❌ Application not found for real-time Meritto sync', { profileId });
        return;
      }

      console.log('🔄 Real-time Merito sync via Edge Function:', {
        profileId,
        applicationId: applicationData.id,
        additionalData
      });

      // Call the Edge Function for real-time sync
      const { data: syncResult, error: syncError } = await supabase.functions.invoke(
        'merito-registration-sync',
        {
          body: {
            profileId: profileId,
            applicationId: applicationData.id,
            syncType: 'realtime',
            ...additionalData
          }
        }
      );

      if (syncError) {
        console.error('❌ [PROFILE EXTENDED] Real-time Meritto sync failed:', {
          error: syncError,
          message: syncError.message,
          details: syncError.details,
          hint: syncError.hint,
          code: syncError.code,
          profileId,
          applicationId: applicationData.id,
          additionalData
        });
        return; // Don't throw error for real-time sync failures
      }

      if (syncResult?.success) {
        console.log('✅ [PROFILE EXTENDED] Real-time sync to Merito completed', {
          leadId: syncResult.leadId,
          profileId,
          applicationId: applicationData.id,
          message: syncResult.message
        });
        
        // Also trigger a full sync to ensure all extended profile data is updated
        try {
          const { data: fullSyncResult, error: fullSyncError } = await supabase.functions.invoke(
            'merito-registration-sync',
            {
              body: {
                profileId: profileId,
                applicationId: applicationData.id,
                syncType: 'registration'
              }
            }
          );
          
          if (fullSyncError) {
            console.error('❌ [PROFILE EXTENDED] Full sync after real-time failed:', {
              error: fullSyncError,
              message: fullSyncError.message,
              details: fullSyncError.details,
              profileId,
              applicationId: applicationData.id
            });
          } else if (fullSyncResult?.success) {
            console.log('✅ [PROFILE EXTENDED] Full sync to Merito completed after real-time sync', {
              leadId: fullSyncResult.leadId,
              profileId,
              applicationId: applicationData.id
            });
          }
        } catch (fullSyncError) {
          console.error('❌ [PROFILE EXTENDED] Full sync error (non-blocking):', {
            error: fullSyncError,
            profileId,
            applicationId: applicationData.id
          });
        }
      }

    } catch (error) {
      console.error('❌ [PROFILE EXTENDED] Real-time Meritto sync error (non-blocking):', {
        error,
        profileId,
        applicationId: applicationData?.id,
        additionalData
      });
      // Don't throw error for real-time sync failures
    }
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

  /**
   * Determine if the changes are significant enough to trigger Meritto sync
   */
  private shouldSyncToMerito(changes: Partial<ProfileExtendedUpdate>): boolean {
    // Always sync for any changes during real-time updates
    // This ensures all field updates are synced to MERITTO
    const hasChanges = Object.keys(changes).length > 0;
    
    if (hasChanges) {
      console.log('🔄 Changes detected, triggering MERITTO sync:', Object.keys(changes));
      return true;
    }
    
    return false;
  }

  /**
   * Sync extended registration data to Meritto CRM
   */
  private async syncExtendedRegistrationToMerito(profileId: string): Promise<void> {
    try {
      // Only sync if Meritto is enabled
      if (!MeritoService.isEnabled()) {
        Logger.getInstance().info('Meritto integration disabled, skipping sync', { profileId });
        return;
      }

      // Get the complete profile data
      const [profileData, applicationData, extendedProfileData] = await Promise.all([
        this.getProfileData(profileId),
        this.getApplicationData(profileId),
        this.getProfileExtended(profileId)
      ]);

      if (!profileData || !applicationData) {
        Logger.getInstance().warn('Missing profile or application data for Meritto sync', { 
          profileId,
          hasProfile: !!profileData,
          hasApplication: !!applicationData
        });
        return;
      }

      // Call the Edge Function for extended registration sync
      const { data: syncResult, error: syncError } = await supabase.functions.invoke(
        'merito-registration-sync',
        {
          body: {
            profileId: profileId,
            applicationId: applicationData.id,
            syncType: 'extended'
          }
        }
      );

      if (syncError) {
        throw new Error(`Edge Function error: ${syncError.message}`);
      }

      if (!syncResult?.success) {
        throw new Error(syncResult?.error || 'Unknown sync error');
      }

      Logger.getInstance().info('Successfully synced extended registration to Meritto', {
        profileId,
        applicationId: applicationData.id,
        leadId: syncResult.leadId
      });
    } catch (error) {
      Logger.getInstance().error('Failed to sync extended registration to Meritto', {
        error,
        profileId
      });
      // Don't throw error to avoid breaking the save operation
    }
  }

  /**
   * Get profile data for Meritto sync
   */
  private async getProfileData(profileId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        Logger.getInstance().error('Failed to get profile data for Meritto sync', { error, profileId });
        return null;
      }

      return data;
    } catch (error) {
      Logger.getInstance().error('Error getting profile data for Meritto sync', { error, profileId });
      return null;
    }
  }

  /**
   * Get application data for Meritto sync
   */
  private async getApplicationData(profileId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        Logger.getInstance().error('Failed to get application data for Meritto sync', { error, profileId });
        return null;
      }

      return data;
    } catch (error) {
      Logger.getInstance().error('Error getting application data for Meritto sync', { error, profileId });
      return null;
    }
  }
}
