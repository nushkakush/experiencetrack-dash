import { supabase } from '@/integrations/supabase/client';
import {
  UserProfile,
  UserActivityLog,
  UserSearchParams,
  UserSearchResponse,
  CreateUserData,
  UpdateUserData,
  UserStats,
  BulkUserAction,
} from '@/types/userManagement';
import { UserRole } from '@/types/auth';

export class UserManagementService {
  /**
   * Fetch users with pagination
   * Excludes students and includes both existing users and invited users
   */
  static async searchUsers(
    params: UserSearchParams
  ): Promise<UserSearchResponse> {
    console.log('🔍 [SERVICE] searchUsers called with params:', params);
    
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      searchTerm,
      roles,
      statuses,
      dateFrom,
      dateTo,
    } = params;

    console.log('🔍 [SERVICE] Extracted filter params:', {
      searchTerm,
      roles,
      statuses,
      dateFrom,
      dateTo,
      page,
      pageSize
    });

    // Get existing users from profiles table (excluding students)
    let profilesQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .neq('role', 'student'); // Exclude students

    const {
      data: users,
      error: usersError,
      count: usersCount,
    } = await profilesQuery;

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log('🔍 [SERVICE] Fetched users from database:', {
      count: users?.length || 0,
      users: users?.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, role: u.role, status: u.status, created_at: u.created_at })) || []
    });
    
    // Log all unique roles in the database
    const uniqueRoles = [...new Set(users?.map(u => u.role) || [])];
    console.log('🔍 [SERVICE] Available roles in database:', uniqueRoles);

    // Get invitations
    let invitations: unknown[] = [];
    let invitationsCount = 0;
    let invitationsQuery = supabase
      .from('user_invitations')
      .select('*', { count: 'exact' })
      .in('invite_status', ['pending', 'sent']); // Include both pending and sent invitations

    const {
      data: invitationsData,
      error: invitationsError,
      count: count,
    } = await invitationsQuery;

    if (invitationsError) {
      throw new Error(
        `Failed to fetch invitations: ${invitationsError.message}`
      );
    }

    invitations = invitationsData || [];
    invitationsCount = count || 0;

    console.log('🔍 [SERVICE] Fetched invitations from database:', {
      count: invitations?.length || 0,
      invitations: invitations?.map(i => ({ id: i.id, name: `${i.first_name} ${i.last_name}`, role: i.role, status: 'invited', created_at: i.created_at })) || []
    });

    // Convert invitations to user-like format for display
    console.log('Processing invitations:', invitations.length, invitations);
    const invitationUsers = invitations.map(invitation => ({
      user_id: invitation.id,
      email: invitation.email,
      first_name: invitation.first_name || '',
      last_name: invitation.last_name || '',
      role: invitation.role,
      status: 'invited' as const,
      created_at: invitation.created_at,
      updated_at: invitation.updated_at,
      last_login: null,
      login_count: 0,
      // Add invitation-specific fields
      invitation_token: invitation.invitation_token,
      invitation_expires_at: invitation.invitation_expires_at,
      invite_status: invitation.invite_status,
      invited_at: invitation.invited_at,
      invited_by: invitation.invited_by,
    }));

    // Combine users and invitations
    console.log(
      'Combining users:',
      users?.length || 0,
      'and invitations:',
      invitationUsers.length
    );
    let allUsers = [...(users || []), ...invitationUsers];

    // Apply client-side filtering to combined results
    console.log('🔍 [DEBUG] Applying filters:', {
      searchTerm,
      roles,
      statuses,
      dateFrom,
      dateTo,
      totalUsersBeforeFilter: allUsers.length
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const beforeCount = allUsers.length;
      allUsers = allUsers.filter(user => 
        (user.first_name?.toLowerCase().includes(searchLower)) ||
        (user.last_name?.toLowerCase().includes(searchLower)) ||
        (user.email?.toLowerCase().includes(searchLower)) ||
        (user.role?.toLowerCase().includes(searchLower))
      );
      console.log('🔍 [DEBUG] Search filter applied:', { beforeCount, afterCount: allUsers.length });
    }

    if (roles && roles.length > 0) {
      const beforeCount = allUsers.length;
      allUsers = allUsers.filter(user => roles.includes(user.role));
      console.log('🔍 [DEBUG] Role filter applied:', { roles, beforeCount, afterCount: allUsers.length });
    }

    if (statuses && statuses.length > 0) {
      const beforeCount = allUsers.length;
      allUsers = allUsers.filter(user => statuses.includes(user.status));
      console.log('🔍 [DEBUG] Status filter applied:', { statuses, beforeCount, afterCount: allUsers.length });
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      const beforeCount = allUsers.length;
      allUsers = allUsers.filter(user => new Date(user.created_at) >= fromDate);
      console.log('🔍 [DEBUG] Date from filter applied:', { dateFrom, fromDate, beforeCount, afterCount: allUsers.length });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      const beforeCount = allUsers.length;
      allUsers = allUsers.filter(user => new Date(user.created_at) <= toDate);
      console.log('🔍 [DEBUG] Date to filter applied:', { dateTo, toDate, beforeCount, afterCount: allUsers.length });
    }

    // Sort combined results
    allUsers.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination to combined results
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const paginatedUsers = allUsers.slice(from, to + 1);

    const total = allUsers.length;
    const totalPages = Math.ceil(total / pageSize);

    console.log('🔍 [SERVICE] Final result after filtering and pagination:', {
      totalUsers: allUsers.length,
      paginatedUsers: paginatedUsers.length,
      total,
      hasInvitedUsers: paginatedUsers.some(u => u.status === 'invited'),
      finalUsers: paginatedUsers.map(u => ({ 
        id: u.user_id, 
        name: `${u.first_name} ${u.last_name}`, 
        role: u.role, 
        status: u.status, 
        created_at: u.created_at 
      }))
    });

    return {
      users: paginatedUsers,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get user by ID - checks both profiles and user_invitations tables
   */
  static async getUserById(userId: string): Promise<UserProfile> {
    // First try to get from profiles table (existing users)
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (user) {
      return user;
    }

    // If not found in profiles, check user_invitations table (invited users)
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (invitationError) {
      throw new Error(
        `Failed to fetch user from invitations: ${invitationError.message}`
      );
    }

    if (!invitation) {
      throw new Error(
        `Failed to fetch user: User not found in profiles or invitations`
      );
    }

    // Convert invitation to UserProfile format
    return {
      user_id: invitation.id,
      email: invitation.email,
      first_name: invitation.first_name || '',
      last_name: invitation.last_name || '',
      role: invitation.role,
      status: 'invited' as const,
      created_at: invitation.created_at,
      updated_at: invitation.updated_at,
      last_login: null,
      login_count: 0,
      // Add invitation-specific fields
      invitation_token: invitation.invitation_token,
      invitation_expires_at: invitation.invitation_expires_at,
      invite_status: invitation.invite_status,
      invited_at: invitation.invited_at,
      invited_by: invitation.invited_by,
    };
  }

  /**
   * Update user information
   */
  static async updateUser(
    userId: string,
    updateData: UpdateUserData
  ): Promise<UserProfile> {
    console.log('🔄 [DEBUG] updateUser called with:', { userId, updateData });

    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('🔄 [DEBUG] Check user existence error:', checkError);
      throw new Error(`Failed to check user existence: ${checkError.message}`);
    }

    if (!existingUser) {
      console.error('🔄 [DEBUG] User not found:', userId);
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log('🔄 [DEBUG] Existing user found:', existingUser);

    // Filter out undefined values and add updated_at timestamp
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Add updated_at timestamp
    const finalUpdateData = {
      ...cleanUpdateData,
      updated_at: new Date().toISOString(),
    };

    console.log('🔄 [DEBUG] Final update data:', finalUpdateData);

    // Update the user
    const { data: user, error } = await supabase
      .from('profiles')
      .update(finalUpdateData)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('🔄 [DEBUG] Update error:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!user) {
      console.error('🔄 [DEBUG] No user returned after update');
      throw new Error(`Failed to update user: No user returned after update`);
    }

    console.log('🔄 [DEBUG] User updated successfully:', user);

    // Log the activity
    try {
      await this.logUserActivity(userId, 'user_updated', {
        updatedFields: Object.keys(cleanUpdateData),
        newValues: cleanUpdateData,
      });
    } catch (logError) {
      console.warn('🔄 [DEBUG] Failed to log activity:', logError);
      // Don't fail the update if logging fails
    }

    return user;
  }

  /**
   * Delete user - handles both existing users and invited users
   */
  static async deleteUser(userId: string): Promise<void> {
    // First, get user details for logging
    const user = await this.getUserById(userId);

    if (user.status === 'invited') {
      // This is an invited user - delete from user_invitations table
      const { error: invitationError } = await supabase
        .from('user_invitations')
        .delete()
        .eq('id', userId);

      if (invitationError) {
        throw new Error(
          `Failed to delete invitation: ${invitationError.message}`
        );
      }

      console.log(`Deleted invitation for user: ${user.email}`);
    } else {
      // This is an existing user - use edge function to delete from auth.users
      const supabaseUrl = 'https://ghmpaghyasyllfvamfna.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to delete user: ${errorData.error || 'Unknown error'}`
        );
      }

      const result = await response.json();
      console.log(`Deleted existing user: ${user.email}`, result);
    }

    // Log the activity
    await this.logUserActivity(userId, 'user_deleted', {
      deletedUser: {
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        status: user.status,
      },
    });
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get users by status
    const { data: statusCounts } = await supabase
      .from('profiles')
      .select('status');

    // Get users by role
    const { data: roleCounts } = await supabase.from('profiles').select('role');

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('user_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate statistics
    const activeUsers =
      statusCounts?.filter(u => u.status === 'active').length || 0;
    const inactiveUsers =
      statusCounts?.filter(u => u.status === 'inactive').length || 0;
    const suspendedUsers =
      statusCounts?.filter(u => u.status === 'suspended').length || 0;

    const usersByRole: Record<UserRole, number> = {
      student: 0,
      super_admin: 0,
      program_manager: 0,
      fee_collector: 0,
      partnerships_head: 0,
      placement_coordinator: 0,
    };

    roleCounts?.forEach(user => {
      if (user.role in usersByRole) {
        usersByRole[user.role]++;
      }
    });

    return {
      totalUsers: totalUsers || 0,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      usersByRole,
      recentActivity: recentActivity || [],
    };
  }

  /**
   * Get user activity logs
   */
  static async getUserActivityLogs(
    userId: string,
    limit = 50
  ): Promise<UserActivityLog[]> {
    const { data: logs, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch activity logs: ${error.message}`);
    }

    return logs || [];
  }

  /**
   * Log user activity
   */
  static async logUserActivity(
    userId: string,
    action: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.rpc('log_user_activity', {
      _user_id: userId,
      _action: action,
      _details: details,
    });

    if (error) {
      console.error('Failed to log user activity:', error);
    }
  }

  /**
   * Bulk user operations
   */
  static async bulkUserAction(action: BulkUserAction): Promise<void> {
    const { action: operation, userIds, data } = action;

    switch (operation) {
      case 'delete':
        // Delete users one by one (Supabase doesn't support bulk delete)
        for (const userId of userIds) {
          await this.deleteUser(userId);
        }
        break;

      case 'change_role': {
        if (!data?.role) {
          throw new Error('Role is required for change_role operation');
        }
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: data.role })
          .in('user_id', userIds);

        if (roleError) {
          throw new Error(`Failed to update user roles: ${roleError.message}`);
        }

        // Log activity for each user
        for (const userId of userIds) {
          await this.logUserActivity(userId, 'role_changed', {
            newRole: data.role,
            performedBy: 'bulk_operation',
          });
        }
        break;
      }

      case 'change_status': {
        if (!data?.status) {
          throw new Error('Status is required for change_status operation');
        }
        const { error: statusError } = await supabase
          .from('profiles')
          .update({ status: data.status })
          .in('user_id', userIds);

        if (statusError) {
          throw new Error(
            `Failed to update user statuses: ${statusError.message}`
          );
        }

        // Log activity for each user
        for (const userId of userIds) {
          await this.logUserActivity(userId, 'status_changed', {
            newStatus: data.status,
            performedBy: 'bulk_operation',
          });
        }
        break;
      }

      default:
        throw new Error(`Unknown bulk action: ${operation}`);
    }
  }

  /**
   * Export users data
   */
  static async exportUsers(): Promise<UserProfile[]> {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'student'); // Exclude students

    if (error) {
      throw new Error(`Failed to export users: ${error.message}`);
    }

    return users || [];
  }
}
