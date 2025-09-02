export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  // Holiday metadata to control UI and interactions
  isHoliday?: boolean;
  holidayTitle?: string;
  holidayType?: 'global' | 'cohort_specific';
}

export interface CalendarNavigation {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onMonthChange: (date: Date) => void;
}

export interface CalendarGridProps {
  days: CalendarDay[];
  onDateSelect: (date: Date) => void;
  children?: React.ReactNode;
}

export interface CalendarDayProps {
  day: CalendarDay;
  onDateSelect: (date: Date) => void;
  children?: React.ReactNode;
}

export interface CalendarLegendItem {
  label: string;
  color: string;
  description?: string;
}
