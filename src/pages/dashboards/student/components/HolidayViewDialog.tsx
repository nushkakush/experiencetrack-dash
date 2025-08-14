import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import type { Holiday } from '@/types/holiday';

interface HolidayViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
}

export const HolidayViewDialog: React.FC<HolidayViewDialogProps> = ({
  open,
  onOpenChange,
  cohortId,
}) => {
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadHolidays();
    }
  }, [open, cohortId]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      // Load global holidays
      const { data: globalData, error: globalError } = await supabase
        .from('holidays')
        .select('*')
        .eq('holiday_type', 'global')
        .eq('status', 'published')
        .order('date', { ascending: true });

      if (globalError) throw globalError;

      // Load cohort-specific holidays
      const { data: cohortData, error: cohortError } = await supabase
        .from('holidays')
        .select('*')
        .eq('holiday_type', 'cohort_specific')
        .eq('cohort_id', cohortId)
        .eq('status', 'published')
        .order('date', { ascending: true });

      if (cohortError) throw cohortError;

      // Combine and sort all holidays by date
      const combinedHolidays = [...(globalData || []), ...(cohortData || [])];
      combinedHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAllHolidays(combinedHolidays);
    } catch (error) {
      console.error('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHolidayList = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (allHolidays.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>No holidays found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allHolidays.map((holiday) => (
          <div
            key={holiday.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{holiday.title}</h4>
                <Badge variant={holiday.holiday_type === 'global' ? 'secondary' : 'outline'}>
                  {holiday.holiday_type === 'global' ? 'Global' : 'Cohort-Specific'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {holiday.description || 'No description provided'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {format(parseISO(holiday.date), 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(parseISO(holiday.date), 'EEEE')}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            View Holidays
          </DialogTitle>
          <DialogDescription>
            View all holidays that apply to your cohort, including global holidays and cohort-specific holidays.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {renderHolidayList()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
