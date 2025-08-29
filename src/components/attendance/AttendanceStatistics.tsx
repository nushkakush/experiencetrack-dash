import React from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle,
  Crown,
  Info,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import type {
  CohortStudent,
  AttendanceRecord,
  CohortEpic,
} from '@/types/attendance';
import {
  calculateAttendanceBreakdown,
  calculateAbsenceBreakdown,
} from '@/utils/attendanceCalculations';

interface AttendanceStatisticsProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[]; // Session-specific records for today's stats
  epicAttendanceRecords?: AttendanceRecord[]; // All epic records for streak calculation
  currentEpic: CohortEpic | null;
  selectedDate: Date;
  isSessionCancelled?: boolean;
  mode?: 'epic' | 'session'; // Changed from 'day' to 'epic'
}

export const AttendanceStatistics: React.FC<AttendanceStatisticsProps> = ({
  students,
  attendanceRecords,
  epicAttendanceRecords,
  currentEpic,
  selectedDate,
  isSessionCancelled = false,
  mode = 'epic', // Default to epic-specific stats
}) => {
  // Determine which records to use for calculations
  const recordsToUse =
    mode === 'epic' ? epicAttendanceRecords || [] : attendanceRecords;

  // For epic mode, use all epic records (no date filtering needed)
  const epicRecords = mode === 'epic' ? recordsToUse : attendanceRecords;

  // Calculate attendance breakdown using utility function
  const attendanceBreakdown = calculateAttendanceBreakdown(epicRecords);
  const absenceBreakdown = calculateAbsenceBreakdown(epicRecords);

  // Check if there are any exempted absences
  const hasExemptedAbsences = attendanceBreakdown.exempted > 0;

  // Calculate top streak across all students (always use epic records for streaks)
  const calculateTopStreak = () => {
    if (students.length === 0) return { value: 0, studentNames: ['-'] };

    let topStreak = 0;
    let topStreakStudents: string[] = [];

    students.forEach(student => {
      // Get attendance records for this student (use epic records if available, otherwise fall back to session records)
      const recordsToUse = epicAttendanceRecords || attendanceRecords;
      const studentRecords = recordsToUse.filter(
        record => record.student_id === student.id
      );

      // Sort by date descending (most recent first)
      const sortedRecords = studentRecords.sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      );

      // Calculate current streak for this student - exempted counts as attended
      let currentStreak = 0;
      for (const record of sortedRecords) {
        if (
          record.status === 'present' ||
          record.status === 'late' ||
          (record.status === 'absent' && record.absence_type === 'exempted')
        ) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Update top streak if this student has a higher streak
      if (currentStreak > topStreak) {
        topStreak = currentStreak;
        topStreakStudents = [`${student.first_name} ${student.last_name}`];
      }
      // If this student has the same streak, add them to the list
      else if (currentStreak === topStreak && currentStreak > 0) {
        topStreakStudents.push(`${student.first_name} ${student.last_name}`);
      }
    });

    return { value: topStreak, studentNames: topStreakStudents };
  };

  const topStreakData = calculateTopStreak();

  // Determine attendance status for epic
  const getEpicStatus = () => {
    const totalStudents = students.length;
    if (totalStudents === 0)
      return { text: 'No Students', variant: 'default' as const };
    if (attendanceBreakdown.total === 0)
      return { text: 'No Sessions', variant: 'default' as const };
    if (attendanceBreakdown.attendancePercentage >= 90)
      return { text: 'Excellent', variant: 'success' as const };
    if (attendanceBreakdown.attendancePercentage >= 75)
      return { text: 'Good', variant: 'info' as const };
    if (attendanceBreakdown.attendancePercentage >= 60)
      return { text: 'Fair', variant: 'warning' as const };
    return { text: 'Needs Attention', variant: 'error' as const };
  };

  const epicStatus = getEpicStatus();

  // Determine subtitle based on mode
  const getAttendanceSubtitle = () => {
    if (mode === 'epic') {
      return `${attendanceBreakdown.attendancePercentage.toFixed(1)}% overall attendance`;
    } else {
      return `${attendanceBreakdown.attendancePercentage.toFixed(1)}% attended this session`;
    }
  };

  const getAbsentSubtitle = () => {
    if (mode === 'epic') {
      return 'For this epic only';
    } else {
      return 'For this session only';
    }
  };

  return (
    <TooltipProvider>
      <div className='space-y-4'>
        {/* Exempted Absences Notice */}
        {hasExemptedAbsences && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 text-sm text-amber-800'>
              <Shield className='h-4 w-4 text-amber-600' />
              <span>
                <strong>
                  {attendanceBreakdown.exempted} exempted absence
                  {attendanceBreakdown.exempted !== 1 ? 's' : ''}
                </strong>{' '}
                included in attendance calculations. These count as "present"
                for analytics purposes.
              </span>
            </div>
          </div>
        )}

        <StatisticsGrid columns={5}>
          <StatisticItem
            icon={<Users className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                {mode === 'epic' ? 'Epic Attendance' : 'Session Attendance'}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      {mode === 'epic'
                        ? `Shows total attended sessions (present + late + exempted) out of all sessions in this epic. Calculated as: (${attendanceBreakdown.present} + ${attendanceBreakdown.late} + ${attendanceBreakdown.exempted}) / ${attendanceBreakdown.total} = ${attendanceBreakdown.attended}/${attendanceBreakdown.total}`
                        : `Shows attended students (present + late + exempted) out of total students for this session. Calculated as: (${attendanceBreakdown.present} + ${attendanceBreakdown.late} + ${attendanceBreakdown.exempted}) / ${students.length} = ${attendanceBreakdown.attended}/${students.length}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={`${attendanceBreakdown.attended}/${mode === 'epic' ? attendanceBreakdown.total : students.length}`}
            subtitle={getAttendanceSubtitle()}
            variant='default'
          />

          <StatisticItem
            icon={<TrendingUp className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Overall Average
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      {mode === 'epic'
                        ? `Epic attendance rate calculated as: (attended sessions / total sessions) × 100 = (${attendanceBreakdown.attended} / ${attendanceBreakdown.total}) × 100 = ${attendanceBreakdown.attendancePercentage.toFixed(1)}%`
                        : `Session attendance rate calculated as: (attended students / total students) × 100 = (${attendanceBreakdown.attended} / ${students.length}) × 100 = ${attendanceBreakdown.attendancePercentage.toFixed(1)}%`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={`${attendanceBreakdown.attendancePercentage.toFixed(1)}%`}
            subtitle={
              mode === 'epic'
                ? 'Epic attendance rate'
                : 'Session attendance rate'
            }
            variant='default'
          />

          <StatisticItem
            icon={<AlertTriangle className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Epic Status
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Performance rating based on attendance percentage:
                      <br />• ≥90%: Excellent (Green)
                      <br />• ≥75%: Good (Blue)
                      <br />• ≥60%: Fair (Yellow)
                      <br />• &lt;60%: Needs Attention (Red)
                      <br />
                      <br />
                      Current:{' '}
                      {attendanceBreakdown.attendancePercentage.toFixed(1)}% ={' '}
                      {epicStatus.text}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={epicStatus.text}
            subtitle='Overall performance'
            variant='default'
            badge={
              epicStatus.variant === 'error' ? (
                <Badge variant='destructive'>Needs Attention</Badge>
              ) : null
            }
          />

          <StatisticItem
            icon={<Crown className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Top Streak
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Longest current consecutive attendance streak across all
                      students. Counts present, late, and exempted as attended.
                      {topStreakData.value > 0 && (
                        <>
                          <br />
                          <br />
                          Current leader:{' '}
                          {topStreakData.studentNames.join(', ')} with{' '}
                          {topStreakData.value} consecutive sessions
                        </>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={topStreakData.value}
            subtitle={
              topStreakData.value > 0
                ? topStreakData.studentNames.length === 1
                  ? topStreakData.studentNames[0]
                  : `${topStreakData.studentNames.length} students tied`
                : 'No active streaks'
            }
            variant='default'
          />

          <StatisticItem
            icon={<AlertTriangle className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Uninformed Absents
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Total number of absences where no reason was provided or
                      the absence type is "uninformed".
                      {mode === 'epic'
                        ? ` Counts across all sessions in this epic.`
                        : ` Counts for this session only.`}
                      <br />
                      <br />
                      Current count: {absenceBreakdown.uninformed}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={absenceBreakdown.uninformed}
            subtitle={getAbsentSubtitle()}
            variant='default'
          />
        </StatisticsGrid>
      </div>
    </TooltipProvider>
  );
};
