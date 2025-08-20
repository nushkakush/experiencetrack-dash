import React from 'react';
import { Button } from '@/components/ui/button';
import { Logger } from '@/lib/logging/Logger';
import { Grid3X3, List } from 'lucide-react';
import {
  AttendanceLeaderboard,
  CopyLeaderboardButton,
} from '@/components/attendance';

interface LeaderboardViewProps {
  leaderboardLayout: 'table' | 'grid';
  cohortId: string;
  epicId: string;
  cohortName?: string;
  epicName?: string;
  students: Record<string, unknown>[];
  epicAttendanceRecords: Record<string, unknown>[];
  currentEpic: Record<string, unknown>;
  onLayoutChange: (layout: 'table' | 'grid') => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboardLayout,
  cohortId,
  epicId,
  cohortName,
  epicName,
  students,
  epicAttendanceRecords,
  currentEpic,
  onLayoutChange,
}) => {
  return (
    <div className='space-y-4'>
      {/* Copy Link Section */}
      <div className='flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800'>
        <div>
          <h3 className='font-medium text-blue-900 dark:text-blue-100'>
            Share Leaderboard
          </h3>
          <p className='text-sm text-blue-700 dark:text-blue-300'>
            Generate a public link to share this leaderboard with real-time
            updates
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {/* Layout Toggle */}
          <div className='flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded border'>
            <Button
              variant={leaderboardLayout === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onLayoutChange('grid')}
              className='h-7 px-2'
            >
              <Grid3X3 className='h-3 w-3' />
            </Button>
            <Button
              variant={leaderboardLayout === 'table' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onLayoutChange('table')}
              className='h-7 px-2'
            >
              <List className='h-3 w-3' />
            </Button>
          </div>

          <CopyLeaderboardButton
            cohortId={cohortId}
            epicId={epicId}
            cohortName={cohortName}
            epicName={epicName}
          />
        </div>
      </div>

      {/* Leaderboard */}
      <AttendanceLeaderboard
        students={students}
        attendanceRecords={epicAttendanceRecords}
        currentEpic={currentEpic}
        layout={leaderboardLayout}
        hideFields={['email', 'late', 'absent']}
      />
    </div>
  );
};
