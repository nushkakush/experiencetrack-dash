import React from 'react';
import { Users, TrendingUp, AlertTriangle, Bell, CheckCircle, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import type { CohortStudent, AttendanceRecord, CohortEpic } from '@/types/attendance';

interface AttendanceStatisticsProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[]; // Session-specific records for today's stats
  epicAttendanceRecords?: AttendanceRecord[]; // All epic records for streak calculation
  currentEpic: CohortEpic | null;
  selectedDate: Date;
  isSessionCancelled?: boolean;
}

export const AttendanceStatistics: React.FC<AttendanceStatisticsProps> = ({
  students,
  attendanceRecords,
  epicAttendanceRecords,
  currentEpic,
  selectedDate,
  isSessionCancelled = false,
}) => {
  // Calculate today's attendance
  const totalStudents = students.length;
  const presentToday = attendanceRecords.filter(record => record.status === 'present').length;
  const absentToday = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateToday = attendanceRecords.filter(record => record.status === 'late').length;
  const markedToday = presentToday + absentToday + lateToday;
  
  const todayAttendancePercentage = totalStudents > 0 ? ((presentToday + lateToday) / totalStudents) * 100 : 0;

  // Calculate absences
  const uninformedAbsents = attendanceRecords.filter(
    record => record.status === 'absent' && record.absence_type === 'uninformed'
  ).length;
  
  const informedAbsents = attendanceRecords.filter(
    record => record.status === 'absent' && (record.absence_type === 'informed' || record.absence_type === 'exempted')
  ).length;

  // Calculate top streak across all students
  const calculateTopStreak = () => {
    if (students.length === 0) return { value: 0, studentName: '-' };

    let topStreak = 0;
    let topStreakStudent = '-';

    students.forEach(student => {
      // Get attendance records for this student (use epic records if available, otherwise fall back to session records)
      const recordsToUse = epicAttendanceRecords || attendanceRecords;
      const studentRecords = recordsToUse.filter(record => record.student_id === student.id);
      
      // Sort by date descending (most recent first)
      const sortedRecords = studentRecords
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
      
      // Calculate current streak for this student
      let currentStreak = 0;
      for (const record of sortedRecords) {
        if (record.status === 'present' || record.status === 'late') {
          currentStreak++;
        } else {
          break;
        }
      }

      // Update top streak if this student has a higher streak
      if (currentStreak > topStreak) {
        topStreak = currentStreak;
        topStreakStudent = `${student.first_name} ${student.last_name}`;
      }
    });

    return { value: topStreak, studentName: topStreakStudent };
  };

  const topStreakData = calculateTopStreak();

  // Determine attendance status
  const getAttendanceStatus = () => {
    if (isSessionCancelled) return { text: 'Session Cancelled', variant: 'warning' as const };
    if (totalStudents === 0) return { text: 'No Students', variant: 'default' as const };
    if (markedToday === totalStudents) return { text: 'Complete', variant: 'success' as const };
    if (markedToday === 0) return { text: 'Not Started', variant: 'default' as const };
    if (absentToday > totalStudents * 0.5) return { text: 'Needs Attention', variant: 'error' as const };
    return { text: 'In Progress', variant: 'info' as const };
  };

  const attendanceStatus = getAttendanceStatus();

  return (
    <StatisticsGrid columns={6}>
      <StatisticItem
        icon={<Users className="h-5 w-5" />}
        title="Today's Attendance"
        value={`${presentToday + lateToday}/${totalStudents}`}
        subtitle={`${todayAttendancePercentage.toFixed(1)}% attended`}
        variant="default"
      />

      <StatisticItem
        icon={<TrendingUp className="h-5 w-5" />}
        title="Overall Average"
        value="0.0%"
        subtitle="All-time attendance rate"
        variant="default"
      />

      <StatisticItem
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Attendance Status"
        value={attendanceStatus.text}
        subtitle="Current status"
        variant="default"
        badge={
          attendanceStatus.variant === 'error' ? (
            <Badge variant="destructive">Needs Attention</Badge>
          ) : null
        }
      />

      <StatisticItem
        icon={<Crown className="h-5 w-5" />}
        title="Top Streak"
        value={topStreakData.value}
        subtitle={topStreakData.value > 0 ? topStreakData.studentName : 'No active streaks'}
        variant="default"
      />

      <StatisticItem
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Uninformed Absents"
        value={uninformedAbsents}
        subtitle="For this EPIC only"
        variant="default"
      />

      <StatisticItem
        icon={<CheckCircle className="h-5 w-5" />}
        title="Informed Absents"
        value={informedAbsents}
        subtitle="For this EPIC only"
        variant="default"
      />
    </StatisticsGrid>
  );
};
