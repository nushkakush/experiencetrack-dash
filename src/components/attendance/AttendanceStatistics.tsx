import React from 'react';
import { Users, TrendingUp, AlertTriangle, Bell, CheckCircle, Crown, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import type { CohortStudent, AttendanceRecord, CohortEpic } from '@/types/attendance';

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
  const recordsToUse = mode === 'epic' ? epicAttendanceRecords || [] : attendanceRecords;
  
  // For epic mode, use all epic records (no date filtering needed)
  const epicRecords = mode === 'epic' ? recordsToUse : attendanceRecords;

  // Calculate attendance based on the mode
  const totalStudents = students.length;
  const presentInEpic = epicRecords.filter(record => record.status === 'present').length;
  const absentInEpic = epicRecords.filter(record => record.status === 'absent').length;
  const lateInEpic = epicRecords.filter(record => record.status === 'late').length;
  const totalSessionsInEpic = epicRecords.length;
  
  const epicAttendancePercentage = totalSessionsInEpic > 0 ? ((presentInEpic + lateInEpic) / totalSessionsInEpic) * 100 : 0;

  // Calculate absences for epic
  const uninformedAbsentsInEpic = epicRecords.filter(
    record => record.status === 'absent' && record.absence_type === 'uninformed'
  ).length;
  
  const informedAbsentsInEpic = epicRecords.filter(
    record => record.status === 'absent' && (record.absence_type === 'informed' || record.absence_type === 'exempted')
  ).length;

  // Calculate top streak across all students (always use epic records for streaks)
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

  // Determine attendance status for epic
  const getEpicStatus = () => {
    if (totalStudents === 0) return { text: 'No Students', variant: 'default' as const };
    if (totalSessionsInEpic === 0) return { text: 'No Sessions', variant: 'default' as const };
    if (epicAttendancePercentage >= 90) return { text: 'Excellent', variant: 'success' as const };
    if (epicAttendancePercentage >= 75) return { text: 'Good', variant: 'info' as const };
    if (epicAttendancePercentage >= 60) return { text: 'Fair', variant: 'warning' as const };
    return { text: 'Needs Attention', variant: 'error' as const };
  };

  const epicStatus = getEpicStatus();

  // Determine subtitle based on mode
  const getAttendanceSubtitle = () => {
    if (mode === 'epic') {
      return `${epicAttendancePercentage.toFixed(1)}% overall attendance`;
    } else {
      return `${epicAttendancePercentage.toFixed(1)}% attended this session`;
    }
  };

  const getAbsentSubtitle = () => {
    if (mode === 'epic') {
      return "For this epic only";
    } else {
      return "For this session only";
    }
  };

  return (
    <TooltipProvider>
      <StatisticsGrid columns={5}>
        <StatisticItem
          icon={<Users className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              {mode === 'epic' ? "Epic Attendance" : "Session Attendance"}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {mode === 'epic' 
                      ? `Shows total attended sessions (present + late) out of all sessions in this epic. Calculated as: (${presentInEpic} + ${lateInEpic}) / ${totalSessionsInEpic} = ${presentInEpic + lateInEpic}/${totalSessionsInEpic}`
                      : `Shows attended students (present + late) out of total students for this session. Calculated as: (${presentInEpic} + ${lateInEpic}) / ${totalStudents} = ${presentInEpic + lateInEpic}/${totalStudents}`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={`${presentInEpic + lateInEpic}/${mode === 'epic' ? totalSessionsInEpic : totalStudents}`}
          subtitle={getAttendanceSubtitle()}
          variant="default"
        />

        <StatisticItem
          icon={<TrendingUp className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Overall Average
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    {mode === 'epic'
                      ? `Epic attendance rate calculated as: (attended sessions / total sessions) × 100 = (${presentInEpic + lateInEpic} / ${totalSessionsInEpic}) × 100 = ${epicAttendancePercentage.toFixed(1)}%`
                      : `Session attendance rate calculated as: (attended students / total students) × 100 = (${presentInEpic + lateInEpic} / ${totalStudents}) × 100 = ${epicAttendancePercentage.toFixed(1)}%`
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={`${epicAttendancePercentage.toFixed(1)}%`}
          subtitle={mode === 'epic' ? "Epic attendance rate" : "Session attendance rate"}
          variant="default"
        />

        <StatisticItem
          icon={<AlertTriangle className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Epic Status
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Performance rating based on attendance percentage:
                    <br />• ≥90%: Excellent (Green)
                    <br />• ≥75%: Good (Blue)
                    <br />• ≥60%: Fair (Yellow)
                    <br />• &lt;60%: Needs Attention (Red)
                    <br /><br />
                    Current: {epicAttendancePercentage.toFixed(1)}% = {epicStatus.text}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={epicStatus.text}
          subtitle="Overall performance"
          variant="default"
          badge={
            epicStatus.variant === 'error' ? (
              <Badge variant="destructive">Needs Attention</Badge>
            ) : null
          }
        />

        <StatisticItem
          icon={<Crown className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Top Streak
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Longest current consecutive attendance streak across all students. 
                    Counts both present and late as attended. 
                    {topStreakData.value > 0 && (
                      <>
                        <br /><br />
                        Current leader: {topStreakData.studentName} with {topStreakData.value} consecutive sessions
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={topStreakData.value}
          subtitle={topStreakData.value > 0 ? topStreakData.studentName : 'No active streaks'}
          variant="default"
        />

        <StatisticItem
          icon={<AlertTriangle className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Uninformed Absents
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Total number of absences where no reason was provided or the absence type is "uninformed". 
                    {mode === 'epic' 
                      ? ` Counts across all sessions in this epic.`
                      : ` Counts for this session only.`
                    }
                    <br /><br />
                    Current count: {uninformedAbsentsInEpic}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={uninformedAbsentsInEpic}
          subtitle={getAbsentSubtitle()}
          variant="default"
        />
      </StatisticsGrid>
    </TooltipProvider>
  );
};
