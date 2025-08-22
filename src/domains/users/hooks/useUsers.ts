/**
 * User Domain Hooks
 * Centralized hooks for user management functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/useApiQuery';
import { 
  userService, 
  UserFilters, 
  User, 
  UserProfile,
  UserInvitation,
  UserStats 
} from '../services/UserService';

export interface UseUsersOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true, autoRefresh = false } = options;
  
  const [filters, setFilters] = useState<UserFilters>({
    limit: 50,
    offset: 0,
  });

  // Fetch users
  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.getUsers(filters),
    enabled,
    staleTime: autoRefresh ? 30 * 1000 : 5 * 60 * 1000,
  });

  // Fetch user statistics
  const {
    data: stats,
    isLoading: statsLoading,
  } = useApiQuery({
    queryKey: ['users', 'stats'],
    queryFn: () => userService.getUserStats(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  // Update user role mutation
  const updateRoleMutation = useApiMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User['role'] }) =>
      userService.updateUserRole(userId, role),
    successMessage: 'User role updated successfully',
    invalidateQueries: [['users']],
  });

  // Update user status mutation
  const updateStatusMutation = useApiMutation({
    mutationFn: ({ userId, status }: { userId: string; status: User['status'] }) =>
      userService.updateUserStatus(userId, status),
    successMessage: 'User status updated successfully',
    invalidateQueries: [['users']],
  });

  // Delete user mutation
  const deleteUserMutation = useApiMutation({
    mutationFn: userService.deleteUser.bind(userService),
    successMessage: 'User deleted successfully',
    invalidateQueries: [['users']],
  });

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return [...users]; // Additional client-side filtering can be added here
  }, [users]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Pagination helpers
  const nextPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 50)),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 50),
    }));
  }, []);

  // Actions
  const updateUserRole = useCallback((userId: string, role: User['role']) => {
    return updateRoleMutation.mutateAsync({ userId, role });
  }, [updateRoleMutation]);

  const updateUserStatus = useCallback((userId: string, status: User['status']) => {
    return updateStatusMutation.mutateAsync({ userId, status });
  }, [updateStatusMutation]);

  const deleteUser = useCallback((userId: string) => {
    return deleteUserMutation.mutateAsync(userId);
  }, [deleteUserMutation]);

  return {
    // Data
    users: filteredUsers,
    stats: stats as UserStats | undefined,
    
    // Loading states
    isLoading,
    statsLoading,
    isUpdatingRole: updateRoleMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isDeletingUser: deleteUserMutation.isPending,
    
    // Error states
    error,
    
    // Filters and pagination
    filters,
    updateFilters,
    nextPage,
    prevPage,
    goToPage,
    currentPage: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
    
    // Actions
    updateUserRole,
    updateUserStatus,
    deleteUser,
    refetch,
  };
}

/**
 * Hook for user invitations
 */
export function useUserInvitations() {
  const {
    data: invitations = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['users', 'invitations'],
    queryFn: () => userService.getPendingInvitations(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create invitation mutation
  const createInvitationMutation = useApiMutation({
    mutationFn: ({ 
      email, 
      role, 
      invitedBy 
    }: { 
      email: string; 
      role: User['role']; 
      invitedBy: string;
    }) => userService.createInvitation(email, role, invitedBy),
    successMessage: 'Invitation sent successfully',
    invalidateQueries: [['users', 'invitations']],
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useApiMutation({
    mutationFn: userService.revokeInvitation.bind(userService),
    successMessage: 'Invitation revoked successfully',
    invalidateQueries: [['users', 'invitations']],
  });

  const createInvitation = useCallback((email: string, role: User['role'], invitedBy: string) => {
    return createInvitationMutation.mutateAsync({ email, role, invitedBy });
  }, [createInvitationMutation]);

  const revokeInvitation = useCallback((invitationId: string) => {
    return revokeInvitationMutation.mutateAsync(invitationId);
  }, [revokeInvitationMutation]);

  return {
    invitations,
    isLoading,
    error,
    isCreatingInvitation: createInvitationMutation.isPending,
    isRevokingInvitation: revokeInvitationMutation.isPending,
    createInvitation,
    revokeInvitation,
    refetch,
  };
}

/**
 * Hook for current user profile
 */
export function useCurrentUser() {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['users', 'current'],
    queryFn: () => userService.getCurrentUserProfile(),
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useApiMutation({
    mutationFn: ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: Partial<UserProfile>;
    }) => userService.updateUserProfile(userId, updates),
    successMessage: 'Profile updated successfully',
    invalidateQueries: [['users', 'current']],
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useApiMutation({
    mutationFn: ({ 
      userId, 
      file 
    }: { 
      userId: string; 
      file: File;
    }) => userService.uploadAvatar(userId, file),
    successMessage: 'Avatar updated successfully',
    invalidateQueries: [['users', 'current']],
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!profile?.user_id) return Promise.reject(new Error('No user ID'));
    return updateProfileMutation.mutateAsync({ userId: profile.user_id, updates });
  }, [updateProfileMutation, profile]);

  const uploadAvatar = useCallback((file: File) => {
    if (!profile?.user_id) return Promise.reject(new Error('No user ID'));
    return uploadAvatarMutation.mutateAsync({ userId: profile.user_id, file });
  }, [uploadAvatarMutation, profile]);

  return {
    profile,
    isLoading,
    error,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    updateProfile,
    uploadAvatar,
    refetch,
  };
}

/**
 * Hook for user search
 */
export function useUserSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: searchResults = [],
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ['users', 'search', debouncedSearchTerm],
    queryFn: () => userService.searchUsers(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length > 2,
    staleTime: 2 * 60 * 1000,
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading: isLoading && debouncedSearchTerm.length > 2,
    error,
  };
}

/**
 * Hook for user permissions
 */
export function useUserPermissions(userId: string) {
  const checkPermission = useCallback(async (permission: string) => {
    return userService.checkPermission(userId, permission);
  }, [userId]);

  return {
    checkPermission,
  };
}
