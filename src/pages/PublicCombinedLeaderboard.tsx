import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceLeaderboard } from '@/components/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext 
} from '@/components/ui/carousel';
import { Trophy, RefreshCw, Calendar, Users } from 'lucide-react';
import type { 
  CohortStudent, 
  AttendanceRecord, 
  CohortEpic, 
  Cohort 
} from '@/types/attendance';

interface CohortLeaderboardData {
  cohort: Cohort;
  primaryEpic: CohortEpic | null;
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
}

const PublicCombinedLeaderboard = () => {
  const { cohortIds } = useParams<{ cohortIds: string }>();
  const [leaderboardData, setLeaderboardData] = useState<CohortLeaderboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Parse cohort IDs from URL
  const selectedCohortIds = cohortIds ? cohortIds.split(',') : [];

  // Load leaderboard data for selected cohorts
  const loadLeaderboardData = async () => {
    if (selectedCohortIds.length === 0) {
      setError('No cohorts specified');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cohortData: CohortLeaderboardData[] = [];

      for (const cohortId of selectedCohortIds) {
        // Load cohort details
        const { data: cohort, error: cohortError } = await supabase
          .from('cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();

        if (cohortError) {
          console.error(`Error loading cohort ${cohortId}:`, cohortError);
          continue;
        }

        // Load epics and find primary (active) epic
        const { data: epics, error: epicsError } = await supabase
          .from('cohort_epics')
          .select('*')
          .eq('cohort_id', cohortId)
          .order('position', { ascending: true });

        if (epicsError) {
          console.error(`Error loading epics for cohort ${cohortId}:`, epicsError);
          continue;
        }

        // Find primary epic (active epic, or first epic if none active)
        const primaryEpic = epics?.find(epic => epic.is_active) || epics?.[0] || null;

        if (!primaryEpic) {
          console.warn(`No primary epic found for cohort ${cohortId}`);
          continue;
        }

        // Load students
        const { data: students, error: studentsError } = await supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId);

        if (studentsError) {
          console.error(`Error loading students for cohort ${cohortId}:`, studentsError);
          continue;
        }

        // Load attendance records for primary epic
        const { data: attendanceRecords, error: recordsError } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('cohort_id', cohortId)
          .eq('epic_id', primaryEpic.id)
          .order('session_date', { ascending: true });

        if (recordsError) {
          console.error(`Error loading attendance records for cohort ${cohortId}:`, recordsError);
          continue;
        }

        cohortData.push({
          cohort,
          primaryEpic,
          students: students || [],
          attendanceRecords: attendanceRecords || []
        });
      }

      if (cohortData.length === 0) {
        setError('No valid cohorts found');
      } else {
        setLeaderboardData(cohortData);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading combined leaderboard data:', error);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (selectedCohortIds.length === 0) return;

    // Load initial data
    loadLeaderboardData();

    // Set up real-time subscription for attendance records
    const channel = supabase
      .channel('public-combined-leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Only reload if the change affects our cohorts
          if (selectedCohortIds.includes(payload.new?.cohort_id || payload.old?.cohort_id)) {
            loadLeaderboardData();
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cohortIds]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      loadLeaderboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [cohortIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-6 w-[200px]" />
            <div className="bg-white rounded-lg border p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || leaderboardData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900">Leaderboards Not Found</h2>
              <p className="text-gray-600">
                {error || 'The leaderboards you\'re looking for don\'t exist or are no longer available.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Combined Leaderboards
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{leaderboardData.length} Cohort{leaderboardData.length !== 1 ? 's' : ''}</span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Live Updates
              </Badge>
            </div>
          </div>

          {/* Last Updated Info */}
          <div className="text-center text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>

          {/* Leaderboards Carousel */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <Carousel className="w-full">
              <CarouselContent>
                {leaderboardData.map((data) => (
                  <CarouselItem key={data.cohort.id}>
                    <div className="space-y-4">
                      {/* Cohort Header */}
                      <div className="text-center border-b pb-4">
                        <h3 className="text-xl font-bold">{data.cohort.name}</h3>
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{data.primaryEpic?.name || 'No Epic'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{data.students.length} Students</span>
                          </div>
                        </div>
                      </div>

                      {/* Leaderboard */}
                      {data.students.length > 0 ? (
                        <AttendanceLeaderboard
                          students={data.students}
                          attendanceRecords={data.attendanceRecords}
                          currentEpic={data.primaryEpic}
                          layout="grid"
                          hideFields={['email', 'late', 'absent']}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students</h3>
                          <p className="text-gray-600">This cohort has no enrolled students.</p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {leaderboardData.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>These leaderboards update automatically in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCombinedLeaderboard;
