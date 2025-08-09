import { useState } from 'react';
import { format } from 'date-fns';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { AttendanceAction, CohortStudent } from '@/types/attendance';

interface UseAttendanceActionsProps {
  cohortId: string;
  selectedEpic: string;
  selectedSession: number;
  selectedDate: Date;
  onAttendanceMarked?: () => void;
}

export const useAttendanceActions = ({
  cohortId,
  selectedEpic,
  selectedSession,
  selectedDate,
  onAttendanceMarked,
}: UseAttendanceActionsProps) => {
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<CohortStudent | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'absent' | 'late'>('absent');
  const [reason, setReason] = useState('');
  const [absenceType, setAbsenceType] = useState<'informed' | 'uninformed' | 'exempted'>('uninformed');
  const [processing, setProcessing] = useState(false);

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (status === 'present') {
      // Mark present directly
      await handleDirectMarkAttendance({ studentId, status });
    } else {
      // Show reason dialog for absent/late - student will be set by parent component
      setSelectedStatus(status);
      setShowReasonDialog(true);
    }
  };

  const handleDirectMarkAttendance = async (action: AttendanceAction) => {
    setProcessing(true);
    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      
      await AttendanceService.markAttendance(
        cohortId,
        selectedEpic,
        selectedSession,
        sessionDate,
        action.studentId,
        action.status,
        action.absenceType,
        action.reason
      );

      toast.success(`Student marked as ${action.status}`);
      onAttendanceMarked?.();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setProcessing(false);
    }
  };

  const confirmReasonAndMark = async () => {
    if (!selectedStudent) return;

    await handleDirectMarkAttendance({
      studentId: selectedStudent.id,
      status: selectedStatus,
      reason: reason.trim(),
      absenceType,
    });

    // Reset dialog state
    setShowReasonDialog(false);
    setSelectedStudent(null);
    setReason('');
    setAbsenceType('uninformed');
  };

  const cancelSession = async () => {
    setProcessing(true);
    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      
      await AttendanceService.toggleSessionCancellation(
        cohortId,
        selectedEpic,
        selectedSession,
        sessionDate,
        true
      );

      toast.success('Session cancelled successfully');
      onAttendanceMarked?.();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    } finally {
      setProcessing(false);
    }
  };

  const reactivateSession = async () => {
    setProcessing(true);
    try {
      const sessionDate = format(selectedDate, 'yyyy-MM-dd');
      
      await AttendanceService.toggleSessionCancellation(
        cohortId,
        selectedEpic,
        selectedSession,
        sessionDate,
        false
      );

      toast.success('Session reactivated successfully');
      onAttendanceMarked?.();
    } catch (error) {
      console.error('Error reactivating session:', error);
      toast.error('Failed to reactivate session');
    } finally {
      setProcessing(false);
    }
  };

  return {
    // State
    showReasonDialog,
    selectedStudent,
    selectedStatus,
    reason,
    absenceType,
    processing,
    
    // Actions
    markAttendance,
    confirmReasonAndMark,
    cancelSession,
    reactivateSession,
    
    // Setters for dialog
    setShowReasonDialog,
    setReason,
    setAbsenceType,
    setSelectedStudent: (student: CohortStudent | null) => setSelectedStudent(student),
  };
};
