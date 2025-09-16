import React from 'react';
import { Trophy, Calendar, Shield, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GridLayout } from './leaderboard/layouts/GridLayout';
import { TableLayout } from './leaderboard/layouts/TableLayout';
import type {
  CohortStudent,
  AttendanceRecord,
  CohortEpic,
} from '@/types/attendance';

interface AttendanceLeaderboardProps {
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
  currentEpic: CohortEpic | null;
  layout?: 'table' | 'grid';
  hideFields?: ('email' | 'late' | 'absent')[];
  showExemptedNotice?: boolean;
  maxLeave?: number;
  studentStats?: Array<{
    student: CohortStudent;
    attendancePercentage: number;
    currentStreak: number;
    totalSessions: number;
    presentSessions: number;
    rank: number;
  }>;
}

export const AttendanceLeaderboard: React.FC<AttendanceLeaderboardProps> = ({
  students,
  attendanceRecords,
  currentEpic,
  layout = 'table',
  hideFields = [],
  showExemptedNotice = true,
  maxLeave = 6,
  studentStats = [],
}) => {
  // Check if any students have exempted absences
  const hasExemptedAbsences = students.some(student => {
    const studentRecords = attendanceRecords.filter(
      record => record.student_id === student.id
    );
    return studentRecords.some(
      record => record.status === 'absent' && record.absence_type === 'exempted'
    );
  });

  if (students.length === 0) {
    return (
      <div className='text-center py-8'>
        <Trophy className='h-12 w-12 text-gray-400 mx-auto mb-4' />
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
          No Students Found
        </h3>
        <p className='text-gray-600 dark:text-gray-400'>
          Add students to the cohort to see the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Epic Info - Removed for student dashboard */}

      {/* Exempted Absences Notice */}
      {showExemptedNotice && hasExemptedAbsences && (
        <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <Shield className='h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0' />
            <div className='flex-1'>
              <h4 className='font-medium text-amber-800 mb-1'>
                Exempted Absences
              </h4>
              <p className='text-sm text-amber-700 mb-2'>
                Some students have exempted absences. These are marked with a
                shield icon and count as "present" for attendance analytics and
                leaderboard rankings.
              </p>
              <div className='flex items-center gap-4 text-xs text-amber-600'>
                <div className='flex items-center gap-1'>
                  <Badge
                    variant='outline'
                    className='bg-amber-50 text-amber-700 border-amber-300'
                  >
                    <Shield className='h-3 w-3 mr-1' />1
                  </Badge>
                  <span>Exempted absence indicator</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex items-center gap-1 cursor-help'>
                        <Info className='h-3 w-3' />
                        <span>Learn more</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-sm'>
                      <div className='space-y-2'>
                        <p className='font-semibold'>
                          How Exempted Absences Work:
                        </p>
                        <ul className='text-xs space-y-1'>
                          <li>
                            • Program managers can mark students as absent but
                            exempted for legitimate reasons
                          </li>
                          <li>
                            • Exempted absences count as "present" for
                            attendance percentages
                          </li>
                          <li>• They don't break attendance streaks</li>
                          <li>
                            • They don't negatively impact leaderboard rankings
                          </li>
                          <li>• They're excluded from absence statistics</li>
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render based on layout preference */}
      {layout === 'grid' ? (
        <GridLayout
          studentStats={studentStats}
          attendanceRecords={attendanceRecords}
          hideFields={hideFields}
          maxLeave={maxLeave}
        />
      ) : (
        <TableLayout
          studentStats={studentStats}
          attendanceRecords={attendanceRecords}
          hideFields={hideFields}
          maxLeave={maxLeave}
        />
      )}

      {/* Legend */}
      <div className='flex items-center justify-center gap-6 text-xs text-muted-foreground'>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-green-500 rounded'></div>
          <span>≥95% Excellent</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-blue-500 rounded'></div>
          <span>≥85% Good</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-yellow-500 rounded'></div>
          <span>≥75% Fair</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-2 h-2 bg-red-500 rounded'></div>
          <span>&lt;75% Needs Improvement</span>
        </div>
        {hasExemptedAbsences && (
          <div className='flex items-center gap-1'>
            <Shield className='h-3 w-3 text-amber-600' />
            <span>Exempted Absences</span>
          </div>
        )}
      </div>
    </div>
  );
};
