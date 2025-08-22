/**
 * Attendance Summary Cards Component
 * Display key attendance metrics in card format
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';

export interface AttendanceSummaryStats {
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendancePercentage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  perfectAttendanceDays: number;
  currentStreak: number;
}

interface AttendanceSummaryCardsProps {
  stats: AttendanceSummaryStats;
  timeframe: string;
  loading?: boolean;
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = React.memo(({
  stats,
  timeframe,
  loading = false,
}) => {
  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getAttendanceColor(stats.attendancePercentage)}`}>
            {stats.attendancePercentage.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-2">
            <Progress value={stats.attendancePercentage} className="flex-1 h-2 mr-2" />
            <Badge className={getAttendanceBadgeColor(stats.attendancePercentage)}>
              {stats.attendancePercentage >= 90 ? 'Excellent' : 
               stats.attendancePercentage >= 75 ? 'Good' : 'Needs Work'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.presentSessions + stats.lateSessions} of {stats.totalSessions} sessions attended
          </p>
        </CardContent>
      </Card>

      {/* Present Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Present Sessions</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.presentSessions}
          </div>
          <div className="flex items-center space-x-1 mt-2">
            {stats.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span className={`text-xs ${
              stats.trend === 'up' ? 'text-green-600' : 
              stats.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
            }`}>
              {stats.trend !== 'stable' && `${stats.trendPercentage.toFixed(1)}%`}
              {stats.trend === 'stable' && 'No change'}
            </span>
            <span className="text-xs text-muted-foreground">
              from last {timeframe}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Current streak: {stats.currentStreak} sessions
          </p>
        </CardContent>
      </Card>

      {/* Absent Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Absent Sessions</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.absentSessions}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalSessions > 0 
              ? `${((stats.absentSessions / stats.totalSessions) * 100).toFixed(1)}% of total sessions`
              : 'No sessions recorded'
            }
          </p>
          {stats.absentSessions > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Impact: -{((stats.absentSessions / stats.totalSessions) * 100).toFixed(1)}%
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Late Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          <Clock className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.lateSessions}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalSessions > 0 
              ? `${((stats.lateSessions / stats.totalSessions) * 100).toFixed(1)}% of total sessions`
              : 'No sessions recorded'
            }
          </p>
          {stats.perfectAttendanceDays > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {stats.perfectAttendanceDays} perfect days
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

AttendanceSummaryCards.displayName = 'AttendanceSummaryCards';
