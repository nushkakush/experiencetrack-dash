import { useState, useEffect, useCallback } from "react";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { cohortsService } from "@/services/cohorts.service";
import { CohortStudent, CohortWithCounts, NewStudentInput } from "@/types/cohort";
import { toast } from "sonner";

export function useCohortDetails(cohortId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [cohort, setCohort] = useState<CohortWithCounts | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!cohortId) return;
    
    setLoading(true);
    try {
      // Load cohort details with counts
      const cohortRes = await cohortsService.getByIdWithCounts(cohortId);
      if (cohortRes.success && cohortRes.data) {
        setCohort(cohortRes.data);
      }

      // Load students
      const studentsRes = await cohortStudentsService.listByCohort(cohortId);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error("Error loading cohort details:", error);
      toast.error("Failed to load cohort details");
    } finally {
      setLoading(false);
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
      console.error("Error deleting student:", error);
      toast.error("An error occurred while removing the student");
    } finally {
      setDeletingStudentId(null);
    }
  }, [loadData]);

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

    for (const studentData of studentsData) {
      try {
        if (duplicateHandling === 'overwrite') {
          // Use upsert to handle duplicates - will update if exists, insert if not
          const result = await cohortStudentsService.upsertStudent(cohortId, studentData);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          // For ignore mode, just add normally (duplicates will be filtered out by the component)
          const result = await cohortStudentsService.addOne(cohortId, studentData);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`Error adding student ${studentData.email}:`, error);
      }
    }

    if (successCount > 0) {
      return { 
        success: true, 
        message: `Successfully ${duplicateHandling === 'overwrite' ? 'processed' : 'added'} ${successCount} students${errorCount > 0 ? `, ${errorCount} failed` : ''}` 
      };
    } else {
      return { success: false, message: "Failed to process any students" };
    }
  }, [cohortId]);

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

  return {
    loading,
    students,
    cohort,
    deletingStudentId,
    loadData,
    handleDeleteStudent,
    validateStudentRow,
    processValidStudents,
    checkDuplicateStudents,
  };
}
