import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle,
  Crown,
  Info,
  Shield,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatisticItem, StatisticsGrid } from '@/components/common/statistics';
import { attendanceCalculations } from '@/services/attendanceCalculations.service';
import { toast } from 'sonner';

interface AttendanceStatisticsProps {
  cohortId: string;
  epicId: string;
  selectedDate: Date;
  mode?: 'epic' | 'session';
}

export const AttendanceStatistics: React.FC<AttendanceStatisticsProps> = ({
  cohortId,
  epicId,
  selectedDate,
  mode = 'epic',
}) => {
  const [epicStats, setEpicStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpicStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have valid IDs
        if (!cohortId || !epicId) {
          console.warn('Missing cohortId or epicId for AttendanceStatistics');
          return;
        }

        const stats = await attendanceCalculations.getEpicStats({
          cohortId,
          epicId,
        });

        setEpicStats(stats);
      } catch (err) {
        console.error('Failed to fetch epic stats:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch epic statistics'
        );
        toast.error('Failed to load epic statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchEpicStats();
  }, [cohortId, epicId]);

  if (loading) {
    return (
      <StatisticsGrid columns={4}>
        {/* Overall Average Skeleton */}
        <StatisticItem
          title='Overall Average'
          value='--'
          subtitle='Epic attendance rate'
          icon={<TrendingUp className='h-4 w-4' />}
        />

        {/* Epic Status Skeleton */}
        <StatisticItem
          title='Epic Status'
          value='--'
          subtitle='Overall performance'
          icon={<AlertTriangle className='h-4 w-4' />}
        />

        {/* Top Streak Skeleton */}
        <StatisticItem
          title='Top Streak'
          value='--'
          subtitle='consecutive sessions'
          icon={<Crown className='h-4 w-4' />}
        />

        {/* Uninformed Absents Skeleton */}
        <StatisticItem
          title='Uninformed Absents'
          value='--'
          subtitle='For this epic only'
          icon={<Bell className='h-4 w-4' />}
        />
      </StatisticsGrid>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center p-8 text-red-600'>
        <AlertTriangle className='h-8 w-8 mr-2' />
        <span>Error loading statistics: {error}</span>
      </div>
    );
  }

  if (!epicStats) {
    return (
      <div className='flex items-center justify-center p-8 text-muted-foreground'>
        <Info className='h-8 w-8 mr-2' />
        <span>No attendance data available</span>
      </div>
    );
  }

  // Extract data from epicStats
  const {
    totalStudents,
    totalSessions,
    attendanceBreakdown,
    absenceBreakdown,
    topStreakData,
    epicStatus,
  } = epicStats;

  // Check if there are any exempted absences
  const hasExemptedAbsences = attendanceBreakdown.exempted > 0;

  // Determine subtitle based on mode
  const getAttendanceSubtitle = () => {
    if (mode === 'epic') {
      return `${attendanceBreakdown.attendancePercentage.toFixed(1)}% overall attendance`;
    } else {
      return `${attendanceBreakdown.attendancePercentage.toFixed(1)}% attended this session`;
    }
  };

  const getAbsentSubtitle = () => {
    if (mode === 'epic') {
      return 'For this epic only';
    } else {
      return 'For this session only';
    }
  };

  return (
    <TooltipProvider>
      <div className='space-y-4'>
        {/* Exempted Absences Notice */}
        {hasExemptedAbsences && (
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3'>
            <div className='flex items-center gap-2 text-sm text-amber-800'>
              <Shield className='h-4 w-4 text-amber-600' />
              <span>
                <strong>
                  {attendanceBreakdown.exempted} exempted absence
                  {attendanceBreakdown.exempted !== 1 ? 's' : ''}
                </strong>{' '}
                included in attendance calculations. These count as "present"
                for analytics purposes.
              </span>
            </div>
          </div>
        )}

        <StatisticsGrid columns={4}>
          <StatisticItem
            icon={<TrendingUp className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Overall Average
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      {mode === 'epic'
                        ? `Epic attendance rate shows the average session attendance across all sessions in this epic. Each session's attendance percentage is calculated as (attended students / total students) × 100, then averaged across all ${totalSessions} sessions to get ${attendanceBreakdown.attendancePercentage.toFixed(1)}%.`
                        : `Session attendance rate calculated as: (attended students / total students) × 100 = (${attendanceBreakdown.attended} / ${totalStudents}) × 100 = ${attendanceBreakdown.attendancePercentage.toFixed(1)}%`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={`${attendanceBreakdown.attendancePercentage.toFixed(1)}%`}
            subtitle={
              mode === 'epic'
                ? 'Epic attendance rate'
                : 'Session attendance rate'
            }
            variant='default'
          />

          <StatisticItem
            icon={<AlertTriangle className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Epic Status
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Performance rating based on attendance percentage:
                      <br />• ≥90%: Excellent (Green)
                      <br />• ≥75%: Good (Blue)
                      <br />• ≥60%: Fair (Yellow)
                      <br />• &lt;60%: Needs Attention (Red)
                      <br />
                      <br />
                      Current:{' '}
                      {attendanceBreakdown.attendancePercentage.toFixed(1)}% ={' '}
                      {epicStatus.text}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={epicStatus.text}
            subtitle='Overall performance'
            variant='default'
            badge={
              epicStatus.variant === 'error' ? (
                <Badge variant='destructive'>Needs Attention</Badge>
              ) : null
            }
          />

          <StatisticItem
            icon={<Crown className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Top Streak
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Longest current consecutive attendance streak across all
                      students. Counts present, late, and exempted as attended.
                      {topStreakData.value > 0 && (
                        <>
                          <br />
                          <br />
                          Current leader:{' '}
                          {topStreakData.studentNames.join(', ')} with{' '}
                          {topStreakData.value} consecutive sessions
                        </>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={topStreakData.value}
            subtitle={
              topStreakData.value > 0
                ? topStreakData.studentNames.length === 1
                  ? topStreakData.studentNames[0]
                  : `${topStreakData.studentNames.length} students tied`
                : 'No active streaks'
            }
            variant='default'
          />

          <StatisticItem
            icon={<AlertTriangle className='h-5 w-5' />}
            title={
              <div className='flex items-center gap-2'>
                Uninformed Absents
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p>
                      Total number of absences where no reason was provided or
                      the absence type is "uninformed".
                      {mode === 'epic'
                        ? ` Counts across all sessions in this epic.`
                        : ` Counts for this session only.`}
                      <br />
                      <br />
                      Current count: {absenceBreakdown.uninformed}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            }
            value={absenceBreakdown.uninformed}
            subtitle={getAbsentSubtitle()}
            variant='default'
          />
        </StatisticsGrid>
      </div>
    </TooltipProvider>
  );
};
