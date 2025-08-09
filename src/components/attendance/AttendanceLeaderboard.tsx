import React from 'react';
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CohortStudent, AttendanceRecord, CohortEpic } from '@/types/attendance';

interface AttendanceLeaderboardProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[]; // All records for the current epic
  currentEpic: CohortEpic | null;
  layout?: 'table' | 'grid'; // Add layout option
  hideFields?: ('email' | 'late' | 'absent')[]; // Fields to hide in public view
}

interface StudentStats {
  student: CohortStudent;
  attendancePercentage: number;
  absentDays: number;
  currentStreak: number;
  totalSessions: number;
  presentSessions: number;
  rank: number;
}

export const AttendanceLeaderboard: React.FC<AttendanceLeaderboardProps> = ({
  students,
  attendanceRecords,
  currentEpic,
  layout = 'table',
  hideFields = [],
}) => {
  // Calculate statistics for each student
  const calculateStudentStats = (): StudentStats[] => {
    const studentStats: StudentStats[] = students.map(student => {
      // Get all attendance records for this student in current epic
      const studentRecords = attendanceRecords.filter(record => record.student_id === student.id);
      
      // Calculate basic stats
      const totalSessions = studentRecords.length;
      const presentSessions = studentRecords.filter(record => record.status === 'present').length;
      const lateSessions = studentRecords.filter(record => record.status === 'late').length;
      const absentSessions = studentRecords.filter(record => record.status === 'absent').length;
      const attendedSessions = presentSessions + lateSessions; // Both present and late count as attended
      const attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      // Debug logging
      console.log(`Student: ${student.first_name} ${student.last_name}`, {
        totalSessions,
        presentSessions,
        lateSessions,
        absentSessions,
        attendedSessions,
        attendancePercentage: attendancePercentage.toFixed(1) + '%',
        records: studentRecords.map(r => ({ date: r.session_date, status: r.status }))
      });
      
      // Calculate current streak (consecutive days of attendance)
      const sortedRecords = studentRecords
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
      
      let currentStreak = 0;
      for (const record of sortedRecords) {
        if (record.status === 'present' || record.status === 'late') {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        student,
        attendancePercentage,
        absentDays: absentSessions, // Use the calculated count, not the filtered count
        currentStreak,
        totalSessions,
        presentSessions: attendedSessions, // This should represent attended sessions (present + late)
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by attendance percentage (descending), then by streak (descending)
    studentStats.sort((a, b) => {
      if (b.attendancePercentage !== a.attendancePercentage) {
        return b.attendancePercentage - a.attendancePercentage;
      }
      return b.currentStreak - a.currentStreak;
    });

    // Assign ranks
    studentStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    return studentStats;
  };

  const studentStats = calculateStudentStats();

  // Grid Layout Component for compact display
  const GridLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {studentStats.map((stat) => {
        const records = attendanceRecords.filter(r => r.student_id === stat.student.id);
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;

        return (
          <div
            key={stat.student.id}
            className={`px-4 py-3 rounded-lg border transition-all ${
              stat.rank <= 3 
                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm' 
                : 'bg-white border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Left: Rank and Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getRankBadge(stat.rank)}
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm truncate">
                    {stat.student.first_name} {stat.student.last_name}
                  </span>
                  {!hideFields.includes('email') && (
                    <div className="text-xs text-gray-500 truncate">
                      {stat.student.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center gap-4">
                {/* Attendance Percentage */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${getAttendanceColor(stat.attendancePercentage)}`}>
                    {stat.attendancePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">attendance</div>
                </div>

                {/* Present Count */}
                <div className="text-center">
                  <div className="font-medium text-green-600">{present}</div>
                  <div className="text-xs text-gray-500">Present</div>
                </div>

                {/* Late Count - conditionally shown */}
                {!hideFields.includes('late') && (
                  <div className="text-center">
                    <div className="font-medium text-yellow-600">{late}</div>
                    <div className="text-xs text-gray-500">Late</div>
                  </div>
                )}

                {/* Absent Count - conditionally shown */}
                {!hideFields.includes('absent') && (
                  <div className="text-center">
                    <div className="font-medium text-red-600">{absent}</div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                )}

                {/* Streak */}
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    {getStreakBadge(stat.currentStreak)}
                  </div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Table Layout Component (existing)
  const TableLayout = () => (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead className="text-center">Attendance %</TableHead>
            <TableHead className="text-center">Attended/Total</TableHead>
            <TableHead className="text-center">Absent Days</TableHead>
            <TableHead className="text-center">Current Streak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentStats.map((stat) => (
            <TableRow key={stat.student.id} className={stat.rank <= 3 ? 'bg-gray-50' : ''}>
              <TableCell>
                {getRankBadge(stat.rank)}
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div>{stat.student.first_name} {stat.student.last_name}</div>
                  <div className="text-sm text-muted-foreground">{stat.student.email}</div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className={getAttendanceColor(stat.attendancePercentage)}>
                  {stat.attendancePercentage.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="font-medium">
                  {stat.presentSessions}/{stat.totalSessions}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const records = attendanceRecords.filter(r => r.student_id === stat.student.id);
                    const present = records.filter(r => r.status === 'present').length;
                    const late = records.filter(r => r.status === 'late').length;
                    const absent = records.filter(r => r.status === 'absent').length;
                    return `P:${present} L:${late} A:${absent}`;
                  })()}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className={stat.absentDays > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                  {stat.absentDays}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {getStreakBadge(stat.currentStreak)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
          <Trophy className="h-3 w-3 mr-1" />
          #1
        </Badge>
      );
    } else if (rank === 2) {
      return (
        <Badge className="bg-gray-400 text-white hover:bg-gray-500">
          <Award className="h-3 w-3 mr-1" />
          #2
        </Badge>
      );
    } else if (rank === 3) {
      return (
        <Badge className="bg-amber-600 text-white hover:bg-amber-700">
          <Award className="h-3 w-3 mr-1" />
          #3
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          #{rank}
        </Badge>
      );
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return 'text-green-600 font-semibold';
    if (percentage >= 85) return 'text-blue-600 font-semibold';
    if (percentage >= 75) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 10) {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else if (streak >= 5) {
      return (
        <Badge className="bg-blue-500 text-white hover:bg-blue-600">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else if (streak > 0) {
      return (
        <Badge variant="secondary">
          <TrendingUp className="h-3 w-3 mr-1" />
          {streak}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <TrendingUp className="h-3 w-3 mr-1" />
          0
        </Badge>
      );
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
        <p className="text-gray-600">Add students to the cohort to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Epic Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Showing performance for: {currentEpic?.name || 'Current Epic'}</span>
      </div>

      {/* Render based on layout preference */}
      {layout === 'grid' ? <GridLayout /> : <TableLayout />}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded"></div>
          <span>≥95% Excellent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded"></div>
          <span>≥85% Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded"></div>
          <span>≥75% Fair</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded"></div>
          <span>&lt;75% Needs Improvement</span>
        </div>
      </div>
    </div>
  );
};
