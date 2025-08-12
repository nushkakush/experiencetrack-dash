import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logger } from '@/lib/logging/Logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Trophy, Medal, Crown, Users, Calendar, Clock } from 'lucide-react';
import { supabase, connectionManager } from '@/integrations/supabase/client';
import { AttendanceLeaderboard } from '@/components/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import type { CohortStudent, AttendanceRecord, CohortEpic, Cohort } from '@/types/attendance';

const PublicLeaderboard = () => {
  const { cohortId, epicId } = useParams<{ cohortId: string; epicId: string }>();
  const [cohort, setCohort] = useState<Cohort | null>(null);
  const [currentEpic, setCurrentEpic] = useState<CohortEpic | null>(null);
  const [students, setStudents] = useState<CohortStudent[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
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
      setAttendanceData(recordsData || []);
      setLastUpdated(new Date());
    } catch (err) {
      Logger.getInstance().error('Error loading public leaderboard data', { error: err });
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

    const channelName = `public-leaderboard-${cohortId}-${epicId}`;

    // Set up real-time subscription for attendance records with unique channel name
    const channel = connectionManager.createChannel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `cohort_id=eq.${cohortId}`,
        },
        (payload) => {
          Logger.getInstance().debug('Real-time update received', { payload });
          // Reload data when attendance records change
          loadData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      connectionManager.removeChannel(channelName);
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
      <div className="min-h-screen bg-background py-8 relative">
        {/* Theme Toggle in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 relative">
        {/* Theme Toggle in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Leaderboard Not Found</h2>
            <p className="text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              {cohort?.name} Leaderboard
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{students.length} Students</span>
              </div>
              {currentEpic && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{currentEpic.name}</span>
                </div>
              )}
            </div>
          </div>

          <AttendanceLeaderboard 
            students={students}
            attendanceRecords={attendanceData}
            currentEpic={currentEpic}
            layout="grid"
            hideFields={['email', 'late', 'absent']}
          />

          <div className="text-center text-xs text-muted-foreground mt-8">
            <p>This leaderboard updates in real-time</p>
            <p>Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;
