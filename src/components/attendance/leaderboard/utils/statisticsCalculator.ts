import type { CohortStudent, AttendanceRecord } from '@/types/attendance';
import { calculateAttendanceBreakdown, calculateCurrentStreak, getAttendanceColor } from '@/utils/attendanceCalculations';

export interface StudentStats {
  student: CohortStudent;
  attendancePercentage: number;
  absentDays: number;
  currentStreak: number;
  totalSessions: number;
  presentSessions: number;
  rank: number;
}

export class StatisticsCalculator {
  static calculateStudentStats(
    students: CohortStudent[],
    attendanceRecords: AttendanceRecord[]
  ): StudentStats[] {
    const studentStats: StudentStats[] = students.map(student => {
      // Get all attendance records for this student in current epic
      const studentRecords = attendanceRecords.filter(record => record.student_id === student.id);
      
      // Calculate attendance breakdown using utility function
      const breakdown = calculateAttendanceBreakdown(studentRecords);
      
      // Calculate current streak using utility function
      const sortedRecords = studentRecords
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
      const currentStreak = calculateCurrentStreak(sortedRecords);

      return {
        student,
        attendancePercentage: breakdown.attendancePercentage,
        absentDays: breakdown.regularAbsent, // Only count non-exempted absences
        currentStreak,
        totalSessions: breakdown.total,
        presentSessions: breakdown.attended, // This represents attended sessions (present + late + exempted)
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by attendance percentage (descending), then by streak (descending)
    studentStats.sort((a, b) => {
      if (b.attendancePercentage !== a.attendancePercentage) {
        return b.attendancePercentage - a.attendancePercentage;
      }
      return b.currentStreak - a.currentStreak;
    });

    // Assign ranks
    studentStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    return studentStats;
  }

  static calculateCurrentStreak(studentRecords: AttendanceRecord[]): number {
    const sortedRecords = studentRecords
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
    
    return calculateCurrentStreak(sortedRecords);
  }

  static getAttendanceColor(percentage: number): string {
    return getAttendanceColor(percentage);
  }

  static getSessionBreakdown(studentId: string, attendanceRecords: AttendanceRecord[]) {
    const records = attendanceRecords.filter(r => r.student_id === studentId);
    const breakdown = calculateAttendanceBreakdown(records);
    
    return {
      present: breakdown.present,
      late: breakdown.late,
      absent: breakdown.regularAbsent, // Exclude exempted from absent count
      exempted: breakdown.exempted, // Separate exempted count
    };
  }
}
