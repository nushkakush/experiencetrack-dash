import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { HolidaysService } from '@/services/holidays.service';
import type { Holiday } from '@/types/holiday';

// Cache for holiday data to prevent excessive API calls
const holidayCache = new Map<string, { data: Holiday[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useHolidayDetection = (cohortId: string | undefined, selectedDate: Date | undefined) => {
  const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);
  const [checkingHoliday, setCheckingHoliday] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!cohortId || !selectedDate) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the holiday check to prevent excessive API calls
    timeoutRef.current = setTimeout(async () => {
      setCheckingHoliday(true);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        // Check cache first
        const globalCacheKey = `global-holidays-published`;
        const cohortCacheKey = `cohort-holidays-${cohortId}-published`;
        
        let globalHolidays: Holiday[] = [];
        let cohortHolidays: Holiday[] = [];
        
        // Check global holidays cache
        const globalCache = holidayCache.get(globalCacheKey);
        if (globalCache && Date.now() - globalCache.timestamp < CACHE_DURATION) {
          globalHolidays = globalCache.data;
        } else {
          globalHolidays = await HolidaysService.getGlobalHolidays('published');
          holidayCache.set(globalCacheKey, { data: globalHolidays, timestamp: Date.now() });
        }
        
        // Check cohort holidays cache
        const cohortCache = holidayCache.get(cohortCacheKey);
        if (cohortCache && Date.now() - cohortCache.timestamp < CACHE_DURATION) {
          cohortHolidays = cohortCache.data;
        } else {
          cohortHolidays = await HolidaysService.getCohortHolidays(cohortId, 'published');
          holidayCache.set(cohortCacheKey, { data: cohortHolidays, timestamp: Date.now() });
        }

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
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [selectedDate, cohortId]);

  return {
    currentHoliday,
    checkingHoliday,
    isHoliday: !!currentHoliday,
  };
};
