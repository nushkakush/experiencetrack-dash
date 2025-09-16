import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';

export interface FailedEmailNotification {
  id: string;
  email: string;
  token: string;
  cohort_id: string;
  verification_url: string;
  type: 'verification' | 'invitation' | 'user_invitation';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export class FailedEmailNotificationService {
  /**
   * Get failed email notifications for a specific email
   */
  static async getFailedNotificationsForEmail(email: string): Promise<{
    data: FailedEmailNotification[] | null;
    error: string | null;
    success: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('failed_email_notifications')
        .select('*')
        .eq('email', email)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error('Failed to fetch failed email notifications', {
          error: error.message,
          email,
        });
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error fetching failed email notifications', {
        error: errorMessage,
        email,
      });
      return { data: null, error: errorMessage, success: false };
    }
  }

  /**
   * Mark a failed notification as resolved
   */
  static async markAsResolved(
    notificationId: string,
    resolvedBy: string,
    notes?: string
  ): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { error } = await supabase
        .from('failed_email_notifications')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          notes,
        })
        .eq('id', notificationId);

      if (error) {
        Logger.getInstance().error('Failed to mark notification as resolved', {
          error: error.message,
          notificationId,
        });
        return { success: false, error: error.message };
      }

      Logger.getInstance().info('Notification marked as resolved', {
        notificationId,
        resolvedBy,
      });
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error marking notification as resolved', {
        error: errorMessage,
        notificationId,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get all unresolved failed notifications (for admin purposes)
   */
  static async getAllUnresolvedNotifications(): Promise<{
    data: FailedEmailNotification[] | null;
    error: string | null;
    success: boolean;
  }> {
    try {
      const { data, error } = await supabase
        .from('failed_email_notifications')
        .select(`
          *,
          cohorts:cohort_id (
            name
          )
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        Logger.getInstance().error('Failed to fetch all unresolved notifications', {
          error: error.message,
        });
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error fetching all unresolved notifications', {
        error: errorMessage,
      });
      return { data: null, error: errorMessage, success: false };
    }
  }

  /**
   * Retry sending email for a failed notification
   */
  static async retryEmailNotification(notificationId: string): Promise<{
    success: boolean;
    error: string | null;
    emailSent: boolean;
  }> {
    try {
      // Get the notification details
      const { data: notification, error: fetchError } = await supabase
        .from('failed_email_notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (fetchError || !notification) {
        return { success: false, error: 'Notification not found', emailSent: false };
      }

      // Retry sending the email
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type: notification.type,
          recipient: {
            email: notification.email,
            name: 'User', // We don't have the name stored
          },
          verificationToken: notification.token,
          cohortId: notification.cohort_id,
          origin: window.location.origin,
        }),
      });

      const emailResult = await response.json();

      if (emailResult.success) {
        // Mark as resolved
        await this.markAsResolved(notificationId, 'system', 'Email sent successfully on retry');
        return { success: true, error: null, emailSent: true };
      } else {
        return { success: false, error: emailResult.error, emailSent: false };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.getInstance().error('Error retrying email notification', {
        error: errorMessage,
        notificationId,
      });
      return { success: false, error: errorMessage, emailSent: false };
    }
  }
}
