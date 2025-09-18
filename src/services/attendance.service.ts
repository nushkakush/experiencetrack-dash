import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// New daily attendance record type
type DailyAttendanceRecord = {
  id: string;
  cohort_id: string;
  epic_id: string;
  session_date: string;
  attendance_data: {
    sessions: Array<{
      session_number: number;
      marked_by: string;
      marked_at: string;
      is_complete: boolean;
      students: Record<
        string,
        {
          status: 'present' | 'absent' | 'late';
          absence_type?: 'informed' | 'uninformed' | 'exempted';
          reason?: string;
          marked_at: string;
        }
      >;
    }>;
  };
  marked_by: string;
  created_at: string;
  updated_at: string;
};

// Legacy types for compatibility
type AttendanceRecord =
  Database['public']['Tables']['attendance_records']['Row'];
type CancelledSession =
  Database['public']['Tables']['cancelled_sessions']['Row'];
type CohortEpic = Database['public']['Tables']['cohort_epics']['Row'];
type CohortStudent = Database['public']['Tables']['cohort_students']['Row'];
type AttendanceSummary =
  Database['public']['Views']['attendance_summary']['Row'];

export interface SessionInfo {
  sessionNumber: number;
  sessionDate: string;
  isCancelled: boolean;
}

export interface AttendanceData {
  sessionInfo: SessionInfo;
  records: AttendanceRecord[];
  students: CohortStudent[];
}

export interface EpicAttendanceData {
  epic: CohortEpic;
  sessions: SessionInfo[];
  summary: AttendanceSummary[];
}

export class AttendanceService {
  // Debug method to check database connection and permissions
  static async debugDatabaseConnection(): Promise<void> {
    console.log(
      '🔍 AttendanceService.debugDatabaseConnection: Starting database connection test'
    );

    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('cohorts')
        .select('id')
        .limit(1);

      if (connectionError) {
        console.error(
          '❌ AttendanceService.debugDatabaseConnection: Connection test failed:',
          connectionError
        );
        return;
      }

      console.log(
        '✅ AttendanceService.debugDatabaseConnection: Basic connection successful'
      );

      // Test cohort_epics table access
      const { data: epicsTest, error: epicsError } = await supabase
        .from('cohort_epics')
        .select('id, cohort_id')
        .limit(1);

      if (epicsError) {
        console.error(
          '❌ AttendanceService.debugDatabaseConnection: cohort_epics table access failed:',
          epicsError
        );
        return;
      }

      console.log(
        '✅ AttendanceService.debugDatabaseConnection: cohort_epics table access successful'
      );

      // Test epics table access
      const { data: epicsMasterTest, error: epicsMasterError } = await supabase
        .from('epics')
        .select('id, name')
        .limit(1);

      if (epicsMasterError) {
        console.error(
          '❌ AttendanceService.debugDatabaseConnection: epics table access failed:',
          epicsMasterError
        );
        return;
      }

      console.log(
        '✅ AttendanceService.debugDatabaseConnection: epics table access successful'
      );

      // Test join query
      const { data: joinTest, error: joinError } = await supabase
        .from('cohort_epics')
        .select(
          `
          *,
          epic:epics(*)
        `
        )
        .limit(1);

      if (joinError) {
        console.error(
          '❌ AttendanceService.debugDatabaseConnection: Join query failed:',
          joinError
        );
        return;
      }

      console.log(
        '✅ AttendanceService.debugDatabaseConnection: Join query successful:',
        {
          resultCount: joinTest?.length || 0,
          sampleData: joinTest?.[0]
            ? {
                cohort_epic_id: joinTest[0].id,
                epic_id: joinTest[0].epic?.id,
                epic_name: joinTest[0].epic?.name,
              }
            : null,
        }
      );
    } catch (error) {
      console.error(
        '❌ AttendanceService.debugDatabaseConnection: Unexpected error:',
        error
      );
    }
  }
  // Mark student attendance in new daily structure
  static async markAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    studentId: string,
    status: 'present' | 'absent' | 'late',
    absenceType?: 'informed' | 'uninformed' | 'exempted',
    reason?: string
  ): Promise<string> {
    console.log(
      '🔍 AttendanceService.markAttendance: Marking attendance with new structure:',
      {
        cohortId,
        epicId,
        sessionNumber,
        sessionDate,
        studentId,
        status,
      }
    );

    // Get or create daily attendance record
    const { data: dailyRecord, error: fetchError } = await supabase
      .from('daily_attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('session_date', sessionDate)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(
        '❌ AttendanceService.markAttendance: Error fetching daily record:',
        fetchError
      );
      throw fetchError;
    }

    const currentUser = (await supabase.auth.getUser()).data.user;
    const userId = currentUser?.id;

    if (!dailyRecord) {
      // Create new daily record
      console.log(
        '📝 AttendanceService.markAttendance: Creating new daily record'
      );

      const newRecord: Partial<DailyAttendanceRecord> = {
        cohort_id: cohortId,
        epic_id: epicId,
        session_date: sessionDate,
        attendance_data: {
          sessions: [
            {
              session_number: sessionNumber,
              marked_by: userId || '',
              marked_at: new Date().toISOString(),
              is_complete: false,
              students: {
                [studentId]: {
                  status,
                  absence_type: absenceType,
                  reason: reason || null,
                  marked_at: new Date().toISOString(),
                },
              },
            },
          ],
        },
        marked_by: userId || '',
      };

      const { data: insertedRecord, error: insertError } = await supabase
        .from('daily_attendance_records')
        .insert(newRecord)
        .select()
        .single();

      if (insertError) {
        console.error(
          '❌ AttendanceService.markAttendance: Error inserting daily record:',
          insertError
        );
        throw insertError;
      }

      console.log(
        '✅ AttendanceService.markAttendance: Created new daily record'
      );
      return insertedRecord.id;
    } else {
      // Update existing daily record
      console.log(
        '📝 AttendanceService.markAttendance: Updating existing daily record'
      );

      const updatedData = { ...dailyRecord.attendance_data };

      // Find or create session
      let sessionIndex = updatedData.sessions.findIndex(
        s => s.session_number === sessionNumber
      );

      if (sessionIndex === -1) {
        // Add new session
        updatedData.sessions.push({
          session_number: sessionNumber,
          marked_by: userId || '',
          marked_at: new Date().toISOString(),
          is_complete: false,
          students: {
            [studentId]: {
              status,
              absence_type: absenceType,
              reason: reason || null,
              marked_at: new Date().toISOString(),
            },
          },
        });
        sessionIndex = updatedData.sessions.length - 1;
      } else {
        // Update existing session
        updatedData.sessions[sessionIndex].students[studentId] = {
          status,
          absence_type: absenceType,
          reason: reason || null,
          marked_at: new Date().toISOString(),
        };
        updatedData.sessions[sessionIndex].marked_at = new Date().toISOString();
        updatedData.sessions[sessionIndex].marked_by = userId || '';
      }

      // Sort sessions by session_number
      updatedData.sessions.sort((a, b) => a.session_number - b.session_number);

      const { data: updatedRecord, error: updateError } = await supabase
        .from('daily_attendance_records')
        .update({
          attendance_data: updatedData,
          marked_by: userId || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dailyRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          '❌ AttendanceService.markAttendance: Error updating daily record:',
          updateError
        );
        throw updateError;
      }

      console.log('✅ AttendanceService.markAttendance: Updated daily record');
      return updatedRecord.id;
    }
  }

  // Check if a session is cancelled
  static async isSessionCancelled(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_session_cancelled', {
      p_cohort_id: cohortId,
      p_epic_id: epicId,
      p_session_number: sessionNumber,
      p_session_date: sessionDate,
    });

    if (error) throw error;
    return data;
  }

  // Cancel or reactivate a session
  static async toggleSessionCancellation(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string,
    isCancelled: boolean
  ): Promise<void> {
    const { error } = await supabase.rpc('toggle_session_cancellation', {
      p_cohort_id: cohortId,
      p_epic_id: epicId,
      p_session_number: sessionNumber,
      p_session_date: sessionDate,
      p_is_cancelled: isCancelled,
    });

    if (error) throw error;
  }

  // Get attendance records for a specific session from new daily structure
  static async getSessionAttendance(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<AttendanceRecord[]> {
    console.log(
      '🔍 AttendanceService.getSessionAttendance: Fetching attendance records from daily structure:',
      {
        cohortId,
        epicId,
        sessionNumber,
        sessionDate,
      }
    );

    const { data: dailyRecord, error } = await supabase
      .from('daily_attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('session_date', sessionDate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No records found
        console.log(
          '📝 AttendanceService.getSessionAttendance: No daily record found'
        );
        return [];
      }
      console.error(
        '❌ AttendanceService.getSessionAttendance: Supabase error:',
        error
      );
      throw error;
    }

    // Extract session data
    const session = dailyRecord.attendance_data.sessions.find(
      s => s.session_number === sessionNumber
    );

    if (!session) {
      console.log(
        '📝 AttendanceService.getSessionAttendance: No session found for session number:',
        sessionNumber
      );
      return [];
    }

    // Convert to legacy format for compatibility
    const records: AttendanceRecord[] = Object.entries(session.students).map(
      ([studentId, studentData]) => ({
        id: `${dailyRecord.id}-${sessionNumber}-${studentId}`, // Generate synthetic ID
        student_id: studentId,
        cohort_id: cohortId,
        epic_id: epicId,
        session_number: sessionNumber,
        session_date: sessionDate,
        status: studentData.status,
        absence_type: studentData.absence_type || null,
        reason: studentData.reason || null,
        marked_by: session.marked_by,
        created_at: dailyRecord.created_at,
        updated_at: studentData.marked_at,
      })
    );

    console.log(
      '✅ AttendanceService.getSessionAttendance: Successfully converted daily record to session records:',
      {
        count: records.length,
        records: records.map(record => ({
          student_id: record.student_id,
          status: record.status,
          session_number: record.session_number,
        })),
      }
    );

    return records;
  }

  // Get all sessions for a date (generated based on cohort.sessions_per_day)
  static async getSessionsForDate(
    cohortId: string,
    epicId: string,
    sessionDate: string
  ): Promise<SessionInfo[]> {
    console.log(
      '🔍 AttendanceService.getSessionsForDate: Fetching sessions for date:',
      {
        cohortId,
        epicId,
        sessionDate,
      }
    );

    // Get cohort to know sessions_per_day
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('sessions_per_day')
      .eq('id', cohortId)
      .single();

    console.log(
      '🔍 AttendanceService.getSessionsForDate: Cohort query result:',
      {
        data: cohort,
        error: cohortError,
        sessionsPerDay: cohort?.sessions_per_day,
      }
    );

    if (cohortError) {
      console.error(
        '❌ AttendanceService.getSessionsForDate: Cohort query error:',
        cohortError
      );
      throw cohortError;
    }

    // Generate session info for all sessions of the day
    const sessions: SessionInfo[] = [];
    console.log(
      `🔄 AttendanceService.getSessionsForDate: Generating ${cohort.sessions_per_day} sessions...`
    );

    for (let i = 1; i <= cohort.sessions_per_day; i++) {
      const isCancelled = await this.isSessionCancelled(
        cohortId,
        epicId,
        i,
        sessionDate
      );
      sessions.push({
        sessionNumber: i,
        sessionDate,
        isCancelled,
      });
    }

    console.log(
      '✅ AttendanceService.getSessionsForDate: Successfully generated sessions:',
      {
        count: sessions.length,
        sessions: sessions.map(session => ({
          sessionNumber: session.sessionNumber,
          sessionDate: session.sessionDate,
          isCancelled: session.isCancelled,
        })),
      }
    );

    return sessions;
  }

  // Get attendance data for a specific session
  static async getSessionAttendanceData(
    cohortId: string,
    epicId: string,
    sessionNumber: number,
    sessionDate: string
  ): Promise<AttendanceData> {
    // Get session info
    const isCancelled = await this.isSessionCancelled(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );
    const sessionInfo: SessionInfo = {
      sessionNumber,
      sessionDate,
      isCancelled,
    };

    // Get students for the cohort
    const { data: students, error: studentsError } = await supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .neq('dropped_out_status', 'dropped_out');

    if (studentsError) throw studentsError;

    // Get attendance records
    const records = await this.getSessionAttendance(
      cohortId,
      epicId,
      sessionNumber,
      sessionDate
    );

    return {
      sessionInfo,
      records,
      students: students || [],
    };
  }

  // Get epic attendance data
  static async getEpicAttendance(
    cohortId: string,
    epicId: string,
    startDate?: string,
    endDate?: string
  ): Promise<EpicAttendanceData> {
    // Get epic details
    const { data: epic, error: epicError } = await supabase
      .from('cohort_epics')
      .select('*')
      .eq('id', epicId)
      .single();

    if (epicError) throw epicError;

    // Get attendance summary
    let summaryQuery = supabase
      .from('attendance_summary')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .order('session_date', { ascending: false });

    if (startDate) {
      summaryQuery = summaryQuery.gte('session_date', startDate);
    }
    if (endDate) {
      summaryQuery = summaryQuery.lte('session_date', endDate);
    }

    const { data: summary, error: summaryError } = await summaryQuery;
    if (summaryError) throw summaryError;

    // Generate sessions from summary
    const sessions: SessionInfo[] = (summary || []).map(s => ({
      sessionNumber: s.session_number || 1,
      sessionDate: s.session_date || '',
      isCancelled: s.is_cancelled || false,
    }));

    return {
      epic,
      sessions,
      summary: summary || [],
    };
  }

  // Get cohort epics with active status
  static async getCohortEpics(cohortId: string): Promise<CohortEpic[]> {
    console.log(
      '🔍 AttendanceService.getCohortEpics: Starting epic fetch for cohort:',
      cohortId
    );

    try {
      const { data, error } = await supabase
        .from('cohort_epics')
        .select(
          `
          *,
          epic:epics(*)
        `
        )
        .eq('cohort_id', cohortId)
        .order('position', { ascending: true });

      console.log(
        '🔍 AttendanceService.getCohortEpics: Supabase query result:',
        {
          data: data,
          error: error,
          dataLength: data?.length || 0,
        }
      );

      if (error) {
        console.error(
          '❌ AttendanceService.getCohortEpics: Supabase error:',
          error
        );
        throw error;
      }

      const result = data || [];
      console.log(
        '✅ AttendanceService.getCohortEpics: Successfully fetched epics:',
        {
          count: result.length,
          epics: result.map(epic => ({
            id: epic.id,
            name: epic.epic?.name || 'Unknown',
            is_active: epic.is_active,
            position: epic.position,
          })),
        }
      );

      return result;
    } catch (err) {
      console.error(
        '❌ AttendanceService.getCohortEpics: Unexpected error:',
        err
      );
      throw err;
    }
  }

  // Set epic as active
  static async setEpicActive(epicId: string): Promise<void> {
    // First, set all epics in the cohort as inactive
    const { data: epic } = await supabase
      .from('cohort_epics')
      .select('cohort_id')
      .eq('id', epicId)
      .single();

    if (epic) {
      await supabase
        .from('cohort_epics')
        .update({ is_active: false })
        .eq('cohort_id', epic.cohort_id);
    }

    // Then set the selected epic as active
    const { error } = await supabase
      .from('cohort_epics')
      .update({ is_active: true })
      .eq('id', epicId);

    if (error) throw error;
  }

  // Get attendance summary for a date range
  static async getAttendanceSummary(
    cohortId: string,
    epicId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceSummary[]> {
    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
