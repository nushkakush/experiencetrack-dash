import { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarService } from '../services/CalendarService';
import type { CalendarDay } from '../types';
import { HolidaysService } from '../../../services/holidays.service';
import type { Holiday } from '../../../types/holiday';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export const useCalendar = (
  initialDate: Date = new Date(),
  viewMode: 'month' | 'week' = 'month',
  cohortId?: string
) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [publishedHolidays, setPublishedHolidays] = useState<Holiday[]>([]);

  // Generate calendar days for current month or week
  const calendarDays = useMemo(() => {
    console.log('🔄 useCalendar: Generating calendar days', {
      viewMode,
      currentMonth: currentMonth.toISOString(),
    });

    if (viewMode === 'week') {
      const weekDays = CalendarService.generateWeekDays(currentMonth);
      console.log(
        '📅 Week view: Generated',
        weekDays.length,
        'days:',
        weekDays.map(d => d?.date.toDateString())
      );
      return weekDays;
    }

    const monthDays = CalendarService.generateCalendarDays(currentMonth);
    console.log('📅 Month view: Generated', monthDays.length, 'days');
    return monthDays;
  }, [currentMonth, viewMode]);

  // Load published global and cohort holidays for visible period
  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        // For simplicity, load for the year in view and filter client-side
        const year = currentMonth.getFullYear();
        const [globalPublished, cohortPublished] = await Promise.all([
          HolidaysService.getGlobalHolidays('published'),
          cohortId
            ? HolidaysService.getCohortHolidays(cohortId, 'published')
            : Promise.resolve([] as Holiday[]),
        ]);

        if (!isCancelled) {
          setPublishedHolidays([
            ...(globalPublished || []),
            ...(cohortPublished || []),
          ]);
        }
      } catch (e) {
        console.error('Failed to load holidays for calendar:', e);
        if (!isCancelled) setPublishedHolidays([]);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [currentMonth, viewMode, cohortId]);

  // Annotate days with holiday info
  const annotatedDays: CalendarDay[] = useMemo(() => {
    const days = calendarDays;
    if (!days || days.length === 0) return days;

    // Determine visible range
    const rangeStart =
      viewMode === 'week'
        ? startOfWeek(currentMonth, { weekStartsOn: 0 })
        : startOfMonth(currentMonth);
    const rangeEnd =
      viewMode === 'week'
        ? endOfWeek(currentMonth, { weekStartsOn: 0 })
        : endOfMonth(currentMonth);

    // Build a lookup map for holidays in range
    const holidayByDate = new Map<string, Holiday>();
    for (const h of publishedHolidays) {
      const d = h?.date;
      if (!d) continue;
      const dateObj = new Date(d);
      if (dateObj >= rangeStart && dateObj <= rangeEnd) {
        const key = format(dateObj, 'yyyy-MM-dd');
        // Prioritize cohort-specific over global
        const existing = holidayByDate.get(key);
        if (!existing || existing.holiday_type === 'global') {
          holidayByDate.set(key, h);
        }
      }
    }

    return days.map(day => {
      if (!day) return day as any;
      const key = format(day.date, 'yyyy-MM-dd');
      const holiday = holidayByDate.get(key);
      if (!holiday) return day;
      return {
        ...day,
        isHoliday: true,
        holidayTitle: holiday.title,
        holidayType: holiday.holiday_type,
      } as CalendarDay;
    });
  }, [calendarDays, publishedHolidays, currentMonth, viewMode]);

  // Navigation handlers
  const navigateToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => CalendarService.getPreviousMonth(prev));
  }, []);

  const navigateToNextMonth = useCallback(() => {
    setCurrentMonth(prev => CalendarService.getNextMonth(prev));
  }, []);

  const navigateToPreviousWeek = useCallback(() => {
    setCurrentMonth(prev => CalendarService.getPreviousWeek(prev));
  }, []);

  const navigateToNextWeek = useCallback(() => {
    setCurrentMonth(prev => CalendarService.getNextWeek(prev));
  }, []);

  const navigateToMonth = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);

  // Date selection handler
  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Format current month for display
  const formattedCurrentMonth = useMemo(() => {
    return CalendarService.formatMonth(currentMonth);
  }, [currentMonth]);

  // Get week day labels
  const weekDayLabels = useMemo(() => {
    return CalendarService.getWeekDayLabels();
  }, []);

  return {
    // State
    currentMonth,
    selectedDate,
    calendarDays: annotatedDays,
    weekDayLabels,
    formattedCurrentMonth,

    // Actions
    navigateToPreviousMonth,
    navigateToNextMonth,
    navigateToPreviousWeek,
    navigateToNextWeek,
    navigateToMonth,
    selectDate,
    setCurrentMonth,
    setSelectedDate,
  };
};
