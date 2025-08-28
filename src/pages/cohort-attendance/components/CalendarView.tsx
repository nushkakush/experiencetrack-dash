import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Star,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { HolidaysService } from '@/services/holidays.service';
import type { AttendanceRecord, CohortEpic } from '@/types/attendance';
import type { Holiday } from '@/types/holiday';

interface CalendarViewProps {
  selectedDate: Date;
  attendanceRecords: AttendanceRecord[];
  currentEpic: CohortEpic | null;
  isHoliday: boolean;
  currentHoliday: CohortEpic | null;
  onDateSelect: (date: Date) => void;
  onMarkHoliday: () => void;
}

interface SessionData {
  sessionNumber: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
}

interface DayData {
  sessions: Map<number, SessionData>;
  totalSessions: number;
  overallAttendance: number;
}

interface DayHoliday {
  date: string;
  holidays: Holiday[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  attendanceRecords = [],
  currentEpic,
  isHoliday,
  currentHoliday,
  onDateSelect,
  onMarkHoliday,
}) => {
  console.log('🎯 CalendarView: Component rendered with props:', {
    selectedDate,
    attendanceRecordsLength: attendanceRecords.length,
    currentEpic,
    isHoliday,
    currentHoliday,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState<
    AttendanceRecord[]
  >([]);
  const [monthlyHolidays, setMonthlyHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch attendance data for the entire month
  useEffect(() => {
    const fetchMonthlyAttendance = async () => {
      console.log('🔄 CalendarView: Starting monthly attendance fetch');
      console.log('📊 CalendarView: currentEpic:', currentEpic);
      console.log('📅 CalendarView: currentMonth:', currentMonth);

      if (!currentEpic?.cohort_id || !currentEpic?.id) {
        console.log('❌ CalendarView: Missing cohort_id or epic_id');
        console.log('❌ CalendarView: cohort_id:', currentEpic?.cohort_id);
        console.log('❌ CalendarView: epic_id:', currentEpic?.id);
        return;
      }

      setLoading(true);
      try {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        console.log('🔍 CalendarView: Fetching data for date range:', {
          startDate,
          endDate,
        });
        console.log('🔍 CalendarView: cohort_id:', currentEpic.cohort_id);
        console.log(
          '🔍 CalendarView: epic_id (cohort_epics.id):',
          currentEpic.id
        );

        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('cohort_id', currentEpic.cohort_id)
          .eq('epic_id', currentEpic.id) // Use currentEpic.id instead of currentEpic.epic_id
          .gte('session_date', startDate)
          .lte('session_date', endDate);

        console.log('📊 CalendarView: Supabase response:', { data, error });

        if (error) {
          console.error(
            '❌ CalendarView: Error fetching monthly attendance:',
            error
          );
          return;
        }

        console.log('✅ CalendarView: Setting monthly attendance data:', data);
        setMonthlyAttendanceData(data || []);
      } catch (error) {
        console.error(
          '❌ CalendarView: Exception fetching monthly attendance:',
          error
        );
      } finally {
        setLoading(false);
        console.log('🏁 CalendarView: Fetch completed');
      }
    };

    fetchMonthlyAttendance();
  }, [currentMonth, currentEpic?.cohort_id, currentEpic?.id]);

  // Fetch holidays for the current month
  useEffect(() => {
    const fetchMonthlyHolidays = async () => {
      if (!currentEpic?.cohort_id) return;

      setHolidaysLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;

        console.log('🎉 CalendarView: Fetching holidays for:', { year, month });

        // Fetch both global and cohort-specific published holidays
        const [globalHolidays, cohortHolidays] = await Promise.all([
          HolidaysService.getHolidays({
            holidayType: 'global',
            status: 'published',
            year,
          }),
          HolidaysService.getHolidays({
            holidayType: 'cohort_specific',
            status: 'published',
            cohortId: currentEpic.cohort_id,
            year,
          }),
        ]);

        // Filter holidays for the current month
        const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        const allHolidays = [...globalHolidays, ...cohortHolidays].filter(
          holiday => holiday.date >= monthStart && holiday.date <= monthEnd
        );

        console.log('🎉 CalendarView: Found holidays:', allHolidays);
        setMonthlyHolidays(allHolidays);
      } catch (error) {
        console.error('❌ CalendarView: Error fetching holidays:', error);
        setMonthlyHolidays([]);
      } finally {
        setHolidaysLoading(false);
      }
    };

    fetchMonthlyHolidays();
  }, [currentMonth, currentEpic?.cohort_id]);

  // Create a map of holidays by date
  const holidaysMap = useMemo(() => {
    const map = new Map<string, Holiday[]>();

    monthlyHolidays.forEach(holiday => {
      const dateStr = holiday.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(holiday);
    });

    return map;
  }, [monthlyHolidays]);

  // Create a map of attendance data by date and session number
  const attendanceDataMap = useMemo(() => {
    console.log('🗺️ CalendarView: Creating attendance data map');
    console.log(
      '📊 CalendarView: monthlyAttendanceData length:',
      monthlyAttendanceData.length
    );
    console.log(
      '📊 CalendarView: monthlyAttendanceData sample:',
      monthlyAttendanceData.slice(0, 3)
    );

    const map = new Map<string, DayData>();

    // Use monthly attendance data instead of the passed attendanceRecords
    monthlyAttendanceData.forEach((record, index) => {
      console.log(`📝 CalendarView: Processing record ${index}:`, record);

      if (record.session_date) {
        const dateStr = record.session_date.split('T')[0]; // Get just the date part
        const sessionNumber = record.session_number || 1;
        console.log(
          `📅 CalendarView: Date string: ${dateStr}, Session: ${sessionNumber}`
        );

        if (!map.has(dateStr)) {
          map.set(dateStr, {
            sessions: new Map(),
            totalSessions: 0,
            overallAttendance: 0,
          });
        }

        const dayData = map.get(dateStr)!;

        if (!dayData.sessions.has(sessionNumber)) {
          dayData.sessions.set(sessionNumber, {
            sessionNumber,
            totalStudents: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            attendancePercentage: 0,
          });
        }

        const sessionData = dayData.sessions.get(sessionNumber)!;
        sessionData.totalStudents++;

        if (record.status === 'present') sessionData.presentCount++;
        else if (record.status === 'absent') sessionData.absentCount++;
        else if (record.status === 'late') sessionData.lateCount++;

        sessionData.attendancePercentage =
          sessionData.totalStudents > 0
            ? Math.round(
                (sessionData.presentCount / sessionData.totalStudents) * 100
              )
            : 0;

        console.log(
          `📊 CalendarView: Updated session data for ${dateStr} Session ${sessionNumber}:`,
          sessionData
        );
      } else {
        console.log(
          `⚠️ CalendarView: Record ${index} has no session_date:`,
          record
        );
      }
    });

    // Calculate overall statistics for each day
    map.forEach((dayData, dateStr) => {
      const sessions = Array.from(dayData.sessions.values());
      dayData.totalSessions = sessions.length;

      if (sessions.length > 0) {
        const totalAttendance = sessions.reduce(
          (sum, session) => sum + session.attendancePercentage,
          0
        );
        dayData.overallAttendance = Math.round(
          totalAttendance / sessions.length
        );
      }
    });

    console.log(
      '🗺️ CalendarView: Final attendance data map:',
      Array.from(map.entries())
    );
    return map;
  }, [monthlyAttendanceData]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add empty cells for days before the first day of month
    const firstDayOfMonth = startOfMonth(currentMonth);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const emptyCells = Array.from(
      { length: startingDayOfWeek },
      (_, i) => null
    );

    return [...emptyCells, ...days];
  }, [currentMonth]);

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const dates = Array.from(attendanceDataMap.keys());
    const daysWithAttendance = dates.length;
    const totalSessions = Array.from(attendanceDataMap.values()).reduce(
      (sum, data) => sum + data.totalSessions,
      0
    );
    const totalAttendance = Array.from(attendanceDataMap.values()).reduce(
      (sum, data) => sum + data.overallAttendance,
      0
    );
    const averageAttendance =
      daysWithAttendance > 0
        ? Math.round(totalAttendance / daysWithAttendance)
        : 0;

    return {
      daysWithAttendance,
      totalSessions,
      averageAttendance,
    };
  }, [attendanceDataMap]);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 75) return 'bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getSessionColor = (sessionNumber: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-green-100 text-green-800',
      'bg-orange-100 text-orange-800',
    ];
    return colors[(sessionNumber - 1) % colors.length];
  };

  const getHolidayColor = (holidayType: string) => {
    return holidayType === 'global'
      ? 'bg-red-100 text-red-800'
      : 'bg-orange-100 text-orange-800';
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  // Show loading state
  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>{/* Removed redundant subtitle */}</div>

          <div className='flex items-center gap-4'>
            {/* Monthly Statistics */}
            <div className='flex items-center gap-6 p-4 bg-muted/50 rounded-lg'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {monthlyStats.daysWithAttendance}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Days with Sessions
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {monthlyStats.totalSessions}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Total Sessions
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {monthlyStats.averageAttendance}%
                </div>
                <div className='text-sm text-muted-foreground'>
                  Average Attendance
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={handlePreviousMonth}>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-lg font-semibold min-w-[120px] text-center'>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant='outline' size='sm' onClick={handleNextMonth}>
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        <div className='bg-white dark:bg-gray-900 rounded-lg border shadow-sm'>
          <div className='grid grid-cols-7 border-b'>
            {weekDays.map(day => (
              <div
                key={day}
                className='p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30'
              >
                {day}
              </div>
            ))}
          </div>
          <div className='grid grid-cols-7'>
            {Array.from({ length: 42 }, (_, i) => (
              <div
                key={i}
                className='min-h-[120px] p-3 border-r border-b animate-pulse'
              >
                <div className='h-4 bg-muted rounded mb-2'></div>
                <div className='h-3 bg-muted rounded mb-1'></div>
                <div className='h-3 bg-muted rounded'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Calendar Header */}
      <div className='flex items-center justify-between'>
        <div>{/* Removed redundant subtitle */}</div>

        <div className='flex items-center gap-4'>
          {/* Monthly Statistics */}
          <div className='flex items-center gap-6 p-4 bg-muted/50 rounded-lg'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {monthlyStats.daysWithAttendance}
              </div>
              <div className='text-sm text-muted-foreground'>
                Days with Sessions
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {monthlyStats.totalSessions}
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Sessions
              </div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {monthlyStats.averageAttendance}%
              </div>
              <div className='text-sm text-muted-foreground'>
                Average Attendance
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' onClick={handlePreviousMonth}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <span className='text-lg font-semibold min-w-[120px] text-center'>
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant='outline' size='sm' onClick={handleNextMonth}>
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Page Calendar */}
      <div className='bg-white dark:bg-gray-900 rounded-lg border shadow-sm'>
        {/* Week day headers */}
        <div className='grid grid-cols-7 border-b'>
          {weekDays.map(day => (
            <div
              key={day}
              className='p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className='grid grid-cols-7'>
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className='min-h-[120px] border-r border-b bg-muted/20'
                ></div>
              );
            }

            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = attendanceDataMap.get(dateStr);
            const dayHolidays = holidaysMap.get(dateStr) || [];
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentDay = isToday(date);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

            // Debug logging for specific dates
            if (date.getDate() === 22) {
              console.log(`🔍 CalendarView: August 22nd data:`, {
                dateStr,
                dayData,
                hasData: !!dayData,
                totalSessions: dayData?.totalSessions,
                overallAttendance: dayData?.overallAttendance,
                holidays: dayHolidays,
              });
            }

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[120px] p-3 border-r border-b cursor-pointer transition-all hover:bg-muted/50',
                  isSelected && 'ring-2 ring-primary bg-primary/5',
                  isCurrentDay && 'border-2 border-primary',
                  !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                  dayHolidays.length > 0 && 'bg-yellow-50/50'
                )}
                onClick={() => handleDateClick(date)}
              >
                {/* Date Header */}
                <div
                  className={cn(
                    'text-sm font-medium mb-2',
                    isCurrentDay && 'text-primary font-bold',
                    isSelected && 'text-primary'
                  )}
                >
                  {format(date, 'd')}
                </div>

                {/* Holiday Indicators */}
                {dayHolidays.length > 0 && (
                  <div className='mb-2'>
                    {dayHolidays.map((holiday, holidayIndex) => (
                      <Badge
                        key={holiday.id}
                        variant='secondary'
                        className={cn(
                          'text-xs px-1.5 py-0.5 mb-1',
                          getHolidayColor(holiday.holiday_type)
                        )}
                      >
                        <Star className='h-2.5 w-2.5 mr-1' />
                        {holiday.title}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Session Data */}
                {dayData && dayData.totalSessions > 0 ? (
                  <div className='space-y-2'>
                    {/* Overall Attendance for the day */}
                    <div
                      className={cn(
                        'text-lg font-bold',
                        getAttendanceColor(dayData.overallAttendance)
                      )}
                    >
                      {dayData.overallAttendance}%
                    </div>

                    {/* Session Details */}
                    <div className='space-y-1'>
                      {Array.from(dayData.sessions.values()).map(session => (
                        <div key={session.sessionNumber} className='text-xs'>
                          <div className='flex items-center justify-between'>
                            <span className='font-medium'>
                              Session {session.sessionNumber}:
                            </span>
                            <span
                              className={getAttendanceColor(
                                session.attendancePercentage
                              )}
                            >
                              {session.attendancePercentage}%
                            </span>
                          </div>
                          <div className='flex items-center gap-1 text-muted-foreground'>
                            <Users className='h-2.5 w-2.5' />
                            <span>
                              {session.presentCount}/{session.totalStudents}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : dayHolidays.length > 0 ? (
                  <div className='text-sm text-muted-foreground'>Holiday</div>
                ) : (
                  <div className='text-sm text-muted-foreground'>
                    No sessions
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend and Actions */}
      <div className='flex items-center justify-between'>
        {/* Legend */}
        <div className='flex items-center gap-6 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-green-100 border border-green-300 rounded'></div>
            <span>≥90% Excellent</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-blue-100 border border-blue-300 rounded'></div>
            <span>≥75% Good</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-yellow-100 border border-yellow-300 rounded'></div>
            <span>≥60% Fair</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-red-100 border border-red-300 rounded'></div>
            <span>&lt;60% Needs Improvement</span>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className='bg-red-100 text-red-800 text-xs'
            >
              <Star className='h-2.5 w-2.5 mr-1' />
              Global Holiday
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className='bg-orange-100 text-orange-800 text-xs'
            >
              <Star className='h-2.5 w-2.5 mr-1' />
              Cohort Holiday
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='flex items-center gap-4'>
          <div className='text-sm text-muted-foreground'>
            Click on any date to navigate to that day's attendance view
          </div>
        </div>
      </div>
    </div>
  );
};
