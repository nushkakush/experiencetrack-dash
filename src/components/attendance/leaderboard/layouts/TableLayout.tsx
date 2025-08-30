import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, Info, Trophy, TrendingUp } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import type { AttendanceRecord } from '@/types/attendance';

interface StudentStats {
  student: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  attendancePercentage: number;
  currentStreak: number;
  totalSessions: number;
  presentSessions: number;
  rank: number;
}

interface TableLayoutProps {
  studentStats: StudentStats[];
  attendanceRecords: AttendanceRecord[];
  hideFields?: ('email' | 'late' | 'absent')[];
}

export const TableLayout: React.FC<TableLayoutProps> = ({
  studentStats,
  attendanceRecords,
  hideFields = [],
}) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 font-semibold';
    if (percentage >= 85) return 'text-blue-600 font-semibold';
    if (percentage >= 75) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className='h-4 w-4 text-yellow-500' />;
    if (rank === 2) return <Trophy className='h-4 w-4 text-gray-400' />;
    if (rank === 3) return <Trophy className='h-4 w-4 text-amber-600' />;
    return null;
  };

  const hasExemptedAbsences = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      record => record.student_id === studentId
    );
    return studentRecords.some(
      record => record.status === 'absent' && record.absence_type === 'exempted'
    );
  };

  const getExemptedCount = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      record => record.student_id === studentId
    );
    return studentRecords.filter(
      record => record.status === 'absent' && record.absence_type === 'exempted'
    ).length;
  };

  const getExemptedTooltipContent = (studentId: string) => {
    const exemptedCount = getExemptedCount(studentId);
    const studentRecords = attendanceRecords.filter(
      record => record.student_id === studentId
    );
    const exemptedRecords = studentRecords.filter(
      record => record.status === 'absent' && record.absence_type === 'exempted'
    );

    return (
      <div className='max-w-xs'>
        <p className='font-semibold mb-2'>Exempted Absences</p>
        <p className='text-sm mb-2'>
          This student has {exemptedCount} exempted absence
          {exemptedCount !== 1 ? 's' : ''}.
        </p>
        <p className='text-sm mb-2'>
          <strong>Impact on Leaderboard:</strong>
        </p>
        <ul className='text-sm text-amber-200 space-y-1'>
          <li>
            • Exempted absences count as "present" for attendance percentage
          </li>
          <li>• They don't break attendance streaks</li>
          <li>• They don't negatively impact rankings</li>
          <li>• They're excluded from absence statistics</li>
        </ul>
        {exemptedRecords.length > 0 && (
          <div className='mt-2 pt-2 border-t border-amber-300'>
            <p className='text-xs text-amber-200 font-semibold'>
              Recent Exempted Absences:
            </p>
            {exemptedRecords.slice(0, 3).map((record, index) => (
              <p key={index} className='text-xs text-amber-200'>
                • {new Date(record.session_date).toLocaleDateString()}:{' '}
                {record.reason || 'No reason provided'}
              </p>
            ))}
            {exemptedRecords.length > 3 && (
              <p className='text-xs text-amber-200'>
                ... and {exemptedRecords.length - 3} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-16'>Rank</TableHead>
            <TableHead>Student</TableHead>
            {!hideFields.includes('email') && <TableHead>Email</TableHead>}
            <TableHead className='text-center'>Attendance %</TableHead>
            <TableHead className='text-center'>Streak</TableHead>
            {!hideFields.includes('late') && (
              <TableHead className='text-center'>Late</TableHead>
            )}
            {!hideFields.includes('absent') && (
              <TableHead className='text-center'>Absent</TableHead>
            )}
            <TableHead className='text-center'>Total Sessions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentStats.map(stat => {
            const isExempted = hasExemptedAbsences(stat.student.id);
            const exemptedCount = getExemptedCount(stat.student.id);

            // Calculate breakdown locally from attendance records
            const studentRecords = attendanceRecords.filter(
              record => record.student_id === stat.student.id
            );
            const breakdown = {
              present: studentRecords.filter(r => r.status === 'present')
                .length,
              late: studentRecords.filter(r => r.status === 'late').length,
              absent: studentRecords.filter(
                r => r.status === 'absent' && r.absence_type !== 'exempted'
              ).length,
              exempted: studentRecords.filter(
                r => r.status === 'absent' && r.absence_type === 'exempted'
              ).length,
            };

            return (
              <TableRow key={stat.student.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    {getRankIcon(stat.rank)}
                    <span>{stat.rank}</span>
                  </div>
                </TableCell>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-3'>
                    <UserAvatar
                      avatarUrl={null}
                      name={`${stat.student.first_name} ${stat.student.last_name}`}
                      size='sm'
                      userId={stat.student.user_id}
                    />
                    <div className='flex items-center gap-2'>
                      {stat.student.first_name} {stat.student.last_name}
                      {isExempted && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant='outline'
                                className='bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                              >
                                <Shield className='h-3 w-3 mr-1' />
                                {exemptedCount}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side='right'>
                              {getExemptedTooltipContent(stat.student.id)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </TableCell>
                {!hideFields.includes('email') && (
                  <TableCell className='text-muted-foreground'>
                    {stat.student.email}
                  </TableCell>
                )}
                <TableCell className='text-center'>
                  <span
                    className={getAttendanceColor(stat.attendancePercentage)}
                  >
                    {stat.attendancePercentage.toFixed(1)}%
                  </span>
                  {isExempted && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='h-3 w-3 inline ml-1 text-amber-500 cursor-help' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='text-xs'>
                            Includes {exemptedCount} exempted absence
                            {exemptedCount !== 1 ? 's' : ''} as attended
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className='text-center'>
                  <div className='flex items-center justify-center gap-1'>
                    <TrendingUp className='h-3 w-3 text-green-500' />
                    {stat.currentStreak}
                  </div>
                </TableCell>
                {!hideFields.includes('late') && (
                  <TableCell className='text-center'>
                    {breakdown.late}
                  </TableCell>
                )}
                {!hideFields.includes('absent') && (
                  <TableCell className='text-center'>
                    <div className='flex items-center justify-center gap-1'>
                      {breakdown.absent}
                      {breakdown.exempted > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant='outline'
                                className='text-xs bg-amber-50 text-amber-700 border-amber-300'
                              >
                                +{breakdown.exempted} exempted
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='text-xs'>
                                {breakdown.exempted} exempted absence
                                {breakdown.exempted !== 1 ? 's' : ''} not
                                included in absence count
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell className='text-center'>
                  {stat.totalSessions}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
