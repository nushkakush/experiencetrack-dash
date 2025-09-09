import type {
  SessionStatsParams,
  EpicStatsParams,
  CalendarDataParams,
  LeaderboardParams,
  StudentStatsParams,
  StudentStreaksParams,
  PublicLeaderboardParams,
  SessionStats,
  EpicStats,
  CalendarData,
  LeaderboardData,
  StudentStats,
  StudentStreaksData,
  AttendanceRecord,
  CohortStudent,
  CohortEpic,
} from '../types.ts';

export class AttendanceCalculator {
  constructor(
    private supabase: any,
    private userToken?: string | null
  ) {}

  // Core calculation method for individual student attendance
  private calculateAttendanceBreakdown(records: AttendanceRecord[]) {
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const exempted = records.filter(
      r => r.status === 'absent' && r.absence_type === 'exempted'
    ).length;
    const regularAbsent = records.filter(
      r => r.status === 'absent' && r.absence_type !== 'exempted'
    ).length;

    const attended = present + late + exempted;
    // For individual student calculations, use records.length (total sessions for that student)
    const total = records.length;
    const percentage = total > 0 ? (attended / total) * 100 : 0;

    return {
      present,
      late,
      absent: regularAbsent,
      exempted,
      regularAbsent,
      attended,
      total,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  // Cohort-level calculation method for overall statistics
  private calculateCohortAttendanceBreakdown(
    records: AttendanceRecord[],
    totalStudents: number
  ) {
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const exempted = records.filter(
      r => r.status === 'absent' && r.absence_type === 'exempted'
    ).length;
    const regularAbsent = records.filter(
      r => r.status === 'absent' && r.absence_type !== 'exempted'
    ).length;

    const attended = present + late + exempted;

    // Calculate average session attendance percentage
    const uniqueSessions = new Set(
      records.map(r => `${r.session_date}-${r.session_number}`)
    );

    if (uniqueSessions.size === 0) {
      return {
        present,
        late,
        absent: regularAbsent,
        exempted,
        regularAbsent,
        attended,
        total: 0,
        percentage: 0,
      };
    }

    // Group records by session and calculate attendance for each session
    const sessionGroups = new Map<string, AttendanceRecord[]>();
    records.forEach(record => {
      const sessionKey = `${record.session_date}-${record.session_number}`;
      if (!sessionGroups.has(sessionKey)) {
        sessionGroups.set(sessionKey, []);
      }
      sessionGroups.get(sessionKey)!.push(record);
    });

    // Calculate average session attendance percentage
    let totalSessionAttendance = 0;
    let sessionCount = 0;

    sessionGroups.forEach(sessionRecords => {
      const sessionPresent = sessionRecords.filter(
        r => r.status === 'present'
      ).length;
      const sessionLate = sessionRecords.filter(
        r => r.status === 'late'
      ).length;
      const sessionExempted = sessionRecords.filter(
        r => r.status === 'absent' && r.absence_type === 'exempted'
      ).length;
      const sessionAttended = sessionPresent + sessionLate + sessionExempted;
      const sessionTotal = sessionRecords.length;

      if (sessionTotal > 0) {
        const sessionPercentage = (sessionAttended / sessionTotal) * 100;
        totalSessionAttendance += sessionPercentage;
        sessionCount++;
      }
    });

    const averagePercentage =
      sessionCount > 0 ? totalSessionAttendance / sessionCount : 0;

    return {
      present,
      late,
      absent: regularAbsent,
      exempted,
      regularAbsent,
      attended,
      total: records.length, // Total attendance records
      percentage: Math.round(averagePercentage * 100) / 100,
    };
  }

  // Calculate current streak for a student
  private calculateCurrentStreak(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0;

    // Sort by date descending (most recent first)
    const sortedRecords = records.sort(
      (a, b) =>
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );

    let streak = 0;
    for (const record of sortedRecords) {
      // Count present, late, and exempted as attended for streak
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        (record.status === 'absent' && record.absence_type === 'exempted')
      ) {
        streak++;
      } else {
        break; // Streak ends on first absence
      }
    }

    return streak;
  }

  // Get session statistics
  async getSessionStats(params: SessionStatsParams): Promise<SessionStats> {
    const { cohortId, epicId, sessionDate, sessionNumber } = params;

    // Get attendance records for this session
    console.log('Debug - Query parameters:', {
      cohortId,
      epicId,
      sessionDate,
      sessionNumber,
    });

    const { data: records, error } = await this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('session_date', sessionDate)
      .eq('session_number', sessionNumber);

    console.log('Debug - Query returned records:', records?.length || 0);
    console.log('Debug - Query error:', error);

    if (error) throw error;

    // Get total students in cohort
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    const totalStudents = students.length;
    const breakdown = this.calculateCohortAttendanceBreakdown(
      records || [],
      totalStudents
    );
    const absenceBreakdown = this.calculateAbsenceBreakdown(records || []);

    // Check if session is cancelled (no records but students exist)
    const isCancelled = totalStudents > 0 && (records || []).length === 0;

    return {
      sessionNumber,
      sessionDate,
      totalStudents,
      presentCount: breakdown.present,
      lateCount: breakdown.late,
      absentCount: breakdown.regularAbsent,
      exemptedCount: breakdown.exempted,
      attendedCount: breakdown.attended,
      attendancePercentage: breakdown.percentage,
      isCancelled,
      breakdown,
      absenceBreakdown,
    };
  }

  // Get epic statistics
  async getEpicStats(params: EpicStatsParams): Promise<EpicStats> {
    const { cohortId, epicId, dateFrom, dateTo } = params;

    // Build query
    let query = this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId);

    if (dateFrom) {
      query = query.gte('session_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('session_date', dateTo);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Get total students
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    const totalStudents = students.length;
    const breakdown = this.calculateCohortAttendanceBreakdown(
      records || [],
      totalStudents
    );

    // Calculate unique sessions
    const uniqueSessions = new Set(
      (records || []).map(r => `${r.session_date}-${r.session_number}`)
    );

    // Calculate students with perfect attendance (100%)
    const studentStats = await this.calculateStudentStatsForEpic(
      cohortId,
      epicId,
      dateFrom,
      dateTo
    );
    const studentsWithPerfectAttendance = studentStats.filter(
      s => s.attendancePercentage === 100
    ).length;
    const studentsWithPoorAttendance = studentStats.filter(
      s => s.attendancePercentage < 60
    ).length;

    // Calculate absence breakdown
    const absenceBreakdown = this.calculateAbsenceBreakdown(records || []);

    // Calculate top streak data
    const topStreakData = await this.calculateTopStreak(cohortId, epicId);

    // Calculate epic status
    const epicStatus = this.calculateEpicStatus(breakdown.percentage);

    return {
      totalStudents,
      totalSessions: uniqueSessions.size,
      attendanceBreakdown: {
        present: breakdown.present,
        late: breakdown.late,
        absent: breakdown.regularAbsent,
        exempted: breakdown.exempted,
        attended: breakdown.attended,
        total: uniqueSessions.size * totalStudents,
        attendancePercentage: breakdown.percentage,
      },
      absenceBreakdown: {
        uninformed: absenceBreakdown.uninformed,
      },
      topStreakData: {
        value: topStreakData.value,
        studentNames: topStreakData.studentNames,
      },
      epicStatus: {
        text: epicStatus.text,
        variant: epicStatus.variant,
      },
      studentsWithPerfectAttendance,
      studentsWithPoorAttendance,
      sessionsCancelled: 0, // TODO: Implement sessions cancelled logic
      dateRange: {
        from: dateFrom || new Date().toISOString().split('T')[0],
        to: dateTo || new Date().toISOString().split('T')[0],
      },
    };
  }

  // Get calendar data for a month
  async getCalendarData(params: CalendarDataParams): Promise<CalendarData> {
    const { cohortId, epicId, month } = params;

    console.log('🔍 getCalendarData called with:', { cohortId, epicId, month });

    // Check authentication context (optional for service role)
    console.log('🔍 Using service role for database access, bypassing RLS');

    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      console.log('🔍 Auth context:', {
        user: user ? { id: user.id, email: user.email } : null,
        authError,
        hasServiceRole: true,
      });

      // Check user profile and role (optional)
      if (user) {
        const { data: profile, error: profileError } = await this.supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        console.log('🔍 User profile:', { profile, profileError });
      }
    } catch (authCheckError) {
      console.log(
        '🔍 Auth check failed, continuing with service role:',
        authCheckError
      );
    }

    // Parse month to get date range
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    // Get last day of the month - use monthNum (not monthNum-1) because we want the last day of the current month
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

    // Debug: Let's verify the date range calculation
    console.log('🔍 Date range debug:', {
      year: parseInt(year),
      monthNum: parseInt(monthNum),
      lastDay,
      startDate,
      endDate,
      testDate: new Date(parseInt(year), parseInt(monthNum), 0).toISOString(),
    });

    console.log('📅 Date range calculated:', { startDate, endDate, lastDay });

    // Get all attendance records for the month
    // Use service role to bypass RLS if needed
    const query = this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });

    console.log('🔍 Executing query with params:', {
      cohortId,
      epicId,
      startDate,
      endDate,
      queryString: query.toString(),
    });

    // Get total students count for accurate percentage calculation
    const { data: students, error: calendarStudentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (calendarStudentsError) {
      console.error('❌ Error fetching students:', calendarStudentsError);
      throw calendarStudentsError;
    }

    const calendarTotalStudents = students.length;
    console.log('🔍 Total students in cohort:', calendarTotalStudents);

    // Get all attendance records for the month
    const { data: attendanceRecords, error: recordsError } = await this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });

    if (recordsError) {
      console.error('❌ Error fetching attendance records:', recordsError);
      throw recordsError;
    }

    console.log(
      '🔍 Attendance records fetched:',
      attendanceRecords?.length || 0
    );

    // Group records by session date and session number
    const sessionGroups = new Map<string, any[]>();
    (attendanceRecords || []).forEach(record => {
      const key = `${record.session_date}_${record.session_number}`;
      if (!sessionGroups.has(key)) {
        sessionGroups.set(key, []);
      }
      sessionGroups.get(key)!.push(record);
    });

    // Calculate session summaries
    const sessionSummaries = Array.from(sessionGroups.entries()).map(
      ([key, records]) => {
        const [sessionDate, sessionNumber] = key.split('_');
        const breakdown = this.calculateCohortAttendanceBreakdown(
          records,
          calendarTotalStudents
        );

        return {
          session_date: sessionDate,
          session_number: parseInt(sessionNumber),
          total_students: calendarTotalStudents,
          present_count: breakdown.present,
          late_count: breakdown.late,
          absent_count: breakdown.regularAbsent,
          attendance_percentage: breakdown.percentage,
        };
      }
    );

    console.log('🔍 Optimized query results:', {
      totalSessions: sessionSummaries?.length || 0,
      august21to31Count:
        sessionSummaries?.filter(
          s => s.session_date >= '2025-08-21' && s.session_date <= '2025-08-31'
        ).length || 0,
    });

    // For compatibility with existing code, assign sessionSummaries to records
    const records = sessionSummaries;

    console.log('📊 Found attendance sessions:', records?.length || 0);
    if (records && records.length > 0) {
      console.log('📊 Sample records:', records.slice(0, 3));
      console.log('📊 Date range in records:', {
        earliest: records[0]?.session_date,
        latest: records[records.length - 1]?.session_date,
      });

      // Check specifically for records in the last two weeks
      const lastTwoWeeksRecords = records.filter(record => {
        const recordDate = new Date(record.session_date);
        const recordDay = recordDate.getDate();
        return recordDay >= 15; // Last two weeks of month
      });
      console.log(
        '📊 Records in last two weeks (days 15-31):',
        lastTwoWeeksRecords.length
      );
      if (lastTwoWeeksRecords.length > 0) {
        console.log(
          '📊 Last two weeks sample records:',
          lastTwoWeeksRecords.slice(0, 3)
        );
      }

      // Check specifically for August 21-31 records
      const august21to31Records = records.filter(record => {
        const recordDate = record.session_date; // Use string comparison directly
        return recordDate >= '2025-08-21' && recordDate <= '2025-08-31';
      });
      console.log(
        '📊 Records for August 21-31 (string comparison):',
        august21to31Records.length
      );
      if (august21to31Records.length > 0) {
        console.log(
          '📊 August 21-31 sample records:',
          august21to31Records.slice(0, 5)
        );
        console.log(
          '📊 August 21-31 unique dates:',
          [...new Set(august21to31Records.map(r => r.session_date))].sort()
        );
      }

      // Also check with date parsing
      const august21to31RecordsDateParsed = records.filter(record => {
        const recordDate = new Date(record.session_date);
        const recordDay = recordDate.getDate();
        const recordMonth = recordDate.getMonth() + 1; // 0-indexed
        return recordMonth === 8 && recordDay >= 21 && recordDay <= 31;
      });
      console.log(
        '📊 Records for August 21-31 (date parsing):',
        august21to31RecordsDateParsed.length
      );
    } else {
      console.log('❌ No attendance records found for the month');
      console.log('🔍 Query parameters:', {
        cohortId,
        epicId,
        startDate,
        endDate,
      });
    }

    // Get holidays for the month
    const holidays = await this.getHolidaysForMonth(cohortId, month);

    // Group session summaries by date (optimized - no individual record processing)
    const sessionsByDate = new Map<string, any[]>();
    (records || []).forEach(sessionSummary => {
      const date = sessionSummary.session_date;

      // Debug specific dates that should have data
      if (date >= '2025-08-18' && date <= '2025-08-29') {
        console.log(
          `🔍 Processing session for ${date}: session ${sessionSummary.session_number}, ${sessionSummary.total_students} students, ${sessionSummary.attendance_percentage}% attendance`
        );
      }

      if (!sessionsByDate.has(date)) {
        sessionsByDate.set(date, []);
      }

      // Convert aggregated data to session format expected by frontend
      sessionsByDate.get(date)!.push({
        sessionNumber: sessionSummary.session_number,
        sessionDate: sessionSummary.session_date,
        totalStudents: sessionSummary.total_students,
        presentCount: sessionSummary.present_count,
        lateCount: sessionSummary.late_count,
        absentCount: sessionSummary.absent_count,
        exemptedCount: 0, // Not tracked in current aggregation
        attendedCount: sessionSummary.present_count + sessionSummary.late_count,
        attendancePercentage: sessionSummary.attendance_percentage,
        isCancelled: false,
        breakdown: {
          present: sessionSummary.present_count,
          late: sessionSummary.late_count,
          absent: sessionSummary.absent_count,
          exempted: 0,
          regularAbsent: sessionSummary.absent_count,
          attended: sessionSummary.present_count + sessionSummary.late_count,
          total: sessionSummary.total_students,
          percentage: sessionSummary.attendance_percentage,
        },
        absenceBreakdown: {
          uninformed: 0, // Would need additional query for detailed breakdown
        },
      });
    });

    // Debug: Check if sessionsByDate has the expected dates
    console.log(
      '🔍 sessionsByDate keys:',
      Array.from(sessionsByDate.keys()).sort()
    );
    console.log('🔍 sessionsByDate size:', sessionsByDate.size);

    // Check specifically for August 21-29
    const august21to29Keys = Array.from(sessionsByDate.keys()).filter(
      date => date >= '2025-08-21' && date <= '2025-08-29'
    );
    console.log('🔍 August 21-29 keys in sessionsByDate:', august21to29Keys);

    if (august21to29Keys.length > 0) {
      august21to29Keys.forEach(date => {
        const daySessions = sessionsByDate.get(date) || [];
        console.log(`🔍 ${date}: ${daySessions.length} sessions`);
      });
    }

    // Generate calendar days
    const days: any[] = [];
    const currentDate = new Date(startDate);
    const endOfMonth = new Date(endDate);

    console.log(
      '📅 Generating calendar days from:',
      currentDate.toISOString().split('T')[0],
      'to:',
      endOfMonth.toISOString().split('T')[0]
    );

    // Get total students once for all sessions (optimization)
    const { data: allStudents, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError);
    }

    const totalStudents = allStudents?.length || 0;
    console.log('👥 Total active students:', totalStudents);

    while (currentDate <= endOfMonth) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const daySessions = sessionsByDate.get(dateStr) || [];

      // Log specific dates that should have data
      if (dateStr >= '2025-08-21' && dateStr <= '2025-08-31') {
        console.log(`🔍 Checking date ${dateStr}:`, {
          hasSessions: daySessions.length > 0,
          sessionCount: daySessions.length,
          sampleSessions: daySessions.slice(0, 2),
        });
      }

      // Sessions are already pre-aggregated - no need for individual record processing!
      const sessions: SessionStats[] = daySessions.map(sessionData => ({
        sessionNumber: sessionData.sessionNumber,
        sessionDate: sessionData.sessionDate,
        totalStudents: sessionData.totalStudents,
        presentCount: sessionData.presentCount,
        lateCount: sessionData.lateCount,
        absentCount: sessionData.absentCount,
        exemptedCount: sessionData.exemptedCount,
        attendedCount: sessionData.attendedCount,
        attendancePercentage: sessionData.attendancePercentage,
        isCancelled: sessionData.isCancelled,
        breakdown: sessionData.breakdown,
        absenceBreakdown: sessionData.absenceBreakdown,
      }));

      // Calculate overall attendance for the day from aggregated session data
      const overallAttendance =
        sessions.length > 0
          ? sessions.reduce(
              (sum, session) => sum + session.attendancePercentage,
              0
            ) / sessions.length
          : 0;

      // Check if it's a holiday
      const dayHolidays = holidays.filter(h => h.date === dateStr);
      const isHoliday = dayHolidays.length > 0;

      days.push({
        date: dateStr,
        sessions,
        totalSessions: sessions.length,
        overallAttendance,
        isHoliday,
        holidays: dayHolidays,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate monthly stats
    const daysWithAttendance = days.filter(d => d.totalSessions > 0).length;
    const totalSessions = days.reduce((sum, day) => sum + day.totalSessions, 0);
    const averageAttendance =
      days.length > 0
        ? days.reduce((sum, day) => sum + day.overallAttendance, 0) /
          days.length
        : 0;

    return {
      month,
      days,
      monthlyStats: {
        daysWithAttendance,
        totalSessions,
        averageAttendance: Math.round(averageAttendance * 100) / 100,
      },
    };
  }

  // Get leaderboard data
  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardData> {
    const { cohortId, epicId, limit = 50, offset = 0 } = params;

    console.log('🔄 getLeaderboard called with:', {
      cohortId,
      epicId,
      limit,
      offset,
    });

    // Get epic info
    const { data: epic, error: epicError } = await this.supabase
      .from('cohort_epics')
      .select('*')
      .eq('id', epicId)
      .single();

    if (epicError) throw epicError;

    console.log('✅ Epic found:', epic);

    // Calculate student stats
    const studentStats = await this.calculateStudentStatsForEpic(
      cohortId,
      epicId
    );

    // Sort by attendance percentage (descending), then by streak (descending)
    studentStats.sort((a, b) => {
      if (b.attendancePercentage !== a.attendancePercentage) {
        return b.attendancePercentage - a.attendancePercentage;
      }
      return b.currentStreak - a.currentStreak;
    });

    // Assign ranks with proper tie handling
    let currentRank = 1;
    let currentIndex = 0;

    while (currentIndex < studentStats.length) {
      const currentStat = studentStats[currentIndex];
      let tiedCount = 1;

      // Count how many students have the same attendance percentage and streak
      for (let i = currentIndex + 1; i < studentStats.length; i++) {
        const nextStat = studentStats[i];
        if (
          nextStat.attendancePercentage === currentStat.attendancePercentage &&
          nextStat.currentStreak === currentStat.currentStreak
        ) {
          tiedCount++;
        } else {
          break;
        }
      }

      // Assign the same rank to all tied students
      for (let i = 0; i < tiedCount; i++) {
        const student = studentStats[currentIndex + i];
        student.rank = currentRank;
        student.badge =
          currentRank <= 3 ? ['🥇', '🥈', '🥉'][currentRank - 1] : undefined;
      }

      // Move to next rank and next group of students
      currentRank += 1;
      currentIndex += tiedCount;
    }

    // Apply pagination
    const paginatedStats = studentStats.slice(offset, offset + limit);

    return {
      entries: paginatedStats.map(stat => ({
        student: stat.student,
        attendancePercentage: stat.attendancePercentage,
        currentStreak: stat.currentStreak,
        totalSessions: stat.totalSessions,
        presentSessions: stat.presentSessions,
        rank: stat.rank,
        badge: stat.badge,
      })),
      totalStudents: studentStats.length,
      epicInfo: {
        id: epic.id,
        name: epic.name,
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  // Get student statistics
  async getStudentStats(params: StudentStatsParams): Promise<StudentStats> {
    const { cohortId, studentId, epicId, dateFrom, dateTo } = params;

    // Get student info
    const { data: student, error: studentError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Get student's attendance records
    let query = this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('student_id', studentId);

    if (dateFrom) {
      query = query.gte('session_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('session_date', dateTo);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    // Get total students for accurate percentage calculation
    const { data: allStudents, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;
    const totalStudents = allStudents.length;

    // Calculate stats
    const breakdown = this.calculateAttendanceBreakdown(records || []);
    const currentStreak = this.calculateCurrentStreak(records || []);

    // Calculate rank
    const allStudentStats = await this.calculateStudentStatsForEpic(
      cohortId,
      epicId,
      dateFrom,
      dateTo
    );
    const studentRank =
      allStudentStats.find(s => s.student.id === studentId)?.rank || 0;

    return {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
      },
      attendancePercentage: breakdown.percentage,
      currentStreak,
      totalSessions: breakdown.total,
      presentSessions: breakdown.present,
      lateSessions: breakdown.late,
      absentSessions: breakdown.regularAbsent,
      exemptedSessions: breakdown.exempted,
      rank: studentRank,
      rankOutOf: allStudentStats.length,
      epicInfo: {
        id: epicId,
        name: 'Epic Name', // Would need to fetch epic name
      },
    };
  }

  // Get student streaks
  async getStudentStreaks(
    params: StudentStreaksParams
  ): Promise<StudentStreaksData> {
    const { cohortId, epicId, studentId } = params;

    if (studentId) {
      // Get streaks for specific student
      const studentStats = await this.getStudentStats({
        cohortId,
        studentId,
        epicId,
      });
      const streak = await this.calculateStudentStreak(
        cohortId,
        epicId,
        studentId
      );

      return {
        streaks: [streak],
        topStreak: {
          value: streak.currentStreak,
          studentNames: [
            streak.student.first_name + ' ' + streak.student.last_name,
          ],
        },
        averageStreak: streak.currentStreak,
      };
    } else {
      // Get streaks for all students
      const { data: students, error } = await this.supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('dropped_out_status', 'active');

      if (error) throw error;

      const streaks = await Promise.all(
        students.map(student =>
          this.calculateStudentStreak(cohortId, epicId, student.id)
        )
      );

      // Find top streak
      const maxStreak = Math.max(...streaks.map(s => s.currentStreak));
      const topStreakStudents = streaks
        .filter(s => s.currentStreak === maxStreak)
        .map(s => s.student.first_name + ' ' + s.student.last_name);

      const averageStreak =
        streaks.length > 0
          ? streaks.reduce((sum, s) => sum + s.currentStreak, 0) /
            streaks.length
          : 0;

      return {
        streaks,
        topStreak: {
          value: maxStreak,
          studentNames: topStreakStudents,
        },
        averageStreak: Math.round(averageStreak * 100) / 100,
      };
    }
  }

  // Get public leaderboard (same as regular leaderboard but with privacy controls)
  async getPublicLeaderboard(
    params: PublicLeaderboardParams
  ): Promise<LeaderboardData> {
    // For now, return the same as regular leaderboard
    // In the future, this could include privacy controls, anonymized data, etc.
    return await this.getLeaderboard(params);
  }

  // Helper method to calculate student stats for an epic
  private async calculateStudentStatsForEpic(
    cohortId: string,
    epicId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    console.log('🔄 calculateStudentStatsForEpic called with:', {
      cohortId,
      epicId,
      dateFrom,
      dateTo,
    });

    // Get all students
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    console.log('✅ Students found:', students?.length || 0);

    // Get all attendance records for the epic
    let query = this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId);

    if (dateFrom) {
      query = query.gte('session_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('session_date', dateTo);
    }

    const { data: records, error } = await query;
    if (error) throw error;

    console.log('✅ Attendance records found:', records?.length || 0);
    console.log(
      '📊 Sample records:',
      records?.slice(0, 3).map(r => ({
        student_id: r.student_id,
        status: r.status,
        absence_type: r.absence_type,
        session_date: r.session_date,
      }))
    );

    // Calculate stats for each student
    const totalStudents = students.length;
    const studentStats = students.map(student => {
      const studentRecords = (records || []).filter(
        r => r.student_id === student.id
      );
      const breakdown = this.calculateAttendanceBreakdown(studentRecords);
      const currentStreak = this.calculateCurrentStreak(studentRecords);

      return {
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          attendance_records: studentRecords, // Include attendance records for the leaderboard
        },
        attendancePercentage: breakdown.percentage,
        currentStreak,
        totalSessions: breakdown.total,
        presentSessions: breakdown.attended, // Includes present, late, exempted
        rank: 0, // Will be set after sorting
      };
    });

    return studentStats;
  }

  // Helper method to calculate streak for a specific student
  private async calculateStudentStreak(
    cohortId: string,
    epicId: string,
    studentId: string
  ): Promise<any> {
    // Get student info
    const { data: student, error: studentError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Get student's attendance records
    const { data: records, error } = await this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('student_id', studentId)
      .order('session_date', { ascending: false });

    if (error) throw error;

    const currentStreak = this.calculateCurrentStreak(records || []);
    const longestStreak = this.calculateLongestStreak(records || []);
    const lastAttendanceDate =
      records && records.length > 0 ? records[0].session_date : '';

    return {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
      },
      currentStreak,
      longestStreak,
      lastAttendanceDate,
      streakHistory: (records || []).map(r => ({
        date: r.session_date,
        status:
          r.status === 'absent' && r.absence_type === 'exempted'
            ? 'exempted'
            : r.status,
      })),
    };
  }

  // Helper method to calculate longest streak
  private calculateLongestStreak(records: AttendanceRecord[]): number {
    if (records.length === 0) return 0;

    // Sort by date ascending
    const sortedRecords = records.sort(
      (a, b) =>
        new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    let longestStreak = 0;
    let currentStreak = 0;

    for (const record of sortedRecords) {
      if (
        record.status === 'present' ||
        record.status === 'late' ||
        (record.status === 'absent' && record.absence_type === 'exempted')
      ) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return longestStreak;
  }

  // Helper method to get holidays for a month
  private async getHolidaysForMonth(
    cohortId: string,
    month: string
  ): Promise<any[]> {
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
      .toISOString()
      .split('T')[0];

    // Get global holidays
    const { data: globalHolidays, error: globalError } = await this.supabase
      .from('holidays')
      .select('*')
      .eq('holiday_type', 'global')
      .eq('status', 'published')
      .gte('date', startDate)
      .lte('date', endDate);

    if (globalError) throw globalError;

    // Get cohort-specific holidays
    const { data: cohortHolidays, error: cohortError } = await this.supabase
      .from('holidays')
      .select('*')
      .eq('holiday_type', 'cohort_specific')
      .eq('cohort_id', cohortId)
      .eq('status', 'published')
      .gte('date', startDate)
      .lte('date', endDate);

    if (cohortError) throw cohortError;

    return [...(globalHolidays || []), ...(cohortHolidays || [])];
  }

  // Helper method to calculate absence breakdown
  private calculateAbsenceBreakdown(records: AttendanceRecord[]) {
    console.log(
      'Debug - calculateAbsenceBreakdown called with records:',
      records.length
    );

    const absentRecords = records.filter(r => r.status === 'absent');
    console.log('Debug - absent records:', absentRecords.length);

    const uninformed = records.filter(
      r =>
        r.status === 'absent' &&
        (!r.absence_type || r.absence_type === 'uninformed')
    ).length;

    console.log('Debug - uninformed count:', uninformed);
    console.log(
      'Debug - absent records details:',
      absentRecords.map(r => ({
        id: r.id,
        status: r.status,
        absence_type: r.absence_type,
        student_id: r.student_id,
      }))
    );

    return { uninformed };
  }

  // Helper method to calculate top streak across all students
  private async calculateTopStreak(cohortId: string, epicId: string) {
    // Get all students
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    if (students.length === 0) return { value: 0, studentNames: ['-'] };

    let topStreak = 0;
    let topStreakStudents: string[] = [];

    for (const student of students) {
      // Get student's attendance records
      const { data: studentRecords, error } = await this.supabase
        .from('attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .eq('student_id', student.id)
        .order('session_date', { ascending: false });

      if (error) throw error;

      // Calculate current streak for this student
      const currentStreak = this.calculateCurrentStreak(studentRecords || []);

      // Update top streak if this student has a higher streak
      if (currentStreak > topStreak) {
        topStreak = currentStreak;
        topStreakStudents = [`${student.first_name} ${student.last_name}`];
      }
      // If this student has the same streak, add them to the list
      else if (currentStreak === topStreak && currentStreak > 0) {
        topStreakStudents.push(`${student.first_name} ${student.last_name}`);
      }
    }

    return { value: topStreak, studentNames: topStreakStudents };
  }

  // Helper method to calculate epic status
  private calculateEpicStatus(attendancePercentage: number) {
    if (attendancePercentage >= 90) {
      return { text: 'Excellent', variant: 'success' as const };
    }
    if (attendancePercentage >= 75) {
      return { text: 'Good', variant: 'info' as const };
    }
    if (attendancePercentage >= 60) {
      return { text: 'Fair', variant: 'warning' as const };
    }
    return { text: 'Needs Attention', variant: 'error' as const };
  }

  // Get drop out radar data - students with 3+ consecutive uninformed absences
  async getDropOutRadar(params: {
    cohortId: string;
    epicId: string;
  }): Promise<any> {
    const { cohortId, epicId } = params;

    // Get all students
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    const dropOutCandidates: any[] = [];

    for (const student of students) {
      // Get student's attendance records for this epic, ordered by date descending
      const { data: records, error } = await this.supabase
        .from('attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .eq('student_id', student.id)
        .order('session_date', { ascending: false });

      if (error) throw error;

      // Calculate consecutive uninformed absences from the most recent records
      const consecutiveUninformedAbsences =
        this.calculateConsecutiveUninformedAbsences(records || []);

      if (consecutiveUninformedAbsences >= 3) {
        dropOutCandidates.push({
          student: {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            phone: student.phone,
          },
          consecutiveUninformedAbsences,
          lastAttendanceDate: this.getLastAttendanceDate(records || []),
          totalAbsences: (records || []).filter(r => r.status === 'absent')
            .length,
          totalSessions: (records || []).length,
        });
      }
    }

    // Sort by consecutive uninformed absences (descending)
    dropOutCandidates.sort(
      (a, b) =>
        b.consecutiveUninformedAbsences - a.consecutiveUninformedAbsences
    );

    return {
      candidates: dropOutCandidates,
      totalCandidates: dropOutCandidates.length,
      epicInfo: {
        id: epicId,
        name: 'Epic Name', // Would need to fetch epic name
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  // Helper method to calculate consecutive uninformed absences from the most recent records
  private calculateConsecutiveUninformedAbsences(
    records: AttendanceRecord[]
  ): number {
    if (records.length === 0) return 0;

    // Records are already ordered by date descending (most recent first)
    let consecutiveCount = 0;

    for (const record of records) {
      // Check if this is an uninformed absence
      if (
        record.status === 'absent' &&
        (!record.absence_type || record.absence_type === 'uninformed')
      ) {
        consecutiveCount++;
      } else {
        // If we hit a non-uninformed absence or a present/late record, break the streak
        break;
      }
    }

    return consecutiveCount;
  }

  // Helper method to get the last attendance date
  private getLastAttendanceDate(records: AttendanceRecord[]): string | null {
    if (records.length === 0) return null;

    // Find the most recent record where student was present or late
    const attendedRecord = records.find(
      r =>
        r.status === 'present' ||
        r.status === 'late' ||
        (r.status === 'absent' && r.absence_type === 'exempted')
    );

    return attendedRecord ? attendedRecord.session_date : null;
  }
}
