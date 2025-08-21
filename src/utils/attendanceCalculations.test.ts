import { 
  calculateAttendanceBreakdown, 
  calculateAbsenceBreakdown, 
  calculateCurrentStreak,
  isAttendedForAnalytics 
} from './attendanceCalculations';
import type { AttendanceRecord } from '@/types/attendance';

describe('Attendance Calculations with Exempted Absences', () => {
  const mockRecords: AttendanceRecord[] = [
    {
      id: '1',
      student_id: 'student1',
      status: 'present',
      absence_type: null,
      reason: null,
      marked_by: 'user1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      cohort_id: 'cohort1',
      epic_id: 'epic1',
      session_number: 1,
      session_date: '2024-01-01',
    },
    {
      id: '2',
      student_id: 'student1',
      status: 'absent',
      absence_type: 'exempted',
      reason: 'Medical emergency',
      marked_by: 'user1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      cohort_id: 'cohort1',
      epic_id: 'epic1',
      session_number: 2,
      session_date: '2024-01-02',
    },
    {
      id: '3',
      student_id: 'student1',
      status: 'absent',
      absence_type: 'uninformed',
      reason: 'No reason provided',
      marked_by: 'user1',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
      cohort_id: 'cohort1',
      epic_id: 'epic1',
      session_number: 3,
      session_date: '2024-01-03',
    },
    {
      id: '4',
      student_id: 'student1',
      status: 'late',
      absence_type: null,
      reason: 'Traffic',
      marked_by: 'user1',
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z',
      cohort_id: 'cohort1',
      epic_id: 'epic1',
      session_number: 4,
      session_date: '2024-01-04',
    },
  ];

  describe('calculateAttendanceBreakdown', () => {
    it('should count exempted absences as attended for analytics', () => {
      const breakdown = calculateAttendanceBreakdown(mockRecords);
      
      expect(breakdown.present).toBe(1);
      expect(breakdown.late).toBe(1);
      expect(breakdown.exempted).toBe(1);
      expect(breakdown.regularAbsent).toBe(1);
      expect(breakdown.total).toBe(4);
      expect(breakdown.attended).toBe(3); // present + late + exempted
      expect(breakdown.attendancePercentage).toBe(75); // 3/4 * 100
    });

    it('should handle empty records', () => {
      const breakdown = calculateAttendanceBreakdown([]);
      
      expect(breakdown.present).toBe(0);
      expect(breakdown.late).toBe(0);
      expect(breakdown.exempted).toBe(0);
      expect(breakdown.regularAbsent).toBe(0);
      expect(breakdown.total).toBe(0);
      expect(breakdown.attended).toBe(0);
      expect(breakdown.attendancePercentage).toBe(0);
    });
  });

  describe('calculateAbsenceBreakdown', () => {
    it('should separate exempted absences from regular absences', () => {
      const breakdown = calculateAbsenceBreakdown(mockRecords);
      
      expect(breakdown.uninformed).toBe(1);
      expect(breakdown.informed).toBe(0);
      expect(breakdown.exempted).toBe(1);
      expect(breakdown.total).toBe(1); // Only uninformed + informed, not exempted
    });
  });

  describe('calculateCurrentStreak', () => {
    it('should count exempted absences in streak calculation', () => {
      // Sort records by date descending (most recent first)
      const sortedRecords = [...mockRecords].sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      
      const streak = calculateCurrentStreak(sortedRecords);
      
      // Records sorted by date descending: session 4 (late), session 3 (uninformed absent), session 2 (exempted), session 1 (present)
      // Should count: late (session 4) = 1, then stop at uninformed absence (session 3)
      expect(streak).toBe(1);
    });

    it('should count consecutive attended sessions including exempted', () => {
      // Create records with consecutive attended sessions including exempted
      const consecutiveRecords: AttendanceRecord[] = [
        {
          id: '1',
          student_id: 'student1',
          status: 'present',
          absence_type: null,
          reason: null,
          marked_by: 'user1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          cohort_id: 'cohort1',
          epic_id: 'epic1',
          session_number: 1,
          session_date: '2024-01-01',
        },
        {
          id: '2',
          student_id: 'student1',
          status: 'absent',
          absence_type: 'exempted',
          reason: 'Medical emergency',
          marked_by: 'user1',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          cohort_id: 'cohort1',
          epic_id: 'epic1',
          session_number: 2,
          session_date: '2024-01-02',
        },
        {
          id: '3',
          student_id: 'student1',
          status: 'late',
          absence_type: null,
          reason: 'Traffic',
          marked_by: 'user1',
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          cohort_id: 'cohort1',
          epic_id: 'epic1',
          session_number: 3,
          session_date: '2024-01-03',
        },
      ];
      
      // Sort by date descending (most recent first)
      const sortedRecords = consecutiveRecords.sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );
      
      const streak = calculateCurrentStreak(sortedRecords);
      
      // Should count: late (session 3) + exempted (session 2) + present (session 1) = 3
      expect(streak).toBe(3);
    });
  });

  describe('isAttendedForAnalytics', () => {
    it('should return true for present, late, and exempted records', () => {
      const presentRecord = mockRecords[0];
      const lateRecord = mockRecords[3];
      const exemptedRecord = mockRecords[1];
      const regularAbsentRecord = mockRecords[2];
      
      expect(isAttendedForAnalytics(presentRecord)).toBe(true);
      expect(isAttendedForAnalytics(lateRecord)).toBe(true);
      expect(isAttendedForAnalytics(exemptedRecord)).toBe(true);
      expect(isAttendedForAnalytics(regularAbsentRecord)).toBe(false);
    });
  });
});
