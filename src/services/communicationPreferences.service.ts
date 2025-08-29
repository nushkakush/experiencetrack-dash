import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommunicationPreferences {
  automated_communications: {
    email: {
      enabled: boolean;
      last_updated: string | null;
    };
    whatsapp: {
      enabled: boolean;
      last_updated: string | null;
    };
  };
  manual_communications: {
    email: boolean;
    whatsapp: boolean;
  };
}

export interface UpdatePreferenceParams {
  studentId: string;
  channel: 'email' | 'whatsapp';
  type: 'automated' | 'manual';
  enabled: boolean;
}

export class CommunicationPreferencesService {
  /**
   * Get communication preferences for a student
   */
  static async getPreferences(
    studentId: string
  ): Promise<CommunicationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('cohort_students')
        .select('communication_preferences')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Error fetching communication preferences:', error);
        return null;
      }

      return data?.communication_preferences || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error fetching communication preferences:', error);
      return null;
    }
  }

  /**
   * Update a specific communication preference
   */
  static async updatePreference({
    studentId,
    channel,
    type,
    enabled,
  }: UpdatePreferenceParams): Promise<boolean> {
    try {
      // First, get current preferences
      const currentPreferences = await this.getPreferences(studentId);
      if (!currentPreferences) {
        toast.error('Failed to load current preferences');
        return false;
      }

      // Update the specific preference
      const updatedPreferences = { ...currentPreferences };

      if (type === 'automated') {
        updatedPreferences.automated_communications[channel] = {
          enabled,
          last_updated: new Date().toISOString(),
        };
      } else {
        updatedPreferences.manual_communications[channel] = enabled;
      }

      // Save to database
      const { error } = await supabase
        .from('cohort_students')
        .update({ communication_preferences: updatedPreferences })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating communication preferences:', error);
        toast.error('Failed to update communication preferences');
        return false;
      }

      const channelName = channel === 'whatsapp' ? 'WhatsApp' : 'Email';
      const typeName =
        type === 'automated'
          ? 'automated communications'
          : 'manual communications';
      const status = enabled ? 'enabled' : 'disabled';

      toast.success(`${channelName} ${typeName} ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating communication preferences:', error);
      toast.error('Failed to update communication preferences');
      return false;
    }
  }

  /**
   * Get default communication preferences
   */
  static getDefaultPreferences(): CommunicationPreferences {
    return {
      automated_communications: {
        email: {
          enabled: false,
          last_updated: null,
        },
        whatsapp: {
          enabled: false,
          last_updated: null,
        },
      },
      manual_communications: {
        email: true,
        whatsapp: true,
      },
    };
  }
}
