import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { StudentPaymentSummary } from '@/types/fee';

export const useDashboardState = () => {
  const navigate = useNavigate();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPaymentSummary | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('payments');

  const handleSettingsComplete = (loadData: () => void) => {
    loadData(); // Refresh data after settings are updated
  };

  const handleBackClick = () => {
    navigate('/cohorts');
  };

  const handleStudentSelect = (student: StudentPaymentSummary) => {
    setSelectedStudent(student);
  };

  const handleCloseStudentDetails = () => {
    setSelectedStudent(null);
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

  const handleExportSelected = () => {
    if (selectedRows.size === 0) {
      toast.error('Please select at least one student to export');
      return;
    }
    // TODO: Implement export functionality
    toast.info(`Exporting ${selectedRows.size} selected students`);
  };

  return {
    settingsModalOpen,
    selectedStudent,
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
