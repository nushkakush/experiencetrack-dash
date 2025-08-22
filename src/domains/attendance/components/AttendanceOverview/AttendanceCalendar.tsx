/**
 * Attendance Calendar Component
 * Calendar view of attendance data
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface CalendarData {
  date: string;
  status: 'present' | 'absent' | 'late' | 'no-session';
  sessionCount: number;
}

interface AttendanceCalendarProps {
  data: CalendarData[];
  timeframe: string;
  loading?: boolean;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = React.memo(({
  data,
  timeframe,
  loading = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {} as Record<string, CalendarData>);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getStatusIcon = (status: CalendarData['status']) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'late':
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: CalendarData['status']) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium min-w-32 text-center">
              {currentMonth.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2"></div>;
              }

              const dateStr = day.toISOString().split('T')[0];
              const dayData = dataMap[dateStr];
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`
                    relative p-2 text-center text-xs border rounded transition-colors
                    ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                    ${dayData ? getStatusColor(dayData.status) : 'bg-muted text-muted-foreground'}
                    ${dayData && dayData.sessionCount > 0 ? 'cursor-pointer hover:opacity-80' : ''}
                  `}
                  title={
                    dayData && dayData.sessionCount > 0
                      ? `${day.getDate()}: ${dayData.sessionCount} session${dayData.sessionCount > 1 ? 's' : ''} - ${dayData.status}`
                      : `${day.getDate()}: No sessions`
                  }
                >
                  <div className="font-medium">{day.getDate()}</div>
                  
                  {dayData && dayData.sessionCount > 0 && (
                    <div className="flex items-center justify-center mt-1">
                      {getStatusIcon(dayData.status)}
                    </div>
                  )}
                  
                  {dayData && dayData.sessionCount > 1 && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="secondary" className="text-xs h-4 w-4 p-0 flex items-center justify-center">
                        {dayData.sessionCount}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-2">Legend:</div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded"></div>
              <span>No Sessions</span>
            </div>
          </div>
        </div>

        {/* Summary for current month */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground mb-2">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Summary:
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {data.filter(d => d.status === 'present').length}
                </div>
                <div className="text-muted-foreground">Present</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">
                  {data.filter(d => d.status === 'late').length}
                </div>
                <div className="text-muted-foreground">Late</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">
                  {data.filter(d => d.status === 'absent').length}
                </div>
                <div className="text-muted-foreground">Absent</div>
              </div>
              <div className="text-center">
                <div className="font-medium">
                  {data.reduce((sum, d) => sum + d.sessionCount, 0)}
                </div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AttendanceCalendar.displayName = 'AttendanceCalendar';
