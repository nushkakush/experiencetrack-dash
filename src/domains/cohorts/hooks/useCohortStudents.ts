/**
 * Cohort Students Hook
 * Extracted business logic from CohortStudentsTable.tsx
 */

import { useState, useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/useApiQuery';
import { cohortService } from '@/domains/cohorts/services/CohortService';
import { CohortStudent } from '@/types/cohort';
import { Logger } from '@/lib/logging/Logger';

export interface CohortStudentsFilters {
  search: string;
  status: 'all' | 'active' | 'dropped' | 'completed';
  sortBy: 'name' | 'email' | 'joined_date' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface UseCohortStudentsOptions {
  cohortId: string;
  enabled?: boolean;
}

export function useCohortStudents({ cohortId, enabled = true }: UseCohortStudentsOptions) {
  const [filters, setFilters] = useState<CohortStudentsFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Fetch cohort students
  const {
    data: students = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['cohortStudents', cohortId],
    queryFn: () => cohortService.getCohortStudents(cohortId),
    enabled: enabled && !!cohortId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add student mutation
  const addStudentMutation = useApiMutation({
    mutationFn: (studentId: string) => cohortService.addStudentToCohort(cohortId, studentId),
    successMessage: 'Student added successfully',
    invalidateQueries: [['cohortStudents', cohortId]],
  });

  // Remove student mutation
  const removeStudentMutation = useApiMutation({
    mutationFn: (studentId: string) => cohortService.removeStudentFromCohort(cohortId, studentId),
    successMessage: 'Student removed successfully',
    invalidateQueries: [['cohortStudents', cohortId]],
  });

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(student => 
        student.student?.name?.toLowerCase().includes(searchLower) ||
        student.student?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(student => student.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = getStudentFieldValue(a, filters.sortBy);
      const bValue = getStudentFieldValue(b, filters.sortBy);
      
      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, filters]);

  // Helper function to get field value for sorting
  const getStudentFieldValue = (student: CohortStudent, field: string): string => {
    switch (field) {
      case 'name':
        return student.student?.name || '';
      case 'email':
        return student.student?.email || '';
      case 'joined_date':
        return student.assignment_date || '';
      case 'status':
        return student.status || '';
      default:
        return '';
    }
  };

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<CohortStudentsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Toggle student selection
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  }, []);

  // Select all filtered students
  const selectAllStudents = useCallback(() => {
    const allIds = new Set(filteredStudents.map(s => s.student?.id).filter(Boolean) as string[]);
    setSelectedStudents(allIds);
  }, [filteredStudents]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedStudents(new Set());
  }, []);

  // Bulk actions
  const bulkRemoveStudents = useCallback(async () => {
    if (selectedStudents.size === 0) return;

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedStudents).map(studentId =>
        cohortService.removeStudentFromCohort(cohortId, studentId)
      );
      
      await Promise.all(promises);
      setSelectedStudents(new Set());
      refetch();
    } catch (error) {
      Logger.getInstance().error('Bulk remove failed', { error });
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedStudents, cohortId, refetch]);

  // Add student
  const addStudent = useCallback((studentId: string) => {
    addStudentMutation.mutate(studentId);
  }, [addStudentMutation]);

  // Remove student
  const removeStudent = useCallback((studentId: string) => {
    removeStudentMutation.mutate(studentId);
  }, [removeStudentMutation]);

  // Statistics
  const statistics = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const completed = students.filter(s => s.status === 'completed').length;
    const dropped = students.filter(s => s.status === 'dropped').length;

    return {
      total,
      active,
      completed,
      dropped,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      dropoutRate: total > 0 ? (dropped / total) * 100 : 0,
    };
  }, [students]);

  return {
    // Data
    students: filteredStudents,
    allStudents: students,
    statistics,
    
    // Loading states
    isLoading,
    error,
    bulkActionLoading,
    isAddingStudent: addStudentMutation.isPending,
    isRemovingStudent: removeStudentMutation.isPending,
    
    // Filters
    filters,
    updateFilters,
    
    // Selection
    selectedStudents,
    toggleStudentSelection,
    selectAllStudents,
    clearSelection,
    isAllSelected: selectedStudents.size === filteredStudents.length && filteredStudents.length > 0,
    
    // Actions
    addStudent,
    removeStudent,
    bulkRemoveStudents,
    refetch,
  };
}
