import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummary } from '@/types/fee';
import { exportPaymentData } from '@/utils/exportUtils';

export const useDashboardState = () => {
  const navigate = useNavigate();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('payments');

  const handleSettingsComplete = (loadData: () => void) => {
    loadData(); // Refresh data after settings are updated
  };

  const handleBackClick = () => {
    navigate('/cohorts');
  };

  const handleStudentSelect = (student: StudentPaymentSummary) => {
    // No longer needed since we're using modal instead of sidebar
  };

  const handleCloseStudentDetails = () => {
    // No longer needed since we're using modal instead of sidebar
  };

  const handleRowSelection = (studentId: string, isSelected: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (isSelected) {
      newSelectedRows.add(studentId);
    } else {
      newSelectedRows.delete(studentId);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAll = (isSelected: boolean, students: StudentPaymentSummary[]) => {
    if (isSelected) {
      const allStudentIds = students.map(student => student.student_id);
      setSelectedRows(new Set(allStudentIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleExportSelected = (students: StudentPaymentSummary[]) => {
    if (students.length === 0) {
      toast.error('No students to export');
      return;
    }

    try {
      exportPaymentData(students, { format: 'csv' });
      toast.success(`Successfully exported ${students.length} student(s)`);
    } catch (error) {
      Logger.getInstance().error('Export failed', { error });
      toast.error('Failed to export data');
    }
  };

  return {
    settingsModalOpen,
    selectedRows,
    activeTab,
    setSettingsModalOpen,
    setActiveTab,
    handleSettingsComplete,
    handleBackClick,
    handleStudentSelect,
    handleCloseStudentDetails,
    handleRowSelection,
    handleSelectAll,
    handleExportSelected
  };
};
