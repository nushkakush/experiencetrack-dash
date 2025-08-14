import React from 'react';
import { StatisticsCalculator } from '../utils/statisticsCalculator';
import { RankingUtils } from '../utils/rankingUtils';
import type { StudentStats } from '../utils/statisticsCalculator';
import type { AttendanceRecord } from '@/types/attendance';

interface GridLayoutProps {
  studentStats: StudentStats[];
  attendanceRecords: AttendanceRecord[];
  hideFields: ('email' | 'late' | 'absent')[];
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  studentStats,
  attendanceRecords,
  hideFields,
}) => {
  const top3Students = studentStats.filter(stat => stat.rank <= 3);
  const restStudents = studentStats.filter(stat => stat.rank > 3);

  const renderStudentCard = (stat: StudentStats, isTop3: boolean = false) => {
    const sessionBreakdown = StatisticsCalculator.getSessionBreakdown(
      stat.student.id,
      attendanceRecords
    );

    return (
      <div
        key={stat.student.id}
        className={`px-4 py-3 rounded-lg border transition-all ${
          stat.rank <= 3 
            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-700/50 dark:text-white shadow-sm' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-sm dark:hover:shadow-gray-900/20'
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Left: Rank and Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {RankingUtils.getRankBadge(stat.rank)}
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-sm truncate dark:text-white">
                {stat.student.first_name} {stat.student.last_name}
              </span>
              {!hideFields.includes('email') && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {stat.student.email}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center gap-4">
            {/* Attendance Percentage */}
            <div className="text-right">
              <div className={`text-lg font-bold ${StatisticsCalculator.getAttendanceColor(stat.attendancePercentage)}`}>
                {stat.attendancePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">attendance</div>
            </div>

            {/* Present Count */}
            <div className="text-center">
              <div className="font-medium text-green-600 dark:text-green-400">{sessionBreakdown.present}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Present</div>
            </div>

            {/* Late Count - conditionally shown */}
            {!hideFields.includes('late') && (
              <div className="text-center">
                <div className="font-medium text-yellow-600 dark:text-yellow-400">{sessionBreakdown.late}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Late</div>
              </div>
            )}

            {/* Absent Count - conditionally shown */}
            {!hideFields.includes('absent') && (
              <div className="text-center">
                <div className="font-medium text-red-600 dark:text-red-400">{sessionBreakdown.absent}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Absent</div>
              </div>
            )}

            {/* Streak */}
            <div className="text-center">
              <div className="flex items-center justify-center">
                {RankingUtils.getStreakBadge(stat.currentStreak)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Streak</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top 3 Students - Single Row */}
      {top3Students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3Students.map((stat) => renderStudentCard(stat, true))}
        </div>
      )}

      {/* Rest of the Students - 2 Column Grid */}
      {restStudents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {restStudents.map((stat) => renderStudentCard(stat))}
        </div>
      )}
    </div>
  );
};
