
import { useQuery } from "@tanstack/react-query";
import { cohortsService } from "@/services/cohorts.service";
import { CohortWithCounts } from "@/types/cohort";

export function useCohorts() {
  const query = useQuery({
    queryKey: ["cohorts", "withCounts"],
    queryFn: async () => {
      console.log('useCohorts: Fetching cohorts...');
      const response = await cohortsService.listAllWithCounts();
      console.log('useCohorts: Service response:', response);
      if (!response.success) {
        console.error('useCohorts: Service failed:', response.error);
        throw new Error(response.error || "Failed to fetch cohorts");
      }
      console.log('useCohorts: Returning data:', response.data);
      return response.data || [];
    },
    staleTime: 60_000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && 'status' in error && typeof (error as any).status === 'number') {
        return (error as any).status >= 500 && failureCount < 3;
      }
      return failureCount < 3;
    },
  });

  console.log('useCohorts: Query state:', {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error
  });

  return {
    cohorts: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
