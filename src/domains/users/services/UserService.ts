/**
 * User Domain Service
 * Centralizes all user management operations
 */

import { getApiClient, ApiResponse } from '@/infrastructure/api/base-api-client';
import { Logger } from '@/lib/logging/Logger';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'super_admin' | 'fee_collector' | 'partnerships_head' | 'cohort_admin' | 'student';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  profile_picture_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  user_id: string;
  name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: User['role'];
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserFilters {
  role?: User['role'];
  status?: User['status'];
  search?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  usersByRole: Record<User['role'], number>;
  recentSignups: number; // Last 30 days
  activeInLastWeek: number;
  averageSessionDuration: number;
}

export interface PermissionCheck {
  permission: string;
  hasPermission: boolean;
  reason?: string;
}

export class UserService {
  private apiClient = getApiClient();
  private logger = Logger.getInstance();

  /**
   * Get users with filtering and pagination
   */
  async getUsers(filters: UserFilters = {}): Promise<ApiResponse<User[]>> {
    try {
      let query = this.apiClient.select('profiles', `
        *,
        user:users(*)
      `);

      // Apply filters
      if (filters.role) {
        query = query.eq('user.role', filters.role);
      }

      if (filters.status) {
        query = query.eq('user.status', filters.status);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.lastLoginAfter) {
        query = query.gte('user.last_login', filters.lastLoginAfter);
      }

      if (filters.lastLoginBefore) {
        query = query.lte('user.last_login', filters.lastLoginBefore);
      }

      if (filters.createdAfter) {
        query = query.gte('created_at', filters.createdAfter);
      }

      if (filters.createdBefore) {
        query = query.lte('created_at', filters.createdBefore);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const result = await query.order('created_at', { ascending: false });

      return {
        data: result.data as User[],
        error: result.error?.message || null,
        success: !result.error,
      };
    } catch (error) {
      this.logger.error('Failed to fetch users', { error, filters });
      return {
        data: null,
        error: 'Failed to fetch users',
        success: false,
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('profiles', `
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .maybeSingle(),
      { cache: true }
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: { user } } = await this.apiClient.auth.getUser();
      
      if (!user) {
        return {
          data: null,
          error: 'No authenticated user',
          success: false,
        };
      }

      return this.apiClient.query(
        () => this.apiClient
          .select('profiles', '*')
          .eq('user_id', user.id)
          .maybeSingle(),
        { cache: true }
      );
    } catch (error) {
      this.logger.error('Failed to get current user profile', { error });
      return {
        data: null,
        error: 'Failed to get user profile',
        success: false,
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    return this.apiClient.update(
      'profiles',
      {
        ...updates,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('user_id', userId)
    );
  }

  /**
   * Update user role and permissions
   */
  async updateUserRole(
    userId: string,
    role: User['role']
  ): Promise<ApiResponse<User>> {
    return this.apiClient.update(
      'users',
      {
        role,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', userId)
    );
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    status: User['status']
  ): Promise<ApiResponse<User>> {
    return this.apiClient.update(
      'users',
      {
        status,
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', userId)
    );
  }

  /**
   * Create user invitation
   */
  async createInvitation(
    email: string,
    role: User['role'],
    invitedBy: string
  ): Promise<ApiResponse<UserInvitation>> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return this.apiClient.insert('user_invitations', {
      email,
      role,
      invited_by: invitedBy,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(): Promise<ApiResponse<UserInvitation[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('user_invitations', '*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
      { cache: true }
    );
  }

  /**
   * Accept user invitation
   */
  async acceptInvitation(invitationId: string): Promise<ApiResponse<UserInvitation>> {
    return this.apiClient.update(
      'user_invitations',
      {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', invitationId)
    );
  }

  /**
   * Revoke user invitation
   */
  async revokeInvitation(invitationId: string): Promise<ApiResponse<UserInvitation>> {
    return this.apiClient.update(
      'user_invitations',
      {
        status: 'revoked',
        updated_at: new Date().toISOString(),
      },
      (query) => query.eq('id', invitationId)
    );
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      // First deactivate user
      await this.updateUserStatus(userId, 'inactive');

      // Then perform soft delete by setting deletion timestamp
      const result = await this.apiClient.update(
        'users',
        {
          status: 'inactive',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        (query) => query.eq('id', userId)
      );

      return {
        data: undefined,
        error: result.error,
        success: result.success,
      };
    } catch (error) {
      this.logger.error('Failed to delete user', { error, userId });
      return {
        data: null,
        error: 'Failed to delete user',
        success: false,
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    try {
      const usersResult = await this.getUsers({ limit: 10000 }); // Get all users for stats
      if (!usersResult.success) {
        return usersResult as any;
      }

      const users = usersResult.data || [];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Count users by status
      const statusCounts = users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {} as Record<User['status'], number>);

      // Count users by role
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<User['role'], number>);

      // Calculate time-based metrics
      const recentSignups = users.filter(user => 
        new Date(user.created_at) > thirtyDaysAgo
      ).length;

      const activeInLastWeek = users.filter(user => 
        user.last_login && new Date(user.last_login) > oneWeekAgo
      ).length;

      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: statusCounts.active || 0,
        inactiveUsers: statusCounts.inactive || 0,
        pendingUsers: statusCounts.pending || 0,
        suspendedUsers: statusCounts.suspended || 0,
        usersByRole: roleCounts,
        recentSignups,
        activeInLastWeek,
        averageSessionDuration: 0, // Would need session tracking data
      };

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to calculate user stats', { error });
      return {
        data: null,
        error: 'Failed to calculate user statistics',
        success: false,
      };
    }
  }

  /**
   * Check user permissions
   */
  async checkPermission(
    userId: string,
    permission: string
  ): Promise<ApiResponse<PermissionCheck>> {
    try {
      const result = await this.apiClient.raw.rpc('check_user_permission', {
        p_user_id: userId,
        p_permission: permission,
      });

      if (result.error) {
        return {
          data: null,
          error: result.error.message,
          success: false,
        };
      }

      return {
        data: {
          permission,
          hasPermission: result.data as boolean,
        },
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to check permission', { error, userId, permission });
      return {
        data: null,
        error: 'Failed to check permission',
        success: false,
      };
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<ApiResponse<any[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('user_activity_logs', '*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1),
      { cache: true }
    );
  }

  /**
   * Search users
   */
  async searchUsers(
    searchTerm: string,
    limit = 20
  ): Promise<ApiResponse<User[]>> {
    return this.apiClient.query(
      () => this.apiClient
        .select('profiles', `
          *,
          user:users(*)
        `)
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('name'),
      { cache: true }
    );
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<string>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

      const { data, error } = await this.apiClient.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      const { data: urlData } = this.apiClient.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      await this.updateUserProfile(userId, {
        avatar_url: urlData.publicUrl,
      });

      return {
        data: urlData.publicUrl,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to upload avatar', { error, userId });
      return {
        data: null,
        error: 'Failed to upload avatar',
        success: false,
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.apiClient.auth.resetPasswordForEmail(email);

      if (error) {
        return {
          data: null,
          error: error.message,
          success: false,
        };
      }

      return {
        data: undefined,
        error: null,
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to send password reset', { error, email });
      return {
        data: null,
        error: 'Failed to send password reset email',
        success: false,
      };
    }
  }

  /**
   * Subscribe to user changes
   */
  subscribeToUserChanges(callback: (payload: any) => void) {
    const channel = this.apiClient.createChannel('user-changes');
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles'
        }, 
        callback
      )
      .subscribe();

    return () => {
      this.apiClient.removeChannel('user-changes');
    };
  }
}

// Singleton instance
let userServiceInstance: UserService | null = null;

export const getUserService = (): UserService => {
  if (!userServiceInstance) {
    userServiceInstance = new UserService();
  }
  return userServiceInstance;
};

export const userService = getUserService();
