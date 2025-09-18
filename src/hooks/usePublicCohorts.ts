import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CohortWithCounts } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

export function usePublicCohorts() {
  return useQuery({
    queryKey: ['publicCohorts', 'withCounts'],
    queryFn: async () => {
      try {
        // Get cohorts that are publicly accessible (with open applications)
        const { data: cohorts, error: cohortsError } = await supabase
          .from('cohorts')
          .select('*')
          .order('created_at', { ascending: false });

        if (cohortsError) {
          Logger.getInstance().error('usePublicCohorts: Cohorts query error', {
            error: cohortsError,
          });
          throw cohortsError;
        }

        if (!cohorts || cohorts.length === 0) {
          return [];
        }

        // Get student counts for all cohorts
        const cohortIds = cohorts.map(c => c.id);

        const { data: studentCounts, error: countsError } = await supabase
          .from('cohort_students')
          .select('cohort_id')
          .in('cohort_id', cohortIds);

        if (countsError) {
          Logger.getInstance().error(
            'usePublicCohorts: Student counts query error',
            { error: countsError }
          );
          throw countsError;
        }

        // Count students per cohort
        const countMap = new Map<string, number>();

        studentCounts?.forEach(student => {
          const currentCount = countMap.get(student.cohort_id) || 0;
          const newCount = currentCount + 1;
          countMap.set(student.cohort_id, newCount);
        });

        // Transform the data to include students_count
        const cohortsWithCounts: CohortWithCounts[] = cohorts.map(cohort => {
          const students_count = countMap.get(cohort.id) || 0;
          return {
            ...cohort,
            students_count,
          };
        });

        return cohortsWithCounts;
      } catch (error) {
        Logger.getInstance().error('usePublicCohorts: Caught error', { error });
        throw error;
      }
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
}
