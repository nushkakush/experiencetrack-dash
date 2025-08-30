import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Users,
  TrendingUp,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { CohortStudent, Cohort } from '@/types/cohort';
import { AttendanceLeaderboard } from '@/components/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { HolidayViewDialog } from './HolidayViewDialog';
import { toast } from 'sonner';
import { AttendanceCalculationsService } from '@/services/attendanceCalculations.service';
import type { CohortEpic, AttendanceRecord } from '@/types/attendance';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceOverviewProps {
  studentData: CohortStudent;
  cohortData: Cohort;
}

interface StudentStats {
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  lateSessions: number;
  attendancePercentage: number;
  currentStreak: number;
  rank: number;
}

export const AttendanceOverview = React.memo<AttendanceOverviewProps>(
  ({ studentData, cohortData }) => {
    const [epics, setEpics] = useState<CohortEpic[]>([]);
    const [currentEpic, setCurrentEpic] = useState<CohortEpic | null>(null);
    const [students, setStudents] = useState<CohortStudent[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<
      AttendanceRecord[]
    >([]);
    const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
    const [leaderboardData, setLeaderboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

    // Load epics for the cohort
    const loadEpics = useCallback(async () => {
      try {
        console.log(
          '🔄 AttendanceOverview: Loading epics for cohort:',
          cohortData.id
        );

        // For now, we'll keep the direct Supabase call for epics since it's not in the edge function yet
        // This could be moved to the edge function in the future
        const { data: epicsData, error: epicsError } = await supabase
          .from('cohort_epics')
          .select(
            `
            *,
            epic:epics(*)
          `
          )
          .eq('cohort_id', cohortData.id)
          .order('position', { ascending: true });

        if (epicsError) throw epicsError;

        setEpics(epicsData || []);

        // Set current epic to active epic or first epic
        const activeEpic =
          epicsData?.find(epic => epic.is_active) || epicsData?.[0] || null;
        setCurrentEpic(activeEpic);

        console.log('✅ AttendanceOverview: Epics loaded:', {
          epicsCount: epicsData?.length || 0,
          activeEpic: activeEpic?.id,
          epicName: activeEpic?.epic?.name || activeEpic?.name,
        });
      } catch (err) {
        console.error('❌ AttendanceOverview: Error loading epics:', err);
        setError('Failed to load epics');
      }
    }, [cohortData.id]);

    // Load students and attendance data using edge function
    const loadStudentData = useCallback(async () => {
      if (!currentEpic) return;

      try {
        console.log(
          '🔄 AttendanceOverview: Loading student data for epic:',
          currentEpic.id
        );

        // Get leaderboard data which includes all students and their stats
        const leaderboardData =
          await AttendanceCalculationsService.getLeaderboard({
            cohortId: cohortData.id,
            epicId: currentEpic.id,
            limit: 100,
            offset: 0,
          });

        console.log(
          '✅ AttendanceOverview: Leaderboard data received:',
          leaderboardData
        );

        // Store leaderboard data for use in render
        setLeaderboardData(leaderboardData);

        // Transform leaderboard data to match expected format
        const transformedStudents = leaderboardData.entries.map(
          (entry: any) => ({
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
          })
        );

        setStudents(transformedStudents);

        // Get individual student stats
        const studentStatsData =
          await AttendanceCalculationsService.getStudentStats({
            cohortId: cohortData.id,
            epicId: currentEpic.id,
            studentId: studentData.id,
          });

        console.log(
          '✅ AttendanceOverview: Student stats received:',
          studentStatsData
        );

        // Transform student stats to match expected format
        const transformedStats: StudentStats = {
          totalSessions: studentStatsData.totalSessions,
          presentSessions: studentStatsData.presentSessions,
          absentSessions: studentStatsData.absentSessions,
          lateSessions: studentStatsData.lateSessions,
          attendancePercentage: studentStatsData.attendancePercentage,
          currentStreak: studentStatsData.currentStreak,
          rank: studentStatsData.rank,
        };

        setStudentStats(transformedStats);

        // Get attendance records for the leaderboard display
        // For now, we'll use the leaderboard data to reconstruct attendance records
        // This could be optimized in the future
        const allRecords: AttendanceRecord[] = [];
        leaderboardData.entries.forEach((entry: any) => {
          if (entry.student.attendance_records) {
            allRecords.push(...entry.student.attendance_records);
          }
        });
        setAttendanceRecords(allRecords);
      } catch (err) {
        console.error(
          '❌ AttendanceOverview: Error loading student data:',
          err
        );
        setError(
          err instanceof Error ? err.message : 'Failed to load student data'
        );
        toast.error('Failed to load attendance data');
      }
    }, [currentEpic, cohortData.id, studentData.id]);

    // Load initial data
    useEffect(() => {
      const loadData = async () => {
        if (!cohortData?.id) {
          setError('No cohort data available');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          await loadEpics();
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Failed to load attendance data');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [cohortData?.id, loadEpics]);

    // Load student data when epic changes
    useEffect(() => {
      if (currentEpic) {
        loadStudentData();
      }
    }, [currentEpic, loadStudentData]);

    // Handle epic change
    const handleEpicChange = (epicId: string) => {
      const selectedEpic = epics.find(epic => epic.id === epicId);
      setCurrentEpic(selectedEpic || null);
    };

    if (loading) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Attendance Overview</h1>
            <p className='text-muted-foreground mb-4'>
              Your attendance record and leaderboard position
            </p>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-4' />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className='h-8 w-16 mb-2' />
                    <Skeleton className='h-3 w-32' />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='space-y-4'>
          <div>
            <h1 className='text-2xl font-bold mb-2'>Attendance Overview</h1>
            <p className='text-muted-foreground mb-4'>
              Your attendance record and leaderboard position
            </p>
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center'>
                  <AlertTriangle className='h-8 w-8 text-destructive mx-auto mb-4' />
                  <p className='text-red-600'>Error: {error}</p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    Debug info: studentData={!!studentData}, cohortData=
                    {!!cohortData}, cohortId={cohortData?.id}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className='mt-4'
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold mb-2'>Attendance Overview</h1>
          <p className='text-muted-foreground mb-4'>
            Your attendance record and leaderboard position
          </p>

          {/* Student Statistics Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Sessions
                </CardTitle>
                <Calendar className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {studentStats?.totalSessions || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  in{' '}
                  {currentEpic?.epic?.name ||
                    currentEpic?.name ||
                    'current epic'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Present</CardTitle>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {studentStats?.presentSessions || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {(studentStats?.attendancePercentage || 0).toFixed(1)}%
                  attendance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Absent</CardTitle>
                <XCircle className='h-4 w-4 text-red-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {studentStats?.absentSessions || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {(studentStats?.totalSessions || 0) > 0
                    ? (
                        ((studentStats?.absentSessions || 0) /
                          (studentStats?.totalSessions || 1)) *
                        100
                      ).toFixed(1)
                    : 0}
                  % absence rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Current Streak
                </CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {studentStats?.currentStreak || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  consecutive sessions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Full Leaderboard */}
          {currentEpic &&
            students.length > 0 &&
            attendanceRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    Class Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Class performance rankings for{' '}
                    <span className='font-medium'>
                      {currentEpic.epic?.name || currentEpic.name}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceLeaderboard
                    students={students}
                    attendanceRecords={attendanceRecords}
                    currentEpic={currentEpic}
                    layout='grid'
                    hideFields={['email', 'late', 'absent']}
                    showExemptedNotice={false}
                    studentStats={
                      leaderboardData?.entries?.map((entry: any) => ({
                        student: students.find(s => s.id === entry.student.id)!,
                        attendancePercentage: entry.attendancePercentage,
                        currentStreak: entry.currentStreak,
                        totalSessions: entry.totalSessions,
                        presentSessions: entry.presentSessions,
                        rank: entry.rank,
                      })) || []
                    }
                  />
                </CardContent>
              </Card>
            )}

          {/* No Data Fallback */}
          {!loading && !error && (!currentEpic || students.length === 0) && (
            <Card>
              <CardContent className='pt-6'>
                <div className='text-center'>
                  <Trophy className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-medium mb-2'>
                    No Attendance Data Available
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    {!currentEpic
                      ? 'No epics found for this cohort.'
                      : 'No students or attendance records found.'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Debug: epics={epics.length}, students={students.length},
                    currentEpic={!!currentEpic}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Sessions Attended Message */}
          {!loading &&
            !error &&
            currentEpic &&
            students.length > 0 &&
            attendanceRecords.length === 0 && (
              <Card>
                <CardContent className='pt-6'>
                  <div className='text-center'>
                    <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-medium mb-2'>
                      No Sessions Attended Yet
                    </h3>
                    <p className='text-muted-foreground mb-4'>
                      You have not attended any sessions in{' '}
                      <strong>
                        {currentEpic.epic?.name || currentEpic.name}
                      </strong>{' '}
                      yet.
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Your attendance statistics will appear here once you start
                      attending sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Holiday View Dialog */}
          {cohortData && (
            <HolidayViewDialog
              open={holidayDialogOpen}
              onOpenChange={setHolidayDialogOpen}
              cohortId={cohortData.id}
            />
          )}
        </div>
      </div>
    );
  }
);

AttendanceOverview.displayName = 'AttendanceOverview';
