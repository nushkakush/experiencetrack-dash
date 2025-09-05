import { useQuery } from '@tanstack/react-query';
import {
  RegistrationService,
  CohortWithOpenApplications,
} from '@/services/registration.service';
import { Logger } from '@/lib/logging/Logger';

export function useCohortsWithOpenApplications() {
  const query = useQuery({
    queryKey: ['cohorts', 'openApplications'],
    queryFn: async () => {
      const response =
        await RegistrationService.getCohortsWithOpenApplications();

      if (!response.success) {
        Logger.getInstance().error(
          'useCohortsWithOpenApplications: Service failed',
          {
            error: response.error,
          }
        );
        throw new Error(
          response.error || 'Failed to fetch cohorts with open applications'
        );
      }

      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    cohorts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
