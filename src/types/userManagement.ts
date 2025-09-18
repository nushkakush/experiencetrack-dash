import { UserRole } from './auth';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'invited';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  last_login: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
  // Invitation-specific fields (for invited users)
  invitation_token?: string;
  invitation_expires_at?: string;
  invite_status?: 'pending' | 'sent' | 'accepted' | 'failed';
  invited_at?: string;
  invited_by?: string;
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string;
}


export interface UserTableState {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  selectedUsers: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  usersByRole: Record<UserRole, number>;
  recentActivity: UserActivityLog[];
}

export interface CreateUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface BulkUserAction {
  action: 'delete' | 'change_role' | 'change_status';
  userIds: string[];
  data?: {
    role?: UserRole;
    status?: UserStatus;
  };
}

export interface UserSearchParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  roles?: UserRole[];
  statuses?: UserStatus[];
  dateFrom?: string;
  dateTo?: string;
}

export interface UserSearchResponse {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
