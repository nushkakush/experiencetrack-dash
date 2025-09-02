import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isToday,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from 'date-fns';
import type { CalendarDay } from '../types';

export class CalendarService {
  /**
   * Generate calendar days for a given month
   */
  static generateCalendarDays(month: Date): CalendarDay[] {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthDays = eachDayOfInterval({ start, end });

    // Add empty cells for days before the first day of month
    const firstDayOfMonth = startOfMonth(month);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const emptyCells = Array.from(
      { length: startingDayOfWeek },
      (_, i) => null
    );

    const days: CalendarDay[] = [
      ...emptyCells.map(() => null),
      ...monthDays.map(date => ({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: false,
      })),
    ];

    return days;
  }

  /**
   * Navigate to previous month
   */
  static getPreviousMonth(currentMonth: Date): Date {
    return subMonths(currentMonth, 1);
  }

  /**
   * Navigate to next month
   */
  static getNextMonth(currentMonth: Date): Date {
    return addMonths(currentMonth, 1);
  }

  /**
   * Format month for display
   */
  static formatMonth(month: Date): string {
    return format(month, 'MMMM yyyy');
  }

  /**
   * Check if a date is in the current month
   */
  static isInCurrentMonth(date: Date, currentMonth: Date): boolean {
    return isSameMonth(date, currentMonth);
  }

  /**
   * Generate calendar days for a given week
   */
  static generateWeekDays(weekStart: Date): CalendarDay[] {
    const start = startOfWeek(weekStart, { weekStartsOn: 0 }); // Start on Sunday (to match the UI)
    const end = endOfWeek(weekStart, { weekStartsOn: 0 }); // End on Saturday
    const weekDays = eachDayOfInterval({ start, end });

    // Ensure we only return exactly 7 days
    return weekDays.slice(0, 7).map(date => ({
      date,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: false,
    }));
  }

  /**
   * Navigate to previous week
   */
  static getPreviousWeek(currentWeek: Date): Date {
    return subWeeks(currentWeek, 1);
  }

  /**
   * Navigate to next week
   */
  static getNextWeek(currentWeek: Date): Date {
    return addWeeks(currentWeek, 1);
  }

  /**
   * Get week day labels
   */
  static getWeekDayLabels(): string[] {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
}
