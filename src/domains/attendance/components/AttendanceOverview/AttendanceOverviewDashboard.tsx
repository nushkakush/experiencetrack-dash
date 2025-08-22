/**
 * Refactored Attendance Overview Dashboard
 * Main dashboard container using modular components
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Award,
  Filter,
  RefreshCw
} from 'lucide-react';
import { AttendanceSummaryCards } from './AttendanceSummaryCards';
import { AttendanceChart } from './AttendanceChart';
import { AttendanceCalendar } from './AttendanceCalendar';
import { AttendanceFilters } from './AttendanceFilters';
import { useAttendanceOverview } from './useAttendanceOverview';

interface Student {
  id: string;
  name: string;
  email?: string;
  cohort_id: string;
}

interface AttendanceOverviewDashboardProps {
  student: Student;
  timeframe?: 'week' | 'month' | 'semester' | 'all';
  showFilters?: boolean;
}

export const AttendanceOverviewDashboard: React.FC<AttendanceOverviewDashboardProps> = React.memo(({
  student,
  timeframe = 'month',
  showFilters = true,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    epicId: '',
    sessionType: 'all',
    status: 'all',
  });

  const {
    attendanceData,
    summaryStats,
    chartData,
    calendarData,
    isLoading,
    error,
    refetch,
  } = useAttendanceOverview({
    studentId: student.id,
    cohortId: student.cohort_id,
    timeframe: selectedTimeframe,
    filters,
  });

  const handleTimeframeChange = (newTimeframe: typeof selectedTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-600 mb-4">Failed to load attendance data</div>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Attendance Overview
          </h2>
          <p className="text-muted-foreground">
            Track your attendance across all sessions and epics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['week', 'month', 'semester', 'all'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedTimeframe === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTimeframeChange(period)}
                className="capitalize"
              >
                {period === 'all' ? 'All Time' : period}
              </Button>
            ))}
          </div>

          {/* Filters Toggle */}
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <AttendanceFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          studentId={student.id}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading attendance data...</span>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && summaryStats && (
        <>
          {/* Summary Cards */}
          <AttendanceSummaryCards
            stats={summaryStats}
            timeframe={selectedTimeframe}
          />

          {/* Charts and Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend Chart */}
            <AttendanceChart
              data={chartData}
              timeframe={selectedTimeframe}
              loading={isLoading}
            />

            {/* Attendance Calendar */}
            <AttendanceCalendar
              data={calendarData}
              timeframe={selectedTimeframe}
              loading={isLoading}
            />
          </div>

          {/* Detailed Attendance Table */}
          {attendanceData && attendanceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Sessions
                  <Badge variant="secondary">{attendanceData.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Epic</th>
                        <th className="text-left p-2">Session</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData.slice(0, 10).map((record, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            {new Date(record.sessionDate).toLocaleDateString()}
                          </td>
                          <td className="p-2">{record.epicName}</td>
                          <td className="p-2">Session {record.sessionNumber}</td>
                          <td className="p-2">
                            <Badge
                              variant={
                                record.status === 'present' 
                                  ? 'default' 
                                  : record.status === 'late' 
                                    ? 'secondary' 
                                    : 'destructive'
                              }
                            >
                              {record.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {record.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {attendanceData.length > 10 && (
                  <div className="text-center mt-4">
                    <Button variant="outline" size="sm">
                      View All Sessions ({attendanceData.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Insights */}
          {summaryStats.attendancePercentage >= 90 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Excellent Attendance!</h3>
                    <p className="text-sm text-green-700">
                      You're maintaining {summaryStats.attendancePercentage.toFixed(1)}% attendance. Keep it up!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvement Suggestions */}
          {summaryStats.attendancePercentage < 75 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Attendance Needs Improvement</h3>
                    <p className="text-sm text-orange-700">
                      Your current attendance is {summaryStats.attendancePercentage.toFixed(1)}%. 
                      Consider setting reminders for upcoming sessions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && (!attendanceData || attendanceData.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Attendance Data</h3>
            <p className="text-muted-foreground">
              No attendance records found for the selected timeframe.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

AttendanceOverviewDashboard.displayName = 'AttendanceOverviewDashboard';
