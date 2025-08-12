import { useState } from 'react';
import { isAfter, addDays, subDays } from 'date-fns';
import type { AttendanceStatus } from '@/types/attendance';

interface UseAttendancePageStateProps {
  onAttendanceMarked: () => Promise<void>;
}

export const useAttendancePageState = ({ onAttendanceMarked }: UseAttendancePageStateProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'manage' | 'leaderboard'>('manage');
  const [leaderboardLayout, setLeaderboardLayout] = useState<'table' | 'grid'>('grid');

  const handleDateChange = (date: Date) => {
    if (!isAfter(date, new Date())) {
      setSelectedDate(date);
    }
  };

  const handleSessionChange = (session: number) => {
    setSelectedSession(session);
  };

  const handleMarkAttendance = (studentId: string, status: AttendanceStatus) => {
    // This will be handled by the parent component
    return { studentId, status };
  };

  const handlePreviousDay = () => {
    handleDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isAfter(nextDay, new Date())) {
      handleDateChange(nextDay);
    }
  };

  const isFutureDate = isAfter(selectedDate, new Date());

  return {
    selectedDate,
    selectedSession,
    holidaysDialogOpen,
    currentView,
    leaderboardLayout,
    isFutureDate,
    setSelectedDate,
    setSelectedSession,
    setHolidaysDialogOpen,
    setCurrentView,
    setLeaderboardLayout,
    handleDateChange,
    handleSessionChange,
    handleMarkAttendance,
    handlePreviousDay,
    handleNextDay
  };
};
