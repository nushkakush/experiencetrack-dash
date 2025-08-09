import { useMemo } from 'react';
import { StatisticsCalculator } from '../utils/statisticsCalculator';
import type { CohortStudent, AttendanceRecord } from '@/types/attendance';

export const useLeaderboardCalculations = (
  students: CohortStudent[],
  attendanceRecords: AttendanceRecord[]
) => {
  const studentStats = useMemo(() => {
    return StatisticsCalculator.calculateStudentStats(students, attendanceRecords);
  }, [students, attendanceRecords]);

  const getSessionBreakdown = useMemo(() => {
    return (studentId: string) => 
      StatisticsCalculator.getSessionBreakdown(studentId, attendanceRecords);
  }, [attendanceRecords]);

  return {
    studentStats,
    getSessionBreakdown,
  };
};
