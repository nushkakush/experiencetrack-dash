
import { useQuery } from "@tanstack/react-query";
import { cohortsService } from "@/services/cohorts.service";
import { CohortWithCounts } from "@/types/cohort";
import { Logger } from "@/lib/logging/Logger";

export function useCohorts() {
  const query = useQuery({
    queryKey: ["cohorts", "withCounts"],
    queryFn: async () => {
      const response = await cohortsService.listAllWithCounts();
      if (!response.success) {
        Logger.getInstance().error('useCohorts: Service failed', { error: response.error });
        throw new Error(response.error || "Failed to fetch cohorts");
      }
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

  return {
    cohorts: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
