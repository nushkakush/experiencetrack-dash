import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  Info,
  Trophy,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StatisticsCalculator } from '../utils/statisticsCalculator';
import type { StudentStats } from '../utils/statisticsCalculator';
import type { AttendanceRecord } from '@/types/attendance';

interface GridLayoutProps {
  studentStats: StudentStats[];
  attendanceRecords: AttendanceRecord[];
  hideFields?: ('email' | 'late' | 'absent')[];
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  studentStats,
  attendanceRecords,
  hideFields = [],
}) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600';
    if (percentage >= 85) return 'text-blue-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className='h-4 w-4 text-yellow-500' />;
    if (rank === 2) return <Trophy className='h-4 w-4 text-gray-400' />;
    if (rank === 3) return <Trophy className='h-4 w-4 text-amber-600' />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
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
            {exemptedRecords.slice(0, 2).map((record, index) => (
              <p key={index} className='text-xs text-amber-200'>
                • {new Date(record.session_date).toLocaleDateString()}:{' '}
                {record.reason || 'No reason provided'}
              </p>
            ))}
            {exemptedRecords.length > 2 && (
              <p className='text-xs text-amber-200'>
                ... and {exemptedRecords.length - 2} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const topThree = studentStats.slice(0, 3);
  const rest = studentStats.slice(3);

  return (
    <div className='space-y-4'>
      {/* Top 3 - Compact Row */}
      {topThree.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {topThree.map((stat, index) => {
            const isExempted = hasExemptedAbsences(stat.student.id);
            const exemptedCount = getExemptedCount(stat.student.id);
            const breakdown = StatisticsCalculator.getSessionBreakdown(
              stat.student.id,
              attendanceRecords
            );

            return (
              <Card
                key={stat.student.id}
                className={`relative hover:shadow-md transition-shadow ${
                  stat.rank === 1
                    ? 'ring-2 ring-yellow-500'
                    : stat.rank === 2
                      ? 'ring-2 ring-gray-400'
                      : 'ring-2 ring-amber-600'
                }`}
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    {/* Left side - Rank and Avatar */}
                    <div className='flex items-center gap-3'>
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadge(stat.rank)}`}
                      >
                        #{stat.rank}
                      </div>
                      <UserAvatar
                        avatarUrl={null}
                        name={`${stat.student.first_name} ${stat.student.last_name}`}
                        size='md'
                        userId={stat.student.user_id}
                      />
                      <div>
                        <h4 className='font-semibold'>
                          {stat.student.first_name} {stat.student.last_name}
                        </h4>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <span
                            className={`font-bold ${getAttendanceColor(stat.attendancePercentage)}`}
                          >
                            {stat.attendancePercentage.toFixed(1)}%
                          </span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <TrendingUp className='h-3 w-3 text-green-500' />
                            {stat.currentStreak}
                          </span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Users className='h-3 w-3 text-blue-500' />
                            {stat.presentSessions}/{stat.totalSessions}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Trophy and Exempted badge */}
                    <div className='flex items-center gap-2'>
                      {getRankIcon(stat.rank)}
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
                            <TooltipContent>
                              {getExemptedTooltipContent(stat.student.id)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Rest of the leaderboard - 2 per row */}
      {rest.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {rest.map(stat => {
            const isExempted = hasExemptedAbsences(stat.student.id);
            const exemptedCount = getExemptedCount(stat.student.id);
            const breakdown = StatisticsCalculator.getSessionBreakdown(
              stat.student.id,
              attendanceRecords
            );

            return (
              <Card
                key={stat.student.id}
                className='relative hover:shadow-md transition-shadow'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    {/* Left side - Rank and Avatar */}
                    <div className='flex items-center gap-3'>
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankBadge(stat.rank)}`}
                      >
                        #{stat.rank}
                      </div>
                      <UserAvatar
                        avatarUrl={null}
                        name={`${stat.student.first_name} ${stat.student.last_name}`}
                        size='md'
                        userId={stat.student.user_id}
                      />
                      <div>
                        <h4 className='font-semibold'>
                          {stat.student.first_name} {stat.student.last_name}
                        </h4>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                          <span
                            className={`font-bold ${getAttendanceColor(stat.attendancePercentage)}`}
                          >
                            {stat.attendancePercentage.toFixed(1)}%
                          </span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <TrendingUp className='h-3 w-3 text-green-500' />
                            {stat.currentStreak}
                          </span>
                          <span>•</span>
                          <span className='flex items-center gap-1'>
                            <Users className='h-3 w-3 text-blue-500' />
                            {stat.presentSessions}/{stat.totalSessions}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Exempted badge if any */}
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
                          <TooltipContent>
                            {getExemptedTooltipContent(stat.student.id)}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
