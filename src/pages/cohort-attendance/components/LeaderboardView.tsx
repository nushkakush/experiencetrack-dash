import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logger } from '@/lib/logging/Logger';
import { Grid3X3, List, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AttendanceLeaderboard,
  CopyLeaderboardButton,
} from '@/components/attendance';
import { AttendanceCalculationsService } from '@/services/attendanceCalculations.service';

interface LeaderboardViewProps {
  leaderboardLayout: 'table' | 'grid';
  cohortId: string;
  epicId: string;
  cohortName?: string;
  epicName?: string;
  onLayoutChange: (layout: 'table' | 'grid') => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboardLayout,
  cohortId,
  epicId,
  cohortName,
  epicName,
  onLayoutChange,
}) => {
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!cohortId || !epicId) {
        setError('Missing cohort ID or epic ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔄 LeaderboardView: Fetching leaderboard data for:', {
          cohortId,
          epicId,
        });

        const data = await AttendanceCalculationsService.getLeaderboard({
          cohortId,
          epicId,
          limit: 100,
          offset: 0,
        });

        console.log('✅ LeaderboardView: Leaderboard data received:', data);
        setLeaderboardData(data);
      } catch (err) {
        console.error(
          '❌ LeaderboardView: Error fetching leaderboard data:',
          err
        );
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch leaderboard data'
        );
        toast.error('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [cohortId, epicId]);

  if (loading) {
    return (
      <div className='space-y-4'>
        {/* Header Skeleton */}
        <div className='flex items-center justify-between'>
          <div>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-64' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-9 w-9' />
            <Skeleton className='h-9 w-9' />
            <Skeleton className='h-9 w-32' />
          </div>
        </div>

        {/* Leaderboard Grid Skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 9 }, (_, index) => (
            <div key={`skeleton-${index}`} className='p-4 border rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <Skeleton className='h-6 w-6 rounded-full' />
                <Skeleton className='h-4 w-16' />
              </div>
              <Skeleton className='h-5 w-32 mb-2' />
              <Skeleton className='h-4 w-24 mb-1' />
              <Skeleton className='h-4 w-20' />
              <div className='flex items-center justify-between mt-3'>
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-center py-12'>
          <AlertTriangle className='h-8 w-8 text-destructive' />
          <span className='ml-2 text-destructive'>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!leaderboardData || !leaderboardData.entries) {
    return (
      <div className='space-y-4'>
        <div className='text-center py-8'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            No Leaderboard Data
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            No attendance data available for this epic.
          </p>
        </div>
      </div>
    );
  }

  // Transform edge function data to match expected format
  const students = leaderboardData.entries.map((entry: any) => ({
    id: entry.student.id,
    first_name: entry.student.first_name,
    last_name: entry.student.last_name,
    email: entry.student.email,
    phone: entry.student.phone,
    user_id: entry.student.user_id,
    invite_status: entry.student.invite_status,
    invited_at: entry.student.invited_at,
    accepted_at: entry.student.accepted_at,
    created_at: entry.student.created_at,
    updated_at: entry.student.updated_at,
    invitation_token: entry.student.invitation_token,
    invitation_expires_at: entry.student.invitation_expires_at,
    invited_by: entry.student.invited_by,
    dropped_out_status: entry.student.dropped_out_status,
    dropped_out_reason: entry.student.dropped_out_reason,
    dropped_out_at: entry.student.dropped_out_at,
    dropped_out_by: entry.student.dropped_out_by,
    communication_preferences: entry.student.communication_preferences,
    cohort_id: entry.student.cohort_id,
  }));

  const attendanceRecords = leaderboardData.entries.flatMap(
    (entry: any) => entry.student.attendance_records || []
  );

  const studentStats = leaderboardData.entries.map((entry: any) => ({
    student: students.find(s => s.id === entry.student.id)!,
    attendancePercentage: entry.attendancePercentage,
    currentStreak: entry.currentStreak,
    totalSessions: entry.totalSessions,
    presentSessions: entry.presentSessions,
    rank: entry.rank,
  }));

  const currentEpic = {
    id: leaderboardData.epicInfo?.id,
    name: leaderboardData.epicInfo?.name,
  };

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
        attendanceRecords={attendanceRecords}
        currentEpic={currentEpic}
        layout={leaderboardLayout}
        hideFields={['email', 'late', 'absent']}
        studentStats={studentStats}
      />
    </div>
  );
};
