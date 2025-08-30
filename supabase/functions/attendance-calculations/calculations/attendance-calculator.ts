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

  // Core calculation method - single source of truth
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
    const total = records.length;
    const percentage = total > 0 ? (attended / total) * 100 : 0;

    return {
      present,
      late,
      absent: regularAbsent, // Add missing absent property
      exempted,
      regularAbsent,
      attended,
      total,
      percentage: Math.round(percentage * 100) / 100,
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
    const { data: records, error } = await this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .eq('session_date', sessionDate)
      .eq('session_number', sessionNumber);

    if (error) throw error;

    // Get total students in cohort
    const { data: students, error: studentsError } = await this.supabase
      .from('cohort_students')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('dropped_out_status', 'active');

    if (studentsError) throw studentsError;

    const totalStudents = students.length;
    const breakdown = this.calculateAttendanceBreakdown(records || []);

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
    const breakdown = this.calculateAttendanceBreakdown(records || []);

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

    // Parse month to get date range
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
      .toISOString()
      .split('T')[0];

    // Get all attendance records for the month
    const { data: records, error } = await this.supabase
      .from('attendance_records')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });

    if (error) throw error;

    // Get holidays for the month
    const holidays = await this.getHolidaysForMonth(cohortId, month);

    // Group records by date
    const recordsByDate = new Map<string, AttendanceRecord[]>();
    (records || []).forEach(record => {
      const date = record.session_date;
      if (!recordsByDate.has(date)) {
        recordsByDate.set(date, []);
      }
      recordsByDate.get(date)!.push(record);
    });

    // Generate calendar days
    const days: any[] = [];
    const currentDate = new Date(startDate);
    const endOfMonth = new Date(endDate);

    while (currentDate <= endOfMonth) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayRecords = recordsByDate.get(dateStr) || [];

      // Group by session number
      const sessionsByNumber = new Map<number, AttendanceRecord[]>();
      dayRecords.forEach(record => {
        if (!sessionsByNumber.has(record.session_number)) {
          sessionsByNumber.set(record.session_number, []);
        }
        sessionsByNumber.get(record.session_number)!.push(record);
      });

      // Create session stats for each session
      const sessions: SessionStats[] = [];
      for (const [sessionNumber, sessionRecords] of sessionsByNumber) {
        const breakdown = this.calculateAttendanceBreakdown(sessionRecords);

        // Get total students
        const { data: students } = await this.supabase
          .from('cohort_students')
          .select('*')
          .eq('cohort_id', cohortId)
          .eq('dropped_out_status', 'active');

        sessions.push({
          sessionNumber,
          sessionDate: dateStr,
          totalStudents: students?.length || 0,
          presentCount: breakdown.present,
          lateCount: breakdown.late,
          absentCount: breakdown.regularAbsent,
          exemptedCount: breakdown.exempted,
          attendedCount: breakdown.attended,
          attendancePercentage: breakdown.percentage,
          isCancelled: false,
          breakdown,
        });
      }

      // Calculate overall attendance for the day
      const allDayRecords = dayRecords;
      const dayBreakdown = this.calculateAttendanceBreakdown(allDayRecords);
      const overallAttendance = dayBreakdown.percentage;

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
    const uninformed = records.filter(
      r =>
        r.status === 'absent' &&
        (!r.absence_type || r.absence_type === 'uninformed')
    ).length;

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
}
