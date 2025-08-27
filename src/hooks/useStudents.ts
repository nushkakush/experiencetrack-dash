import { useQuery } from '@tanstack/react-query';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { CohortStudent } from '@/types/cohort';

export function useStudents(cohortId?: string) {
  return useQuery({
    queryKey: ['students', cohortId],
    queryFn: async () => {
      if (!cohortId) {
        return [];
      }

      try {
        const response = await cohortStudentsService.listAllByCohort(cohortId);

        if (response.success && response.data) {
          // Transform the data to match the expected format
          return response.data.map(student => ({
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
        }

        return [];
      } catch (error) {
        console.error('Failed to fetch students:', error);
        return [];
      }
    },
    enabled: !!cohortId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
