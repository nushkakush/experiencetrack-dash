import type { CohortStudent, AttendanceRecord } from '@/types/attendance';

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
      
      // Calculate basic stats
      const totalSessions = studentRecords.length;
      const presentSessions = studentRecords.filter(record => record.status === 'present').length;
      const lateSessions = studentRecords.filter(record => record.status === 'late').length;
      const absentSessions = studentRecords.filter(record => record.status === 'absent').length;
      const attendedSessions = presentSessions + lateSessions; // Both present and late count as attended
      const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      // Calculate current streak (consecutive days of attendance)
      const currentStreak = this.calculateCurrentStreak(studentRecords);

      return {
        student,
        attendancePercentage,
        absentDays: absentSessions,
        currentStreak,
        totalSessions,
        presentSessions: attendedSessions, // This represents attended sessions (present + late)
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
    
    let currentStreak = 0;
    for (const record of sortedRecords) {
      if (record.status === 'present' || record.status === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }

  static getAttendanceColor(percentage: number): string {
    if (percentage >= 95) return 'text-green-600 font-semibold';
    if (percentage >= 85) return 'text-blue-600 font-semibold';
    if (percentage >= 75) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  }

  static getSessionBreakdown(studentId: string, attendanceRecords: AttendanceRecord[]) {
    const records = attendanceRecords.filter(r => r.student_id === studentId);
    return {
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
    };
  }
}
