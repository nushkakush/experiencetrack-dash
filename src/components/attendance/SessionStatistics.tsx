import React from 'react';
import { Users, TrendingUp, AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import type { CohortStudent, AttendanceRecord } from '@/types/attendance';
import { calculateAttendanceBreakdown, calculateAbsenceBreakdown } from '@/utils/attendanceCalculations';

interface SessionStatisticsProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  sessionNumber: number;
  isSessionCancelled?: boolean;
}

export const SessionStatistics: React.FC<SessionStatisticsProps> = ({
  students,
  attendanceRecords,
  sessionNumber,
  isSessionCancelled = false,
}) => {
  // Calculate attendance breakdown using utility function
  const attendanceBreakdown = calculateAttendanceBreakdown(attendanceRecords);
  const absenceBreakdown = calculateAbsenceBreakdown(attendanceRecords);
  
  const totalStudents = students.length;
  const markedInSession = attendanceBreakdown.total;
  const sessionAttendancePercentage = totalStudents > 0 ? (attendanceBreakdown.attended / totalStudents) * 100 : 0;

  // Determine session status
  const getSessionStatus = () => {
    if (isSessionCancelled) return { text: 'Session Cancelled', variant: 'warning' as const };
    if (totalStudents === 0) return { text: 'No Students', variant: 'default' as const };
    if (markedInSession === totalStudents) return { text: 'Complete', variant: 'success' as const };
    if (markedInSession === 0) return { text: 'Not Started', variant: 'default' as const };
    if (attendanceBreakdown.regularAbsent > totalStudents * 0.5) return { text: 'Needs Attention', variant: 'error' as const };
    return { text: 'In Progress', variant: 'info' as const };
  };

  const sessionStatus = getSessionStatus();

  return (
    <TooltipProvider>
      <StatisticsGrid columns={4}>
        <StatisticItem
          icon={<Users className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Session {sessionNumber} Attendance
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Shows attended students (present + late + exempted) out of total students for this session.
                    <br /><br />
                    Calculated as: ({attendanceBreakdown.attended}) / {totalStudents} = {attendanceBreakdown.attended}/{totalStudents}
                    <br /><br />
                    Attendance rate: {sessionAttendancePercentage.toFixed(1)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={`${attendanceBreakdown.attended}/${totalStudents}`}
          subtitle={`${sessionAttendancePercentage.toFixed(1)}% attended this session`}
          variant="default"
        />

        <StatisticItem
          icon={<AlertTriangle className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Session Status
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Current status of this session:
                    <br />• Complete: All students marked ({markedInSession}/{totalStudents})
                    <br />• In Progress: Some students marked ({markedInSession}/{totalStudents})
                    <br />• Not Started: No students marked (0/{totalStudents})
                    <br />• Needs Attention: More than 50% absent ({attendanceBreakdown.regularAbsent}/{totalStudents})
                    <br />• Session Cancelled: Session has been cancelled
                    <br /><br />
                    Current: {sessionStatus.text}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={sessionStatus.text}
          subtitle="Current session status"
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
                    Number of absences in this session where no reason was provided or the absence type is "uninformed".
                    <br /><br />
                    Current count: {absenceBreakdown.uninformed} out of {attendanceBreakdown.regularAbsent} total absences
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={absenceBreakdown.uninformed}
          subtitle="For this session only"
          variant="default"
        />

        <StatisticItem
          icon={<Bell className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Informed Absents
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Number of absences in this session where a reason was provided (absence type is "informed").
                    <br /><br />
                    Current count: {absenceBreakdown.informed} out of {attendanceBreakdown.regularAbsent} total absences
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={absenceBreakdown.informed}
          subtitle="For this session only"
          variant="default"
        />
      </StatisticsGrid>
    </TooltipProvider>
  );
};
