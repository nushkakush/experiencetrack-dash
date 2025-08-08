
import { useQuery } from "@tanstack/react-query";
import { cohortsService } from "@/services/cohorts.service";
import { CohortWithCounts } from "@/types/cohort";

export function useCohorts() {
  const query = useQuery({
    queryKey: ["cohorts", "withCounts"],
    queryFn: async () => {
      const { data: cohorts } = await cohortsService.listAll();
      const list = cohorts || [];
      const withCounts = await Promise.all(
        list.map(async (c) => {
          const students_count = await cohortsService.countStudents(c.id);
          return { ...c, students_count } as CohortWithCounts;
        })
      );
      return withCounts;
    },
    staleTime: 60_000,
  });

  return {
    cohorts: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
}
