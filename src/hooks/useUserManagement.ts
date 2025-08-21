import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserManagementService } from '@/services/userManagement/userManagement.service';
import { exportUserData } from '@/utils/exportUtils';
import {
  UserProfile,
  UserTableState,
  UserFilters,
  UserStats,
  UpdateUserData,
  BulkUserAction,
  UserSearchParams,
} from '@/types/userManagement';

interface UseUserManagementReturn {
  // State
  state: UserTableState;
  stats: UserStats | null;
  statsLoading: boolean;

  // Actions
  loadUsers: (params?: Partial<UserSearchParams>) => Promise<void>;
  forceRefreshUsers: () => Promise<void>;
  updateUser: (userId: string, data: UpdateUserData) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  bulkAction: (action: BulkUserAction) => Promise<void>;
  loadStats: () => Promise<void>;
  exportUsers: (format?: 'csv' | 'json' | 'excel') => Promise<void>;

  // Table state management
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setFilters: (filters: Partial<UserFilters>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  toggleUserSelection: (userId: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;

  // Computed values
  selectedUsers: UserProfile[];
  hasSelection: boolean;
  isAllSelected: boolean;
}

const initialState: UserTableState = {
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  filters: {},
  selectedUsers: [],
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useUserManagement = (): UseUserManagementReturn => {
  const [state, setState] = useState<UserTableState>(initialState);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const { toast } = useToast();

  // Load users with current state
  const loadUsers = useCallback(
    async (params?: Partial<UserSearchParams>) => {
      console.log('🔄 [DEBUG] loadUsers called');
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const searchParams: UserSearchParams = {
          page: state.pagination.page,
          pageSize: state.pagination.pageSize,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          ...state.filters,
          ...params,
        };

        console.log('🔄 [DEBUG] Search params:', searchParams);

        const response = await UserManagementService.searchUsers(searchParams);
        console.log('🔄 [DEBUG] loadUsers response:', {
          totalUsers: response.users.length,
          hasInvitedUsers: response.users.some(u => u.status === 'invited'),
          invitedCount: response.users.filter(u => u.status === 'invited')
            .length,
        });

        console.log(
          '🔄 [DEBUG] Updating state with new users:',
          response.users.length
        );
        setState(prev => {
          const newState = {
            ...prev,
            users: response.users,
            pagination: {
              page: response.page,
              pageSize: response.pageSize,
              total: response.total,
            },
            loading: false,
            error: null,
          };
          console.log('🔄 [DEBUG] New state:', {
            totalUsers: newState.users.length,
            invitedUsers: newState.users.filter(u => u.status === 'invited')
              .length,
            registeredUsers: newState.users.filter(u => u.status !== 'invited')
              .length,
          });
          return newState;
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load users';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [
      state.pagination.page,
      state.pagination.pageSize,
      state.sortBy,
      state.sortOrder,
      state.filters,
      toast,
    ]
  );

  // Load user statistics
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const userStats = await UserManagementService.getUserStats();
      setStats(userStats);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load statistics';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  // Export users
  const exportUsers = useCallback(
    async (format: 'csv' | 'json' | 'excel' = 'csv') => {
      try {
        // Get all users for export (not just current page)
        const allUsers = await UserManagementService.exportUsers(state.filters);

        if (!allUsers || allUsers.length === 0) {
          toast({
            title: 'No Data',
            description: 'No users found to export.',
            variant: 'destructive',
          });
          return;
        }

        exportUserData(allUsers, { format });
        toast({
          title: 'Success',
          description: `${allUsers.length} users exported successfully in ${format} format.`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to export users';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [state.filters, toast]
  );

  // Force refresh users (for manual refresh)
  const forceRefreshUsers = useCallback(async () => {
    console.log('🔄 [DEBUG] forceRefreshUsers called');
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const searchParams: UserSearchParams = {
        page: 1, // Always refresh from first page
        pageSize: state.pagination.pageSize,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        ...state.filters,
      };

      const response = await UserManagementService.searchUsers(searchParams);

      setState(prev => ({
        ...prev,
        users: response.users,
        pagination: {
          page: response.page,
          pageSize: response.pageSize,
          total: response.total,
        },
        loading: false,
        error: null,
      }));

      console.log('🔄 [DEBUG] forceRefreshUsers completed successfully');
    } catch (error) {
      console.error('🔄 [DEBUG] forceRefreshUsers failed:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to refresh users',
      }));
      throw error;
    }
  }, [state.pagination.pageSize, state.sortBy, state.sortOrder, state.filters]);

  // Update user
  const updateUser = useCallback(
    async (userId: string, data: UpdateUserData) => {
      try {
        await UserManagementService.updateUser(userId, data);

        // Force refresh users immediately to reflect changes
        await forceRefreshUsers();

        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update user';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [forceRefreshUsers, toast]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        await UserManagementService.deleteUser(userId);

        // Force refresh users immediately to reflect changes
        await forceRefreshUsers();

        // Remove from selection if selected
        setState(prev => ({
          ...prev,
          selectedUsers: prev.selectedUsers.filter(id => id !== userId),
        }));

        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete user';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [forceRefreshUsers, toast]
  );

  // Bulk actions
  const bulkAction = useCallback(
    async (action: BulkUserAction) => {
      try {
        await UserManagementService.bulkUserAction(action);

        // Force refresh users immediately to reflect changes
        await forceRefreshUsers();

        // Clear selection after bulk action
        setState(prev => ({ ...prev, selectedUsers: [] }));

        toast({
          title: 'Success',
          description: `Bulk action completed successfully`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to perform bulk action';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [forceRefreshUsers, toast]
  );

  // Table state management
  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, pageSize, page: 1 }, // Reset to first page
    }));
  }, []);

  const setFilters = useCallback((filters: Partial<UserFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      pagination: { ...prev.pagination, page: 1 }, // Reset to first page
    }));
  }, []);

  const setSorting = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      setState(prev => ({ ...prev, sortBy, sortOrder }));
    },
    []
  );

  const toggleUserSelection = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId],
    }));
  }, []);

  const selectAllUsers = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedUsers: prev.users.map(user => user.user_id),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedUsers: [] }));
  }, []);

  // Computed values
  const selectedUsers = state.users.filter(user =>
    state.selectedUsers.includes(user.user_id)
  );

  const hasSelection = state.selectedUsers.length > 0;
  const isAllSelected =
    state.users.length > 0 && state.selectedUsers.length === state.users.length;

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadStats();
  }, [loadUsers, loadStats]);

  // Reload when state changes
  useEffect(() => {
    loadUsers();
  }, [
    state.pagination.page,
    state.pagination.pageSize,
    state.sortBy,
    state.sortOrder,
    loadUsers,
  ]);

  return {
    // State
    state,
    stats,
    statsLoading,

    // Actions
    loadUsers,
    forceRefreshUsers,
    updateUser,
    deleteUser,
    bulkAction,
    loadStats,
    exportUsers,

    // Table state management
    setPage,
    setPageSize,
    setFilters,
    setSorting,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,

    // Computed values
    selectedUsers,
    hasSelection,
    isAllSelected,
  };
};
