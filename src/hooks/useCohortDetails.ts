import { useState, useEffect, useCallback } from "react";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { cohortsService } from "@/services/cohorts.service";
import { CohortStudent, CohortWithCounts, NewStudentInput } from "@/types/cohort";
import { toast } from "sonner";
import { supabase, connectionManager } from '@/integrations/supabase/client';
import { Logger } from "@/lib/logging/Logger";
import { useAuth } from "@/hooks/useAuth";

export function useCohortDetails(cohortId: string | undefined) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [cohort, setCohort] = useState<CohortWithCounts | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Load data. When background=true, avoid flipping the main loading state
  // to prevent full-page skeleton flashes during focus/visibility or realtime updates.
  const loadData = useCallback(async (background: boolean = false) => {
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
      const studentsRes = await cohortStudentsService.listAllByCohort(cohortId);
      setStudents(studentsRes.data || []);
    } catch (error) {
      Logger.getInstance().error("Error loading cohort details", { error, cohortId });
      toast.error("Failed to load cohort details");
    } finally {
      if (background) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [cohortId]);

  const handleDeleteStudent = useCallback(async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const result = await cohortStudentsService.delete(studentId);
      if (result.success) {
        toast.success("Student removed from cohort successfully");
        await loadData(); // Reload data to update the list
      } else {
        toast.error("Failed to remove student from cohort");
      }
    } catch (error) {
      Logger.getInstance().error("Error deleting student", { error, studentId, cohortId });
      toast.error("An error occurred while removing the student");
    } finally {
      setDeletingStudentId(null);
    }
  }, [loadData]);

  const updateStudent = useCallback((studentId: string, updates: Partial<CohortStudent>) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, ...updates } : student
      )
    );
  }, []);

  const validateStudentRow = useCallback((data: any, row: number): string[] => {
    const errors: string[] = [];

    // Validate required fields
    if (!data.first_name?.trim()) {
      errors.push("First name is required");
    }
    if (!data.last_name?.trim()) {
      errors.push("Last name is required");
    }
    if (!data.email?.trim()) {
      errors.push("Email is required");
    }

    // Validate email format
    if (data.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push("Invalid email format");
      }
    }

    // Validate invite field if present
    if (data.invite && data.invite.trim()) {
      const inviteValue = data.invite.trim().toUpperCase();
      if (inviteValue !== 'YES' && inviteValue !== 'NO') {
        errors.push("Invite field must be 'YES' or 'NO'");
      }
    }

    return errors;
  }, []);

  const processValidStudents = useCallback(async (
    studentsData: NewStudentInput[], 
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string }> => {
    if (!cohortId) {
      return { success: false, message: "Cohort ID is missing" };
    }

    let successCount = 0;
    let errorCount = 0;
    let inviteCount = 0;

    for (const studentData of studentsData) {
      try {
        // Process the invite field
        const processedData = { ...studentData };
        if (studentData.invite) {
          const inviteValue = studentData.invite.toString().trim().toUpperCase();
          processedData.send_invite = inviteValue === 'YES';
        } else {
          processedData.send_invite = false; // Default to false if not specified
        }

        if (duplicateHandling === 'overwrite') {
          // Use upsert to handle duplicates - will update if exists, insert if not
          const result = await cohortStudentsService.upsertStudent(cohortId, processedData);
          if (result.success) {
            successCount++;
            // Handle invitation if needed
            if (processedData.send_invite && result.data) {
              try {
                await handleStudentInvitation(result.data, processedData);
                inviteCount++;
              } catch (inviteError) {
                Logger.getInstance().error(`Failed to send invitation to ${processedData.email}`, { error: inviteError, email: processedData.email, cohortId, mode: 'overwrite' });
              }
            }
          } else {
            errorCount++;
          }
        } else {
          // For ignore mode, just add normally (duplicates will be filtered out by the component)
          const result = await cohortStudentsService.addOne(cohortId, processedData);
          if (result.success) {
            successCount++;
            // Handle invitation if needed
            if (processedData.send_invite && result.data) {
              try {
                await handleStudentInvitation(result.data, processedData);
                inviteCount++;
              } catch (inviteError) {
                Logger.getInstance().error(`Failed to send invitation to ${processedData.email}`, { error: inviteError, email: processedData.email, cohortId, mode: 'ignore' });
              }
            }
          } else {
            errorCount++;
          }
        }
      } catch (error) {
        errorCount++;
        Logger.getInstance().error(`Error adding student ${studentData.email}`, { error, email: studentData.email, cohortId });
      }
    }

    if (successCount > 0) {
      const message = `Successfully ${duplicateHandling === 'overwrite' ? 'processed' : 'added'} ${successCount} students`;
      const inviteMessage = inviteCount > 0 ? `, ${inviteCount} invitations sent` : '';
      const errorMessage = errorCount > 0 ? `, ${errorCount} failed` : '';
      return { 
        success: true, 
        message: `${message}${inviteMessage}${errorMessage}` 
      };
    } else {
      return { success: false, message: "Failed to process any students" };
    }
  }, [cohortId]);

  // Helper function to handle student invitation
  const handleStudentInvitation = async (student: CohortStudent, studentData: NewStudentInput) => {
    try {
      // Use the new SendGrid-based invitation system
      const invitationResult = await cohortStudentsService.sendCustomInvitation(
        student.id, 
        profile?.user_id || ''
      );
      
      if (invitationResult.success) {
        // Send email via Edge Function
        const emailResult = await cohortStudentsService.sendInvitationEmail(
          student.id,
          studentData.email,
          studentData.first_name || '',
          studentData.last_name || '',
          cohort?.name || 'Your Cohort'
        );
        
        if (emailResult.success && emailResult.data?.emailSent) {
          Logger.getInstance().info(`Invitation email sent to ${studentData.email}`, { 
            email: studentData.email, 
            studentId: student.id,
            cohortId 
          });
        } else {
          Logger.getInstance().warn(`Invitation prepared but email may not have been sent to ${studentData.email}`, { 
            email: studentData.email, 
            studentId: student.id,
            cohortId,
            emailResult 
          });
        }
      } else {
        throw new Error('Failed to prepare invitation');
      }
    } catch (error) {
      Logger.getInstance().error(`Failed to send invitation to ${studentData.email}`, { 
        error, 
        email: studentData.email, 
        studentId: student.id,
        cohortId 
      });
      throw error;
    }
  };

  const checkDuplicateStudents = useCallback(async (
    studentsData: NewStudentInput[]
  ): Promise<Array<{ data: NewStudentInput; row: number; existingData?: any }>> => {
    if (!cohortId) return [];

    const duplicates: Array<{ data: NewStudentInput; row: number; existingData?: any }> = [];
    
    // Get existing students in this cohort
    const existingStudentsRes = await cohortStudentsService.listByCohort(cohortId);
    const existingStudents = existingStudentsRes.data || [];
    
    // Check for duplicates based on email
    studentsData.forEach((student, index) => {
      const existingStudent = existingStudents.find(existing => 
        existing.email.toLowerCase() === student.email.toLowerCase()
      );
      
      if (existingStudent) {
        duplicates.push({
          data: student,
          row: index + 1,
          existingData: existingStudent
        });
      }
    });

    return duplicates;
  }, [cohortId]);

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

    const subscription = connectionManager.createChannel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cohort_students',
          filter: `cohort_id=eq.${cohortId}`
        },
        (payload) => {
          // Check if the change is related to invitation status
          if (payload.new && payload.old && 
              (payload.new.invite_status !== payload.old.invite_status ||
               payload.new.accepted_at !== payload.old.accepted_at ||
               payload.new.user_id !== payload.old.user_id)) {
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
          filter: `cohort_id=eq.${cohortId}`
        },
        (payload) => {
          loadData(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'cohort_students',
          filter: `cohort_id=eq.${cohortId}`
        },
        (payload) => {
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
    processValidStudents,
    checkDuplicateStudents,
  };
}
