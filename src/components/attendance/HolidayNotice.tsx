import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Holiday } from '@/types/holiday';
import type { Cohort } from '@/types/attendance';

interface HolidayNoticeProps {
  holiday: Holiday;
  cohort: Cohort | null;
  selectedDate: Date;
}

export const HolidayNotice: React.FC<HolidayNoticeProps> = ({
  holiday,
  cohort,
  selectedDate,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="p-2 rounded-full bg-purple-100">
          <CalendarIcon className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-purple-700">
            🎉 Holiday - {holiday.title}
          </h3>
          <p className="text-purple-600">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Badge variant={holiday.holiday_type === 'global' ? 'outline' : 'destructive'}>
          {holiday.holiday_type === 'global' ? '🌍 Global Holiday' : `🏫 ${cohort?.name} Holiday`}
        </Badge>
      </div>
      
      {holiday.description && (
        <div className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-gray-700">{holiday.description}</p>
        </div>
      )}
      
      <div className="flex items-center justify-center py-8 text-center">
        <div className="space-y-2">
          <CalendarIcon className="h-12 w-12 text-purple-400 mx-auto" />
          <h4 className="text-lg font-medium text-gray-900">No sessions today</h4>
          <p className="text-gray-600">Attendance tracking is not required on holidays</p>
        </div>
      </div>
    </div>
  );
};
