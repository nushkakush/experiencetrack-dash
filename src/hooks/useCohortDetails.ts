import { useState, useEffect, useCallback } from 'react';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { cohortsService } from '@/services/cohorts.service';
import {
  CohortStudent,
  CohortWithCounts,
  NewStudentInput,
} from '@/types/cohort';
import { toast } from 'sonner';
import { supabase, connectionManager } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import { useAuth } from '@/hooks/useAuth';

export function useCohortDetails(cohortId: string | undefined) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [cohort, setCohort] = useState<CohortWithCounts | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null
  );

  // Load data. When background=true, avoid flipping the main loading state
  // to prevent full-page skeleton flashes during focus/visibility or realtime updates.
  const loadData = useCallback(
    async (background: boolean = false) => {
      if (!cohortId) return;

      if (background) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        // Load cohort details with counts
        const cohortRes = await cohortsService.getByIdWithCounts(cohortId);
        if (cohortRes.success && cohortRes.data) {
          setCohort(cohortRes.data);
        }

        // Load students
        const studentsRes =
          await cohortStudentsService.listAllByCohort(cohortId);
        setStudents(studentsRes.data || []);
      } catch (error) {
        Logger.getInstance().error('Error loading cohort details', {
          error,
          cohortId,
        });
        toast.error('Failed to load cohort details');
      } finally {
        if (background) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [cohortId]
  );

  const handleDeleteStudent = useCallback(
    async (studentId: string) => {
      setDeletingStudentId(studentId);
      try {
        const result = await cohortStudentsService.delete(studentId);
        if (result.success) {
          toast.success('Student removed from cohort successfully');
          await loadData(); // Reload data to update the list
        } else {
          toast.error('Failed to remove student from cohort');
        }
      } catch (error) {
        Logger.getInstance().error('Error deleting student', {
          error,
          studentId,
          cohortId,
        });
        toast.error('An error occurred while removing the student');
      } finally {
        setDeletingStudentId(null);
      }
    },
    [loadData]
  );

  const updateStudent = useCallback(
    (studentId: string, updates: Partial<CohortStudent>) => {
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId ? { ...student, ...updates } : student
        )
      );
    },
    []
  );

  const validateStudentRow = useCallback(
    (data: NewStudentInput, row: number): string[] => {
      const errors: string[] = [];

      if (!data.email || !data.email.trim()) {
        errors.push(`Row ${row}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.push(`Row ${row}: Invalid email format`);
      }

      if (!data.first_name || !data.first_name.trim()) {
        errors.push(`Row ${row}: First name is required`);
      }

      if (!data.last_name || !data.last_name.trim()) {
        errors.push(`Row ${row}: Last name is required`);
      }

      return errors;
    },
    []
  );

  // Helper function to handle student invitation
  const handleStudentInvitation = useCallback(
    async (studentId: string, email: string) => {
      try {
        const result = await cohortStudentsService.sendInvitationEmail(
          studentId,
          email,
          'Student',
          'Name',
          cohort?.name || 'Cohort'
        );

        if (result.success) {
          toast.success('Invitation sent successfully');
          loadData();
        } else {
          toast.error(result.error || 'Failed to send invitation');
        }
      } catch (error) {
        console.error('Error sending invitation:', error);
        toast.error('Failed to send invitation');
      }
    },
    [cohort?.name, loadData]
  );

  const checkDuplicateStudents = useCallback(
    async (
      students: NewStudentInput[]
    ): Promise<{
      duplicates: NewStudentInput[];
      nonDuplicates: NewStudentInput[];
    }> => {
      const duplicates: NewStudentInput[] = [];
      const nonDuplicates: NewStudentInput[] = [];

      for (const student of students) {
        try {
          const existingStudents =
            await cohortStudentsService.listByCohort(cohortId);

          if (existingStudents.success && existingStudents.data) {
            const isDuplicate = existingStudents.data.some(
              (existingStudent: CohortStudent) =>
                existingStudent.email.toLowerCase() ===
                student.email.toLowerCase()
            );

            if (isDuplicate) {
              duplicates.push(student);
            } else {
              nonDuplicates.push(student);
            }
          } else {
            nonDuplicates.push(student);
          }
        } catch (error) {
          console.error('Error checking duplicate:', error);
          nonDuplicates.push(student);
        }
      }

      return { duplicates, nonDuplicates };
    },
    [cohortId]
  );

  const processBulkUpload = useCallback(
    async (
      studentsData: NewStudentInput[]
    ): Promise<{ success: boolean; message: string }> => {
      if (!cohortId) {
        return { success: false, message: 'No cohort selected' };
      }

      try {
        // Validate all students first
        const allErrors: string[] = [];
        studentsData.forEach((student, index) => {
          const errors = validateStudentRow(student, index + 1);
          allErrors.push(...errors);
        });

        if (allErrors.length > 0) {
          return {
            success: false,
            message: `Validation errors:\n${allErrors.join('\n')}`,
          };
        }

        // Check for duplicates
        const { duplicates, nonDuplicates } =
          await checkDuplicateStudents(studentsData);

        if (duplicates.length > 0) {
          const duplicateEmails = duplicates.map(d => d.email).join(', ');
          return {
            success: false,
            message: `Duplicate students found: ${duplicateEmails}`,
          };
        }

        // Process valid students
        let successCount = 0;
        let inviteCount = 0;

        for (const studentData of nonDuplicates) {
          try {
            const processedData = {
              ...studentData,
              send_invite: true, // Always send invite for bulk uploads
            };

            const result = await cohortStudentsService.addOne(
              cohortId,
              processedData
            );

            if (result.success && result.data) {
              successCount++;

              if (processedData.send_invite && result.data) {
                try {
                  await handleStudentInvitation(
                    result.data.id,
                    processedData.email
                  );
                  inviteCount++;
                } catch (inviteError) {
                  console.error('Failed to send invitation:', inviteError);
                  // Continue with other students even if invitation fails
                }
              }
            }
          } catch (error) {
            console.error('Error processing student:', error);
            // Continue with other students even if one fails
          }
        }

        if (successCount > 0) {
          const message = `Successfully added ${successCount} student(s)${inviteCount > 0 ? ` and sent ${inviteCount} invitation(s)` : ''}`;
          toast.success(message);
          loadData();
          return { success: true, message };
        } else {
          return { success: false, message: 'Failed to process any students' };
        }
      } catch (error) {
        console.error('Bulk upload error:', error);
        return {
          success: false,
          message: 'An error occurred during bulk upload',
        };
      }
    },
    [
      cohortId,
      validateStudentRow,
      checkDuplicateStudents,
      handleStudentInvitation,
      loadData,
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data when component becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Remove loadData dependency to prevent infinite re-renders

  // Auto-refresh every 30 seconds as fallback for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []); // Remove loadData dependency to prevent infinite re-renders

  // Set up real-time subscription for cohort_students changes
  useEffect(() => {
    if (!cohortId) return;

    const channelName = `cohort_students_${cohortId}`;

    const subscription = connectionManager
      .createChannel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cohort_students',
          filter: `cohort_id=eq.${cohortId}`,
        },
        payload => {
          // Check if the change is related to invitation status
          if (
            payload.new &&
            payload.old &&
            (payload.new.invite_status !== payload.old.invite_status ||
              payload.new.accepted_at !== payload.old.accepted_at ||
              payload.new.user_id !== payload.old.user_id)
          ) {
            // Refresh data when invitation status changes
          }
          // Refresh data when any change occurs
          loadData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cohort_students',
          filter: `cohort_id=eq.${cohortId}`,
        },
        payload => {
          loadData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'cohort_students',
          filter: `cohort_id=eq.${cohortId}`,
        },
        payload => {
          loadData(true);
        }
      )
      // Add real-time subscription for student_scholarships table
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_scholarships',
        },
        payload => {
          // Refresh data when a scholarship is assigned
          loadData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_scholarships',
        },
        payload => {
          // Refresh data when a scholarship is updated
          loadData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'student_scholarships',
        },
        payload => {
          // Refresh data when a scholarship is removed
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      connectionManager.removeChannel(channelName);
    };
  }, [cohortId]); // Remove loadData dependency to prevent infinite re-renders

  return {
    loading,
    students,
    cohort,
    deletingStudentId,
    loadData,
    handleDeleteStudent,
    updateStudent,
    validateStudentRow,
    processBulkUpload,
    checkDuplicateStudents,
  };
}
