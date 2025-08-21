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
} from 'lucide-react';
import { CohortStudent, Cohort } from '@/types/cohort';
import { AttendanceLeaderboard } from '@/components/attendance';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { HolidayViewDialog } from './HolidayViewDialog';
import type { CohortEpic, AttendanceRecord } from '@/types/attendance';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);

    // Load epics for the cohort
    const loadEpics = useCallback(async () => {
      try {
        const { data: epicsData, error: epicsError } = await supabase
          .from('cohort_epics')
          .select('*')
          .eq('cohort_id', cohortData.id)
          .order('position', { ascending: true });

        if (epicsError) throw epicsError;

        setEpics(epicsData || []);

        // Set current epic to active epic or first epic
        const activeEpic =
          epicsData?.find(epic => epic.is_active) || epicsData?.[0] || null;
        setCurrentEpic(activeEpic);
      } catch (err) {
        console.error('Error loading epics:', err);
        setError('Failed to load epics');
      }
    }, [cohortData.id]);

    // Load students for the cohort
    const loadStudents = useCallback(async () => {
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortData.id)
          .neq('dropped_out_status', 'dropped_out');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      } catch (err) {
        console.error('Error loading students:', err);
        setError('Failed to load students');
      }
    }, [cohortData.id]);

    // Load attendance records for current epic
    const loadAttendanceRecords = useCallback(async () => {
      if (!currentEpic) return;

      try {
        const { data: recordsData, error: recordsError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('cohort_id', cohortData.id)
          .eq('epic_id', currentEpic.id)
          .order('session_date', { ascending: true });

        if (recordsError) throw recordsError;
        setAttendanceRecords(recordsData || []);
      } catch (err) {
        console.error('Error loading attendance records:', err);
        setError('Failed to load attendance records');
      }
    }, [currentEpic, cohortData.id]);

    // Calculate student statistics
    const calculateStudentStats = useCallback((): StudentStats | null => {
      if (!studentData || !currentEpic || students.length === 0) return null;

      // Get all attendance records for this student in current epic
      const studentRecords = attendanceRecords.filter(
        record => record.student_id === studentData.id
      );

      // Calculate basic stats - treat exempted absences as present for analytics
      const totalSessions = studentRecords.length;
      const presentSessions = studentRecords.filter(
        record => record.status === 'present'
      ).length;
      const lateSessions = studentRecords.filter(
        record => record.status === 'late'
      ).length;
      const exemptedSessions = studentRecords.filter(
        record =>
          record.status === 'absent' && record.absence_type === 'exempted'
      ).length;
      const regularAbsentSessions = studentRecords.filter(
        record =>
          record.status === 'absent' && record.absence_type !== 'exempted'
      ).length;

      // For analytics: present + late + exempted count as attended
      const attendedSessions =
        presentSessions + lateSessions + exemptedSessions;
      const attendancePercentage =
        totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

      // Calculate current streak - exempted counts as attended
      const sortedRecords = studentRecords.sort(
        (a, b) =>
          new Date(b.session_date).getTime() -
          new Date(a.session_date).getTime()
      );

      let currentStreak = 0;
      for (const record of sortedRecords) {
        if (
          record.status === 'present' ||
          record.status === 'late' ||
          (record.status === 'absent' && record.absence_type === 'exempted')
        ) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate rank among all students - exempted counts as attended for all students
      const allStudentStats = students.map(student => {
        const studentRecords = attendanceRecords.filter(
          record => record.student_id === student.id
        );
        const totalSessions = studentRecords.length;
        const attendedSessions = studentRecords.filter(
          record =>
            record.status === 'present' ||
            record.status === 'late' ||
            (record.status === 'absent' && record.absence_type === 'exempted')
        ).length;
        const attendancePercentage =
          totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;

        return { student, attendancePercentage };
      });

      // Sort by attendance percentage (descending)
      allStudentStats.sort(
        (a, b) => b.attendancePercentage - a.attendancePercentage
      );

      // Find rank
      const rank =
        allStudentStats.findIndex(stat => stat.student.id === studentData.id) +
        1;

      return {
        totalSessions,
        presentSessions: attendedSessions,
        absentSessions: regularAbsentSessions,
        lateSessions,
        attendancePercentage,
        currentStreak,
        rank,
      };
    }, [studentData, currentEpic, students, attendanceRecords]);

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
          await loadStudents();
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Failed to load attendance data');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [cohortData?.id, loadEpics, loadStudents]);

    // Load attendance records when epic changes
    useEffect(() => {
      if (currentEpic) {
        loadAttendanceRecords();
      }
    }, [currentEpic, cohortData.id, loadAttendanceRecords]);

    // Calculate student stats when data changes
    useEffect(() => {
      const stats = calculateStudentStats();
      setStudentStats(stats);
    }, [calculateStudentStats]);

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

          {/* Epic Selector and View Holidays Button - Hidden for students */}
          {/* <div className='mb-6'>
            {epics.length > 0 ? (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <label className='text-sm font-medium'>Currently Active</label>
                  <Select
                    value={currentEpic?.id || ''}
                    onValueChange={handleEpicChange}
                  >
                    <SelectTrigger className='w-64'>
                      <SelectValue placeholder='Select an epic to view' />
                    </SelectTrigger>
                    <SelectContent>
                      {epics.map(epic => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.epic?.name || epic.name}{' '}
                          {epic.is_active && '(Currently Active)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setHolidayDialogOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Calendar className='h-4 w-4' />
                  View Holidays
                </Button>
              </div>
            ) : (
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  No epics found for this cohort. Please contact your
                  administrator.
                </div>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setHolidayDialogOpen(true)}
                  className='flex items-center gap-2'
                >
                  <Calendar className='h-4 w-4' />
                  View Holidays
                </Button>
              </div>
            )}
          </div> */}

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
                  <CardDescription>Class performance rankings</CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceLeaderboard
                    students={students}
                    attendanceRecords={attendanceRecords}
                    currentEpic={currentEpic}
                    layout='grid'
                    hideFields={['email', 'late', 'absent']}
                    showExemptedNotice={false}
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
