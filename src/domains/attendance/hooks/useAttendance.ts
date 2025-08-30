/**
 * Attendance Domain Hooks
 * Modernized attendance hooks following enterprise patterns
 */

import { useState, useCallback, useMemo } from 'react';
import { useApiQuery, useApiMutation } from '@/shared/hooks/useApiQuery';
import {
  attendanceService,
  AttendanceFilters,
  AttendanceRecord,
  SessionInfo,
  AttendanceSummary,
  AttendanceStats,
  EpicInfo,
} from '../services/AttendanceService';
import { format } from 'date-fns';

export interface UseAttendanceOptions {
  cohortId: string;
  epicId?: string;
  sessionDate?: Date;
  sessionNumber?: number;
  enabled?: boolean;
  autoRefresh?: boolean;
}

export function useAttendance(options: UseAttendanceOptions) {
  const {
    cohortId,
    epicId,
    sessionDate,
    sessionNumber,
    enabled = true,
    autoRefresh = false,
  } = options;

  const [filters, setFilters] = useState<AttendanceFilters>({
    cohortId,
    epicId,
    sessionDate: sessionDate ? format(sessionDate, 'yyyy-MM-dd') : undefined,
    sessionNumber,
    limit: 100,
    offset: 0,
  });

  // Fetch attendance records
  const {
    data: attendanceRecords = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['attendance', 'records', filters],
    queryFn: () => attendanceService.getAttendanceRecords(filters),
    enabled: enabled && !!cohortId,
    staleTime: autoRefresh ? 30 * 1000 : 2 * 60 * 1000,
  });

  // Fetch attendance summary
  const { data: attendanceSummary = [], isLoading: summaryLoading } =
    useApiQuery({
      queryKey: ['attendance', 'summary', cohortId, epicId],
      queryFn: () => attendanceService.getAttendanceSummary(cohortId, epicId),
      enabled: enabled && !!cohortId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  // Fetch attendance statistics
  const { data: stats, isLoading: statsLoading } = useApiQuery({
    queryKey: ['attendance', 'stats', cohortId, epicId],
    queryFn: () => attendanceService.getAttendanceStats(cohortId, epicId),
    enabled: enabled && !!cohortId,
    staleTime: 5 * 60 * 1000,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useApiMutation({
    mutationFn: ({
      studentId,
      status,
      absenceType,
      reason,
    }: {
      studentId: string;
      status: AttendanceRecord['status'];
      absenceType?: AttendanceRecord['absence_type'];
      reason?: string;
    }) => {
      if (!epicId || !sessionDate || sessionNumber === undefined) {
        return Promise.reject(
          new Error('Missing required attendance parameters')
        );
      }

      return attendanceService.markAttendance(
        cohortId,
        epicId,
        sessionNumber,
        format(sessionDate, 'yyyy-MM-dd'),
        studentId,
        status,
        absenceType,
        reason
      );
    },
    successMessage: 'Attendance marked successfully',
    invalidateQueries: [['attendance']],
  });

  // Bulk mark attendance mutation
  const bulkMarkAttendanceMutation = useApiMutation({
    mutationFn: attendanceService.bulkMarkAttendance.bind(attendanceService),
    successMessage: 'Bulk attendance marked successfully',
    invalidateQueries: [['attendance']],
  });

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<AttendanceFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Actions
  const markAttendance = useCallback(
    (
      studentId: string,
      status: AttendanceRecord['status'],
      absenceType?: AttendanceRecord['absence_type'],
      reason?: string
    ) => {
      return markAttendanceMutation.mutateAsync({
        studentId,
        status,
        absenceType,
        reason,
      });
    },
    [markAttendanceMutation]
  );

  const bulkMarkAttendance = useCallback(
    (
      attendanceData: Parameters<typeof attendanceService.bulkMarkAttendance>[0]
    ) => {
      return bulkMarkAttendanceMutation.mutateAsync(attendanceData);
    },
    [bulkMarkAttendanceMutation]
  );

  // Calculate derived data
  const attendanceByStudent = useMemo(() => {
    const studentMap: Record<string, AttendanceRecord[]> = {};
    attendanceRecords.forEach(record => {
      if (!studentMap[record.student_id]) {
        studentMap[record.student_id] = [];
      }
      studentMap[record.student_id].push(record);
    });
    return studentMap;
  }, [attendanceRecords]);

  const sessionAttendanceCount = useMemo(() => {
    const counts = {
      present: attendanceRecords.filter(r => r.status === 'present').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      total: attendanceRecords.length,
    };
    return {
      ...counts,
      percentage:
        counts.total > 0
          ? Math.round(((counts.present + counts.late) / counts.total) * 100)
          : 0,
    };
  }, [attendanceRecords]);

  return {
    // Data
    attendanceRecords,
    attendanceSummary,
    stats: stats as AttendanceStats | undefined,
    attendanceByStudent,
    sessionAttendanceCount,

    // Loading states
    isLoading,
    summaryLoading,
    statsLoading,
    isMarkingAttendance: markAttendanceMutation.isPending,
    isBulkMarking: bulkMarkAttendanceMutation.isPending,

    // Error states
    error,

    // Filters
    filters,
    updateFilters,

    // Actions
    markAttendance,
    bulkMarkAttendance,
    refetch,
  };
}

/**
 * Hook for managing sessions
 */
export function useSessions(
  cohortId: string,
  epicId: string,
  sessionDate: Date
) {
  const formattedDate = format(sessionDate, 'yyyy-MM-dd');

  const {
    data: sessions = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['sessions', cohortId, epicId, formattedDate],
    queryFn: () =>
      attendanceService.getSessionsForDate(cohortId, epicId, formattedDate),
    enabled: !!cohortId && !!epicId,
    staleTime: 2 * 60 * 1000,
  });

  // Toggle session cancellation mutation
  const toggleCancellationMutation = useApiMutation({
    mutationFn: ({
      sessionNumber,
      isCancelled,
    }: {
      sessionNumber: number;
      isCancelled: boolean;
    }) =>
      attendanceService.toggleSessionCancellation(
        cohortId,
        epicId,
        sessionNumber,
        formattedDate,
        isCancelled
      ),
    successMessage: 'Session updated successfully',
    invalidateQueries: [['sessions', cohortId, epicId, formattedDate]],
  });

  const toggleSessionCancellation = useCallback(
    (sessionNumber: number, isCancelled: boolean) => {
      return toggleCancellationMutation.mutateAsync({
        sessionNumber,
        isCancelled,
      });
    },
    [toggleCancellationMutation]
  );

  return {
    sessions,
    isLoading,
    error,
    isUpdatingSession: toggleCancellationMutation.isPending,
    toggleSessionCancellation,
    refetch,
  };
}

/**
 * Hook for cohort epics
 */
export function useCohortEpics(cohortId: string) {
  const {
    data: epics = [],
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ['epics', cohortId],
    queryFn: () => attendanceService.getCohortEpics(cohortId),
    enabled: !!cohortId,
    staleTime: 10 * 60 * 1000, // 10 minutes - epics don't change often
  });

  return {
    epics: epics as EpicInfo[],
    isLoading,
    error,
  };
}

/**
 * Hook for attendance leaderboard data
 */
export function useAttendanceLeaderboard(cohortId: string, epicId?: string) {
  const {
    data: summary = [],
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ['attendance', 'leaderboard', cohortId, epicId],
    queryFn: () => attendanceService.getAttendanceSummary(cohortId, epicId),
    enabled: !!cohortId,
    staleTime: 2 * 60 * 1000,
  });

  // Sort by attendance percentage and add rankings
  const leaderboard = useMemo(() => {
    const sortedSummary = summary.sort(
      (a, b) => b.attendance_percentage - a.attendance_percentage
    );

    // Assign ranks with proper tie handling
    let currentRank = 1;
    let currentIndex = 0;

    while (currentIndex < sortedSummary.length) {
      const currentStudent = sortedSummary[currentIndex];
      let tiedCount = 1;

      // Count how many students have the same attendance percentage
      for (let i = currentIndex + 1; i < sortedSummary.length; i++) {
        const nextStudent = sortedSummary[i];
        if (
          nextStudent.attendance_percentage ===
          currentStudent.attendance_percentage
        ) {
          tiedCount++;
        } else {
          break;
        }
      }

      // Assign the same rank to all tied students
      for (let i = 0; i < tiedCount; i++) {
        const student = sortedSummary[currentIndex + i];
        student.rank = currentRank;
        student.badge =
          currentRank <= 3 ? ['🥇', '🥈', '🥉'][currentRank - 1] : undefined;
      }

      // Move to next rank and next group of students
      currentRank += 1; // Increment by 1 for each unique rank
      currentIndex += tiedCount;
    }

    return sortedSummary;
  }, [summary]);

  const topPerformers = useMemo(() => {
    return leaderboard.slice(0, 10);
  }, [leaderboard]);

  const attendanceDistribution = useMemo(() => {
    const ranges = {
      excellent: 0, // 95-100%
      good: 0, // 85-94%
      average: 0, // 75-84%
      poor: 0, // <75%
    };

    summary.forEach(student => {
      const percentage = student.attendance_percentage;
      if (percentage >= 95) ranges.excellent++;
      else if (percentage >= 85) ranges.good++;
      else if (percentage >= 75) ranges.average++;
      else ranges.poor++;
    });

    return ranges;
  }, [summary]);

  return {
    leaderboard,
    topPerformers,
    attendanceDistribution,
    isLoading,
    error,
  };
}
