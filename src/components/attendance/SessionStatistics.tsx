import React from 'react';
import { Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import type { CohortStudent, AttendanceRecord } from '@/types/attendance';

interface SessionStatisticsProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[]; // Session-specific records
  sessionNumber: number;
  isSessionCancelled?: boolean;
}

export const SessionStatistics: React.FC<SessionStatisticsProps> = ({
  students,
  attendanceRecords,
  sessionNumber,
  isSessionCancelled = false,
}) => {
  // Calculate session-specific attendance
  const totalStudents = students.length;
  const presentInSession = attendanceRecords.filter(record => record.status === 'present').length;
  const absentInSession = attendanceRecords.filter(record => record.status === 'absent').length;
  const lateInSession = attendanceRecords.filter(record => record.status === 'late').length;
  const markedInSession = presentInSession + absentInSession + lateInSession;
  
  const sessionAttendancePercentage = totalStudents > 0 ? ((presentInSession + lateInSession) / totalStudents) * 100 : 0;

  // Calculate session-specific absences
  const uninformedAbsentsInSession = attendanceRecords.filter(
    record => record.status === 'absent' && record.absence_type === 'uninformed'
  ).length;
  
  const informedAbsentsInSession = attendanceRecords.filter(
    record => record.status === 'absent' && (record.absence_type === 'informed' || record.absence_type === 'exempted')
  ).length;

  // Determine session status
  const getSessionStatus = () => {
    if (isSessionCancelled) return { text: 'Session Cancelled', variant: 'warning' as const };
    if (totalStudents === 0) return { text: 'No Students', variant: 'default' as const };
    if (markedInSession === totalStudents) return { text: 'Complete', variant: 'success' as const };
    if (markedInSession === 0) return { text: 'Not Started', variant: 'default' as const };
    if (absentInSession > totalStudents * 0.5) return { text: 'Needs Attention', variant: 'error' as const };
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
                    Shows attended students (present + late) out of total students for this session.
                    <br /><br />
                    Calculated as: ({presentInSession} + {lateInSession}) / {totalStudents} = {presentInSession + lateInSession}/{totalStudents}
                    <br /><br />
                    Attendance rate: {sessionAttendancePercentage.toFixed(1)}%
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={`${presentInSession + lateInSession}/${totalStudents}`}
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
                    <br />• Needs Attention: More than 50% absent ({absentInSession}/{totalStudents})
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
                    Current count: {uninformedAbsentsInSession} out of {absentInSession} total absences
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={uninformedAbsentsInSession}
          subtitle="For this session only"
          variant="default"
        />

        <StatisticItem
          icon={<CheckCircle className="h-5 w-5" />}
          title={
            <div className="flex items-center gap-2">
              Informed Absents
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Number of absences in this session where a reason was provided (absence type is "informed" or "exempted").
                    <br /><br />
                    Current count: {informedAbsentsInSession} out of {absentInSession} total absences
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          }
          value={informedAbsentsInSession}
          subtitle="For this session only"
          variant="default"
        />
      </StatisticsGrid>
    </TooltipProvider>
  );
};
