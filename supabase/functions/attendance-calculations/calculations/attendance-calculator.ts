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
    console.log('🔄 getEpicStats called with params:', params);
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

  // Get calendar data for a month using optimized database function
  async getCalendarData(params: CalendarDataParams): Promise<CalendarData> {
    const { cohortId, epicId, month } = params;

    console.log('🔍 getCalendarData called with:', { cohortId, epicId, month });

    try {
      // Use the optimized database function instead of fetching all records
      const { data: records, error: recordsError } = await this.supabase
        .rpc('get_attendance_calendar_data', {
          p_cohort_id: cohortId,
          p_epic_id: epicId,
          p_month: month
        });

      if (recordsError) {
        console.error('❌ Error fetching calendar data:', recordsError);
        throw recordsError;
      }

      console.log('🔍 Calendar data fetched from database function:', records?.length || 0);

      console.log('📊 Found attendance sessions:', records?.length || 0);
      if (records && records.length > 0) {
        console.log('📊 Sample records:', records.slice(0, 3));
        console.log('📊 Date range in records:', {
          earliest: records[0]?.session_date,
          latest: records[records.length - 1]?.session_date,
        });
      }

      // Parse month to get date range for calendar generation
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay.toString().padStart(2, '0')}`;

      // Get holidays for the month
      const holidays = await this.getHolidaysForMonth(cohortId, month);

      // Group session summaries by date (optimized - no individual record processing)
      const sessionsByDate = new Map<string, any[]>();
      (records || []).forEach(sessionSummary => {
        const date = sessionSummary.session_date;

        if (!sessionsByDate.has(date)) {
          sessionsByDate.set(date, []);
        }

        // Convert aggregated data to session format expected by frontend
        // Convert BIGINT values to numbers
        const totalStudents = Number(sessionSummary.total_students);
        const presentCount = Number(sessionSummary.present_count);
        const lateCount = Number(sessionSummary.late_count);
        const absentCount = Number(sessionSummary.absent_count);
        const attendancePercentage = Number(sessionSummary.attendance_percentage);
        
        sessionsByDate.get(date)!.push({
          sessionNumber: sessionSummary.session_number,
          sessionDate: sessionSummary.session_date,
          totalStudents: totalStudents,
          presentCount: presentCount,
          lateCount: lateCount,
          absentCount: absentCount,
          exemptedCount: 0, // Not tracked in current aggregation
          attendedCount: presentCount + lateCount,
          attendancePercentage: attendancePercentage,
          isCancelled: false,
          breakdown: {
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            exempted: 0,
            regularAbsent: absentCount,
            attended: presentCount + lateCount,
            total: totalStudents,
            percentage: attendancePercentage,
          },
          absenceBreakdown: {
            uninformed: 0, // Would need additional query for detailed breakdown
          },
        });
      });

      // Generate calendar days
      const days: any[] = [];
      const currentDate = new Date(startDate);
      const endOfMonth = new Date(endDate);

      while (currentDate <= endOfMonth) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const daySessions = sessionsByDate.get(dateStr) || [];

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
    } catch (error) {
      console.error('❌ Error in getCalendarData:', error);
      throw error;
    }
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
      // Get streaks for all students using the SAME data fetching strategy as leaderboard
      const { data: students, error } = await this.supabase
        .from('cohort_students')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('dropped_out_status', 'active');

      if (error) throw error;

      // Get all attendance records at once (same as calculateStudentStatsForEpic)
      const { data: records, error: recordsError } = await this.supabase
        .from('attendance_records')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: false });

      if (recordsError) throw recordsError;

      // Calculate streaks for all students using the same records
      const streaks = students.map(student => {
        const studentRecords = (records || []).filter(
          r => r.student_id === student.id
        );
        const currentStreak = this.calculateCurrentStreak(studentRecords);
        const longestStreak = this.calculateLongestStreak(studentRecords);
        const lastAttendanceDate =
          studentRecords.length > 0 ? studentRecords[0].session_date : '';

        console.log(
          `🔍 Student ${student.first_name} ${student.last_name}: currentStreak=${currentStreak}, records=${studentRecords.length}`
        );

        return {
          student: {
            first_name: student.first_name,
            last_name: student.last_name,
          },
          currentStreak,
          longestStreak,
          lastAttendanceDate,
        };
      });

      // Find top streak
      const maxStreak = Math.max(...streaks.map(s => s.currentStreak));
      const topStreakStudents = streaks
        .filter(s => s.currentStreak === maxStreak)
        .map(s => s.student.first_name + ' ' + s.student.last_name);

      console.log(
        '🔍 getStudentStreaks: All streaks calculated:',
        streaks.map(s => ({
          name: `${s.student.first_name} ${s.student.last_name}`,
          currentStreak: s.currentStreak,
        }))
      );
      console.log('🔍 getStudentStreaks: Max streak found:', maxStreak);
      console.log(
        '🔍 getStudentStreaks: Students with max streak:',
        topStreakStudents.length
      );
      console.log('🔍 getStudentStreaks: Student names:', topStreakStudents);

      // Debug: Check if we're missing students with streak 22
      const studentsWith22 = streaks.filter(s => s.currentStreak === 22);
      console.log(
        '🔍 getStudentStreaks: Students with streak 22:',
        studentsWith22.length
      );
      console.log(
        '🔍 getStudentStreaks: Names of students with streak 22:',
        studentsWith22.map(
          s => `${s.student.first_name} ${s.student.last_name}`
        )
      );

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
    // Use the EXACT same data source as the leaderboard
    const studentStats = await this.calculateStudentStatsForEpic(
      cohortId,
      epicId
    );

    // Find the maximum current streak
    const maxStreak = Math.max(...studentStats.map(s => s.currentStreak));

    // Get all students with the maximum streak
    const topStreakStudents = studentStats
      .filter(s => s.currentStreak === maxStreak)
      .map(s => `${s.student.first_name} ${s.student.last_name}`);

    console.log('🔍 calculateTopStreak: Using leaderboard data');
    console.log('🔍 calculateTopStreak: Max streak found:', maxStreak);
    console.log(
      '🔍 calculateTopStreak: Students with max streak:',
      topStreakStudents.length
    );
    console.log('🔍 calculateTopStreak: Student names:', topStreakStudents);

    return {
      value: maxStreak,
      studentNames: topStreakStudents,
    };
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
