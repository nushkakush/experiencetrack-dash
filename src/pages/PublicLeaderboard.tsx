import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, RefreshCw, Calendar, Users } from 'lucide-react';
import { AttendanceLeaderboard } from '@/components/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { CohortStudent, AttendanceRecord, CohortEpic, Cohort } from '@/types/attendance';

const PublicLeaderboard = () => {
  const { cohortId, epicId } = useParams<{ cohortId: string; epicId: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [currentEpic, setCurrentEpic] = useState<CohortEpic | null>(null);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load initial data
  const loadData = async () => {
    if (!cohortId || !epicId) return;

    try {
      setLoading(true);
      setError(null);

      // Load cohort
      const { data: cohortData, error: cohortError } = await supabase
        .from('cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      if (cohortError) throw cohortError;

      // Load epic
      const { data: epicData, error: epicError } = await supabase
        .from('cohort_epics')
        .select('*')
        .eq('id', epicId)
        .single();

      if (epicError) throw epicError;

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId);

      if (studentsError) throw studentsError;

      // Load attendance records for this epic
      const { data: recordsData, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: true });

      if (recordsError) throw recordsError;

      setCohort(cohortData);
      setCurrentEpic(epicData);
      setStudents(studentsData || []);
      setAttendanceRecords(recordsData || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading public leaderboard data:', err);
      setError('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!cohortId || !epicId) return;

    // Load initial data
    loadData();

    // Set up real-time subscription for attendance records
    const channel = supabase
      .channel('public-leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `cohort_id=eq.${cohortId}`,
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Reload data when attendance records change
          loadData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cohortId, epicId]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [cohortId, epicId]);

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

  if (error || !cohort || !currentEpic) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900">Leaderboard Not Found</h2>
              <p className="text-gray-600">
                {error || 'The leaderboard you\'re looking for doesn\'t exist or is no longer available.'}
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
                {cohort.name} Leaderboard
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{currentEpic.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{students.length} Students</span>
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

          {/* Leaderboard */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <AttendanceLeaderboard
              students={students}
              attendanceRecords={attendanceRecords}
              currentEpic={currentEpic}
              layout="grid"
              hideFields={['email', 'late', 'absent']}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            <p>This leaderboard updates automatically in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;
