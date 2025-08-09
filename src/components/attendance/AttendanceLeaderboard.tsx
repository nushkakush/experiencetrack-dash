import React from 'react';
import { Trophy, Calendar } from 'lucide-react';
import { useLeaderboardCalculations } from './leaderboard/hooks/useLeaderboardCalculations';
import { GridLayout } from './leaderboard/layouts/GridLayout';
import { TableLayout } from './leaderboard/layouts/TableLayout';
import type { CohortStudent, AttendanceRecord, CohortEpic } from '@/types/attendance';

interface AttendanceLeaderboardProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  currentEpic: CohortEpic | null;
  layout?: 'table' | 'grid';
  hideFields?: ('email' | 'late' | 'absent')[];
}

export const AttendanceLeaderboard: React.FC<AttendanceLeaderboardProps> = ({
  students,
  attendanceRecords,
  currentEpic,
  layout = 'table',
  hideFields = [],
}) => {
  const { studentStats } = useLeaderboardCalculations(students, attendanceRecords);

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
      {layout === 'grid' ? (
        <GridLayout
          studentStats={studentStats}
          attendanceRecords={attendanceRecords}
          hideFields={hideFields}
        />
      ) : (
        <TableLayout
          studentStats={studentStats}
          attendanceRecords={attendanceRecords}
          hideFields={hideFields}
        />
      )}

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
