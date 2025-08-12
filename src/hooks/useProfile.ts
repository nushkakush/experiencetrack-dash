/**
 * Custom hook for profile management with proper state handling
 * Enterprise-level data fetching and caching
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { UserProfile } from '@/types/auth';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { SUCCESS_MESSAGES } from '@/config/constants';
import { Logger } from '@/lib/logging/Logger';

const QUERY_KEYS = {
  profile: (userId: string) => ['profile', userId] as const,
  profileStats: () => ['profileStats'] as const,
} as const;

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for current user's profile
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.profile(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID available');
      const response = await profileService.getByUserId(user.id);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('No user ID available');
      const response = await profileService.updateProfile(user.id, updates);
      return response.data;
    },
    onSuccess: (updatedProfile) => {
      // Update cache with new data
      queryClient.setQueryData(
        QUERY_KEYS.profile(user?.id || ''),
        updatedProfile
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['profiles'],
      });
      
      toast.success(SUCCESS_MESSAGES.PROFILE_UPDATED);
    },
    onError: (error) => {
      Logger.getInstance().error('Profile update error', { error, userId: user?.id });
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    },
  });

  // Query for profile statistics (admin only)
  const profileStatsQuery = useQuery({
    queryKey: QUERY_KEYS.profileStats(),
    queryFn: async () => {
      const response = await profileService.getProfileStats();
      return response.data;
    },
    enabled: profileQuery.data?.role === 'super_admin',
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Prefetch profile on user change
  useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.profile(user.id),
        queryFn: async () => {
          const response = await profileService.getByUserId(user.id);
          return response.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [user?.id, queryClient]);

  return {
    // Profile data
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    
    // Profile statistics
    stats: profileStatsQuery.data,
    statsLoading: profileStatsQuery.isLoading,
    
    // Mutations
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    
    // Utility functions
    refetch: profileQuery.refetch,
    invalidate: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ''),
      });
    },
  };
}