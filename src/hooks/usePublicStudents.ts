import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CohortStudent } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

export function usePublicStudents(cohortId?: string) {
  return useQuery({
    queryKey: ['publicStudents', cohortId],
    queryFn: async () => {
      if (!cohortId) {
        return [];
      }

      try {
        const { data: students, error } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId)
          .neq('dropped_out_status', 'dropped_out');

        if (error) {
          Logger.getInstance().error('usePublicStudents: Query error', {
            error,
            cohortId,
          });
          throw error;
        }

        // Transform the data to match the expected format
        return (students || []).map(student => ({
          id: student.id,
          name:
            `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
            'Unknown Student',
          email: student.email || 'No email',
          avatar_url: student.avatar_url || null,
          first_name: student.first_name,
          last_name: student.last_name,
          // Add other fields as needed
          ...student,
        }));
      } catch (error) {
        Logger.getInstance().error('usePublicStudents: Caught error', {
          error,
          cohortId,
        });
        throw error;
      }
    },
    enabled: !!cohortId,
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
