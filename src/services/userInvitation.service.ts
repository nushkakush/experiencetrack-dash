import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { UserRole } from '@/types/auth';
import { emailService } from '@/services/email.service';

export interface UserInvitation {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  invitation_token: string;
  invitation_expires_at: string;
  invite_status: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at?: string;
  accepted_at?: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInvitationData {
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
}

class UserInvitationService {
  async createInvitation(
    data: CreateUserInvitationData,
    invitedBy: string
  ): Promise<ApiResponse<UserInvitation>> {
    try {
      // Set invitation expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('user_invitations')
        .insert({
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          invitation_expires_at: expiresAt.toISOString(),
          invited_by: invitedBy,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: invitation, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  async sendInvitationEmail(
    invitationId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ): Promise<ApiResponse<{ invitationUrl: string; emailSent: boolean }>> {
    try {
      // Use the new unified email service
      const result = await emailService.sendInvitationEmail(
        invitationId,
        email,
        firstName,
        lastName,
        `LIT OS ${role.replace('_', ' ')} Team`,
        'user'
      );

      if (result.success) {
        // Mark the invitation as sent in the database
        await this.markInvitationSent(invitationId);
      }

      return result;
    } catch (error) {
      // Fallback: create invitation URL without sending email
      const baseUrl = window.location.origin;
      const invitationUrl = `${baseUrl}/user-invite/${invitationId}`;

      // Mark the invitation as sent in the database
      await this.markInvitationSent(invitationId);

      return {
        data: {
          invitationUrl,
          emailSent: false,
        },
        error: null,
        success: true,
      };
    }
  }

  async getInvitationByToken(
    token: string
  ): Promise<ApiResponse<UserInvitation>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .maybeSingle();

      if (error) {
        console.error('Database error fetching invitation:', error);
        throw error;
      }

      if (!data) {
        return { data: null, error: 'Invitation not found', success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getInvitationByToken:', error);
      return { data: null, error: error.message, success: false };
    }
  }

  async markInvitationSent(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({
          invite_status: 'sent',
          invited_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  async markInvitationAccepted(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .update({
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  async getAllInvitations(): Promise<ApiResponse<UserInvitation[]>> {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }

  async deleteInvitation(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null, success: true };
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }
}

export const userInvitationService = new UserInvitationService();
