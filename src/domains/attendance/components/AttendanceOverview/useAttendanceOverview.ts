/**
 * Attendance Overview Hook
 * Custom hook for attendance overview data management
 */

import { useState, useMemo, useCallback } from 'react';
import { useApiQuery } from '@/shared/hooks/useApiQuery';
import { attendanceService } from '@/domains/attendance/services/AttendanceService';
import { AttendanceSummaryStats } from './AttendanceSummaryCards';
import { AttendanceChartData } from './AttendanceChart';

interface AttendanceOverviewFilters {
  epicId: string;
  sessionType: string;
  status: string;
}

interface AttendanceOverviewOptions {
  studentId: string;
  cohortId: string;
  timeframe: 'week' | 'month' | 'semester' | 'all';
  filters: AttendanceOverviewFilters;
}

interface AttendanceRecord {
  sessionDate: string;
  epicName: string;
  sessionNumber: number;
  status: 'present' | 'absent' | 'late';
  reason?: string;
}

interface CalendarData {
  date: string;
  status: 'present' | 'absent' | 'late' | 'no-session';
  sessionCount: number;
}

export function useAttendanceOverview(options: AttendanceOverviewOptions) {
  const { studentId, cohortId, timeframe, filters } = options;
  
  // Calculate date range based on timeframe
  const dateRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'semester':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'all':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return {
      from: startDate.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    };
  }, [timeframe]);

  // Fetch attendance records
  const {
    data: attendanceRecords = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery({
    queryKey: ['attendanceOverview', studentId, timeframe, filters, dateRange],
    queryFn: async () => {
      const result = await attendanceService.getAttendanceRecords({
        studentId,
        cohortId,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        ...(filters.epicId && { epicId: filters.epicId }),
        ...(filters.status !== 'all' && { status: filters.status as any }),
        limit: 1000,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch attendance data');
      }

      // Transform to expected format
      return (result.data || []).map(record => ({
        sessionDate: record.session_date,
        epicName: record.epic_id, // Would need to resolve to epic name
        sessionNumber: record.session_number,
        status: record.status,
        reason: record.reason,
      })) as AttendanceRecord[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate summary statistics
  const summaryStats = useMemo((): AttendanceSummaryStats => {
    if (!attendanceRecords.length) {
      return {
        totalSessions: 0,
        presentSessions: 0,
        absentSessions: 0,
        lateSessions: 0,
        attendancePercentage: 0,
        trend: 'stable',
        trendPercentage: 0,
        perfectAttendanceDays: 0,
        currentStreak: 0,
      };
    }

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    
    const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;
    
    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(total / 2);
    const firstHalf = attendanceRecords.slice(0, midpoint);
    const secondHalf = attendanceRecords.slice(midpoint);
    
    const firstHalfPercentage = firstHalf.length > 0 
      ? ((firstHalf.filter(r => r.status === 'present' || r.status === 'late').length) / firstHalf.length) * 100 
      : 0;
    const secondHalfPercentage = secondHalf.length > 0 
      ? ((secondHalf.filter(r => r.status === 'present' || r.status === 'late').length) / secondHalf.length) * 100 
      : 0;
    
    const trendPercentage = Math.abs(secondHalfPercentage - firstHalfPercentage);
    const trend = secondHalfPercentage > firstHalfPercentage ? 'up' : 
                  secondHalfPercentage < firstHalfPercentage ? 'down' : 'stable';

    // Calculate current streak
    let currentStreak = 0;
    const sortedRecords = [...attendanceRecords].sort((a, b) => 
      new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
    );
    
    for (const record of sortedRecords) {
      if (record.status === 'present' || record.status === 'late') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate perfect attendance days (days with all sessions present)
    const dayGroups = attendanceRecords.reduce((groups, record) => {
      const day = record.sessionDate.split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(record);
      return groups;
    }, {} as Record<string, AttendanceRecord[]>);

    const perfectAttendanceDays = Object.values(dayGroups).filter(dayRecords =>
      dayRecords.every(r => r.status === 'present')
    ).length;

    return {
      totalSessions: total,
      presentSessions: present,
      absentSessions: absent,
      lateSessions: late,
      attendancePercentage,
      trend,
      trendPercentage,
      perfectAttendanceDays,
      currentStreak,
    };
  }, [attendanceRecords]);

  // Calculate chart data
  const chartData = useMemo((): AttendanceChartData[] => {
    if (!attendanceRecords.length) return [];

    // Group by date
    const dateGroups = attendanceRecords.reduce((groups, record) => {
      const date = record.sessionDate.split('T')[0];
      if (!groups[date]) {
        groups[date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      
      groups[date][record.status]++;
      groups[date].total++;
      
      return groups;
    }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

    return Object.entries(dateGroups)
      .map(([date, counts]) => ({
        date,
        ...counts,
        percentage: counts.total > 0 ? ((counts.present + counts.late) / counts.total) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceRecords]);

  // Calculate calendar data
  const calendarData = useMemo((): CalendarData[] => {
    if (!attendanceRecords.length) return [];

    // Group by date and determine dominant status
    const dateGroups = attendanceRecords.reduce((groups, record) => {
      const date = record.sessionDate.split('T')[0];
      if (!groups[date]) {
        groups[date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      
      groups[date][record.status]++;
      groups[date].total++;
      
      return groups;
    }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

    return Object.entries(dateGroups).map(([date, counts]) => {
      let status: CalendarData['status'] = 'no-session';
      
      if (counts.total > 0) {
        if (counts.absent > counts.present && counts.absent > counts.late) {
          status = 'absent';
        } else if (counts.late > 0) {
          status = 'late';
        } else {
          status = 'present';
        }
      }

      return {
        date,
        status,
        sessionCount: counts.total,
      };
    });
  }, [attendanceRecords]);

  return {
    attendanceData: attendanceRecords,
    summaryStats,
    chartData,
    calendarData,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
