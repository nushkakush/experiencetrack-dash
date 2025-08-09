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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {studentStats.map((stat) => {
        const sessionBreakdown = StatisticsCalculator.getSessionBreakdown(
          stat.student.id,
          attendanceRecords
        );

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
                {RankingUtils.getRankBadge(stat.rank)}
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
                  <div className={`text-lg font-bold ${StatisticsCalculator.getAttendanceColor(stat.attendancePercentage)}`}>
                    {stat.attendancePercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">attendance</div>
                </div>

                {/* Present Count */}
                <div className="text-center">
                  <div className="font-medium text-green-600">{sessionBreakdown.present}</div>
                  <div className="text-xs text-gray-500">Present</div>
                </div>

                {/* Late Count - conditionally shown */}
                {!hideFields.includes('late') && (
                  <div className="text-center">
                    <div className="font-medium text-yellow-600">{sessionBreakdown.late}</div>
                    <div className="text-xs text-gray-500">Late</div>
                  </div>
                )}

                {/* Absent Count - conditionally shown */}
                {!hideFields.includes('absent') && (
                  <div className="text-center">
                    <div className="font-medium text-red-600">{sessionBreakdown.absent}</div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                )}

                {/* Streak */}
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    {RankingUtils.getStreakBadge(stat.currentStreak)}
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
};
