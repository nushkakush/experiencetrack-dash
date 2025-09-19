import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type {
  ProfileData,
  ExtendedProfileData,
  ApplicationData,
  SyncType,
} from './types.ts';

/**
 * Data fetching utilities for Meritto sync
 */
export class DataFetcher {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Fetch profile data by ID
   */
  async fetchProfile(profileId: string): Promise<ProfileData> {
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error(
        `Profile not found: ${profileError?.message || 'Unknown error'}`
      );
    }

    return profile;
  }

  /**
   * Fetch extended profile data by profile ID
   */
  async fetchExtendedProfile(
    profileId: string
  ): Promise<ExtendedProfileData | null> {
    const { data: extendedData } = await this.supabase
      .from('profile_extended')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    return extendedData;
  }

  /**
   * Fetch application data with cohort and epic learning path information
   */
  async fetchApplication(
    applicationId: string | undefined,
    profileId: string,
    syncType: SyncType
  ): Promise<ApplicationData> {
    let application;
    let applicationError;

    if (applicationId) {
      // If applicationId is provided, fetch by ID
      const result = await this.supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            cohort_id,
            name,
            description,
            start_date,
            end_date,
            created_at,
            epic_learning_path_id,
            epic_learning_path:epic_learning_paths(
              id,
              title
            )
          )
        `
        )
        .eq('id', applicationId)
        .single();

      application = result.data;
      applicationError = result.error;
    } else if (syncType === 'realtime' || syncType === 'extended') {
      // For realtime/extended sync without applicationId, find the most recent application for this profile
      console.log(
        `🔍 Finding most recent application for profile (${syncType} sync)...`
      );

      const result = await this.supabase
        .from('student_applications')
        .select(
          `
          *,
          cohort:cohorts(
            id,
            cohort_id,
            name,
            description,
            start_date,
            end_date,
            created_at,
            epic_learning_path_id,
            epic_learning_path:epic_learning_paths(
              id,
              title
            )
          )
        `
        )
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      application = result.data;
      applicationError = result.error;

      if (application) {
        console.log(
          `✅ Found application for ${syncType} sync: ${application.id}`
        );
      }
    }

    if (applicationError || !application) {
      throw new Error(
        `Application not found: ${applicationError?.message || 'Unknown error'}`
      );
    }

    return application;
  }
}
