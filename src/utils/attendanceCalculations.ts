import type { AttendanceRecord } from '@/types/attendance';

/**
 * Utility functions for attendance calculations that properly handle exempted absences.
 * Exempted absences are treated as "present" for analytics purposes while maintaining
 * them as "absent" in the database for record-keeping.
 */

export interface AttendanceBreakdown {
  present: number;
  late: number;
  exempted: number;
  regularAbsent: number;
  total: number;
  attended: number; // present + late + exempted
  attendancePercentage: number;
}

export interface AbsenceBreakdown {
  uninformed: number;
  informed: number;
  exempted: number;
  total: number;
}

/**
 * Calculate attendance breakdown from attendance records
 * @param records Array of attendance records
 * @returns Attendance breakdown with exempted absences counted as attended
 */
export function calculateAttendanceBreakdown(records: AttendanceRecord[]): AttendanceBreakdown {
  const present = records.filter(record => record.status === 'present').length;
  const late = records.filter(record => record.status === 'late').length;
  const exempted = records.filter(record => 
    record.status === 'absent' && record.absence_type === 'exempted'
  ).length;
  const regularAbsent = records.filter(record => 
    record.status === 'absent' && record.absence_type !== 'exempted'
  ).length;
  
  const total = records.length;
  const attended = present + late + exempted; // Exempted counts as attended
  const attendancePercentage = total > 0 ? (attended / total) * 100 : 0;

  return {
    present,
    late,
    exempted,
    regularAbsent,
    total,
    attended,
    attendancePercentage,
  };
}

/**
 * Calculate absence breakdown from attendance records
 * @param records Array of attendance records
 * @returns Absence breakdown with exempted absences separated
 */
export function calculateAbsenceBreakdown(records: AttendanceRecord[]): AbsenceBreakdown {
  const uninformed = records.filter(
    record => record.status === 'absent' && record.absence_type === 'uninformed'
  ).length;
  
  const informed = records.filter(
    record => record.status === 'absent' && record.absence_type === 'informed'
  ).length;
  
  const exempted = records.filter(
    record => record.status === 'absent' && record.absence_type === 'exempted'
  ).length;
  
  const total = uninformed + informed; // Exempted not included in absence total

  return {
    uninformed,
    informed,
    exempted,
    total,
  };
}

/**
 * Calculate current attendance streak from attendance records
 * @param records Array of attendance records (should be sorted by date descending)
 * @returns Current consecutive attendance streak
 */
export function calculateCurrentStreak(records: AttendanceRecord[]): number {
  let currentStreak = 0;
  
  for (const record of records) {
    // For streak calculation: present, late, and exempted absences count as attended
    if (record.status === 'present' || record.status === 'late' || 
        (record.status === 'absent' && record.absence_type === 'exempted')) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
}

/**
 * Check if a record counts as attended for analytics purposes
 * @param record Attendance record
 * @returns True if the record counts as attended (present, late, or exempted)
 */
export function isAttendedForAnalytics(record: AttendanceRecord): boolean {
  return record.status === 'present' || 
         record.status === 'late' || 
         (record.status === 'absent' && record.absence_type === 'exempted');
}

/**
 * Get attendance color based on percentage
 * @param percentage Attendance percentage
 * @returns CSS class for attendance color
 */
export function getAttendanceColor(percentage: number): string {
  if (percentage >= 95) return 'text-green-600 font-semibold';
  if (percentage >= 85) return 'text-blue-600 font-semibold';
  if (percentage >= 75) return 'text-yellow-600 font-semibold';
  return 'text-red-600 font-semibold';
}
