import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HolidaysService } from '@/services/holidays.service';
import type { Holiday } from '@/types/holiday';

export const useHolidayDetection = (cohortId: string | undefined, selectedDate: Date | undefined) => {
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);
  const [checkingHoliday, setCheckingHoliday] = useState(false);

  useEffect(() => {
    if (!cohortId || !selectedDate) return;

    const checkForHoliday = async () => {
      setCheckingHoliday(true);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // Check for both global and cohort-specific holidays
        const [globalHolidays, cohortHolidays] = await Promise.all([
          HolidaysService.getGlobalHolidays('published'),
          HolidaysService.getCohortHolidays(cohortId, 'published')
        ]);

        // Find holiday for this date (prioritize cohort-specific over global)
        const cohortHoliday = cohortHolidays.find(h => h.date === dateString);
        const globalHoliday = globalHolidays.find(h => h.date === dateString);
        
        const holiday = cohortHoliday || globalHoliday;
        setCurrentHoliday(holiday || null);
      } catch (error) {
        console.error('Failed to check for holiday:', error);
        setCurrentHoliday(null);
      } finally {
        setCheckingHoliday(false);
      }
    };

    checkForHoliday();
  }, [selectedDate, cohortId]);

  return {
    currentHoliday,
    checkingHoliday,
    isHoliday: !!currentHoliday,
  };
};
