import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Info, Trophy, TrendingUp, Users, Calendar } from 'lucide-react';
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
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const hasExemptedAbsences = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(record => record.student_id === studentId);
    return studentRecords.some(record => 
      record.status === 'absent' && record.absence_type === 'exempted'
    );
  };

  const getExemptedCount = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(record => record.student_id === studentId);
    return studentRecords.filter(record => 
      record.status === 'absent' && record.absence_type === 'exempted'
    ).length;
  };

  const getExemptedTooltipContent = (studentId: string) => {
    const exemptedCount = getExemptedCount(studentId);
    const studentRecords = attendanceRecords.filter(record => record.student_id === studentId);
    const exemptedRecords = studentRecords.filter(record => 
      record.status === 'absent' && record.absence_type === 'exempted'
    );

    return (
      <div className="max-w-xs">
        <p className="font-semibold mb-2">Exempted Absences</p>
        <p className="text-sm mb-2">
          This student has {exemptedCount} exempted absence{exemptedCount !== 1 ? 's' : ''}.
        </p>
        <p className="text-sm mb-2">
          <strong>Impact on Leaderboard:</strong>
        </p>
        <ul className="text-sm text-amber-200 space-y-1">
          <li>• Exempted absences count as "present" for attendance percentage</li>
          <li>• They don't break attendance streaks</li>
          <li>• They don't negatively impact rankings</li>
          <li>• They're excluded from absence statistics</li>
        </ul>
        {exemptedRecords.length > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-300">
            <p className="text-xs text-amber-200 font-semibold">Recent Exempted Absences:</p>
            {exemptedRecords.slice(0, 2).map((record, index) => (
              <p key={index} className="text-xs text-amber-200">
                • {new Date(record.session_date).toLocaleDateString()}: {record.reason || 'No reason provided'}
              </p>
            ))}
            {exemptedRecords.length > 2 && (
              <p className="text-xs text-amber-200">... and {exemptedRecords.length - 2} more</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {studentStats.map((stat) => {
        const isExempted = hasExemptedAbsences(stat.student.id);
        const exemptedCount = getExemptedCount(stat.student.id);
        const breakdown = StatisticsCalculator.getSessionBreakdown(stat.student.id, attendanceRecords);

        return (
          <Card key={stat.student.id} className="relative">
            {stat.rank <= 3 && (
              <div className="absolute -top-2 -right-2">
                {getRankIcon(stat.rank)}
              </div>
            )}
            
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <span className="font-bold">#{stat.rank}</span>
                  <span>{stat.student.first_name} {stat.student.last_name}</span>
                  {isExempted && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100">
                            <Shield className="h-3 w-3 mr-1" />
                            {exemptedCount}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {getExemptedTooltipContent(stat.student.id)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardTitle>
              {!hideFields.includes('email') && (
                <p className="text-sm text-muted-foreground">{stat.student.email}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance</span>
                <div className="flex items-center gap-1">
                  <span className={`text-lg font-bold ${getAttendanceColor(stat.attendancePercentage)}`}>
                    {stat.attendancePercentage.toFixed(1)}%
                  </span>
                  {isExempted && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-amber-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            Includes {exemptedCount} exempted absence{exemptedCount !== 1 ? 's' : ''} as attended
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Streak</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-semibold">{stat.currentStreak}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sessions</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold">{stat.presentSessions}/{stat.totalSessions}</span>
                  </div>
                </div>
              </div>

              {!hideFields.includes('late') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Late</span>
                  <span className="font-semibold text-yellow-600">{breakdown.late}</span>
                </div>
              )}

              {!hideFields.includes('absent') && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Absent</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-red-600">{breakdown.absent}</span>
                    {breakdown.exempted > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                              +{breakdown.exempted} exempted
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {breakdown.exempted} exempted absence{breakdown.exempted !== 1 ? 's' : ''} not included in absence count
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
