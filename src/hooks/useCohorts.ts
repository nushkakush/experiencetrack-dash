import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cohortsService } from '@/services/cohorts.service';
import { CohortAssignmentService } from '@/services/cohortAssignment.service';
import { CohortWithCounts } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

export function useCohorts() {
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ['cohorts', 'withCounts', profile?.user_id, profile?.role],
    queryFn: async () => {
      // Super admins see all cohorts
      if (profile?.role === 'super_admin') {
        const response = await cohortsService.listAllWithCounts();
        if (!response.success) {
          Logger.getInstance().error('useCohorts: Service failed', {
            error: response.error,
          });
          throw new Error(response.error || 'Failed to fetch cohorts');
        }
        return response.data || [];
      }

      // Students see only their cohort (this would need to be implemented based on student enrollment)
      if (profile?.role === 'student') {
        // For now, return empty array for students
        // This would need to be implemented based on student cohort enrollment
        return [];
      }

      // Program managers and fee collectors see only assigned cohorts
      if (
        profile?.role === 'program_manager' ||
        profile?.role === 'fee_collector'
      ) {
        if (!profile?.user_id) {
          return [];
        }

        // Get assigned cohorts for the user
        const assignmentResponse =
          await CohortAssignmentService.getAssignedCohortsForUser(
            profile.user_id
          );
        if (!assignmentResponse.success) {
          Logger.getInstance().error(
            'useCohorts: Failed to get assigned cohorts',
            { error: assignmentResponse.error }
          );
          throw new Error(
            assignmentResponse.error?.message ||
              'Failed to fetch assigned cohorts'
          );
        }

        const assignedCohorts = assignmentResponse.data || [];

        // Get cohort counts for assigned cohorts
        const allCohortsResponse = await cohortsService.listAllWithCounts();
        if (!allCohortsResponse.success) {
          Logger.getInstance().error('useCohorts: Service failed', {
            error: allCohortsResponse.error,
          });
          throw new Error(
            allCohortsResponse.error || 'Failed to fetch cohorts'
          );
        }

        const allCohorts = allCohortsResponse.data || [];
        const assignedCohortIds = new Set(
          assignedCohorts.map(cohort => cohort.id)
        );

        // Filter to only assigned cohorts
        return allCohorts.filter(cohort => assignedCohortIds.has(cohort.id));
      }

      // Default: return empty array for other roles
      return [];
    },
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (
        error &&
        'status' in error &&
        typeof (error as { status: number }).status === 'number'
      ) {
        return (error as { status: number }).status >= 500 && failureCount < 3;
      }
      return failureCount < 3;
    },
    enabled: !!profile?.user_id, // Only run query when user is authenticated
  });

  return {
    cohorts: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
