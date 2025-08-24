import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CohortStudent } from '@/types/cohort';
import { Scholarship, StudentScholarshipWithDetails } from '@/types/fee';
import { StudentPaymentPlan } from '@/services/studentPaymentPlan.service';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { studentPaymentPlanService } from '@/services/studentPaymentPlan.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';

interface UseCohortStudentsTableProps {
  students: CohortStudent[];
  scholarships?: Scholarship[];
  onStudentDeleted: () => void;
  onStudentUpdated?: (studentId: string, updates: Partial<CohortStudent>) => void;
  cohortName?: string;
}

export const useCohortStudentsTable = ({
  students,
  scholarships = [],
  onStudentDeleted,
  onStudentUpdated,
  cohortName,
}: UseCohortStudentsTableProps) => {

  const { profile } = useAuth();
  const { hasPermission } = useFeaturePermissions();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Student management state
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [invitingStudentId, setInvitingStudentId] = useState<string | null>(null);
  const [emailConfirmationDialog, setEmailConfirmationDialog] = useState<{
    open: boolean;
    student: CohortStudent | null;
  }>({
    open: false,
    student: null,
  });

  // Scholarship state
  const [scholarshipAssignments, setScholarshipAssignments] = useState<
    Record<string, boolean>
  >({});
  const [scholarshipDetails, setScholarshipDetails] = useState<
    Record<string, StudentScholarshipWithDetails>
  >({});
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  // Payment plan state
  const [paymentPlanAssignments, setPaymentPlanAssignments] = useState<
    Record<string, boolean>
  >({});
  const [paymentPlanDetails, setPaymentPlanDetails] = useState<
    Record<string, StudentPaymentPlan>
  >({});
  const [loadingPaymentPlans, setLoadingPaymentPlans] = useState(false);

  // Fee structure state
  const [customFeeStructures, setCustomFeeStructures] = useState<
    Record<string, boolean>
  >({});
  const [isFeeSetupComplete, setIsFeeSetupComplete] = useState<boolean>(false);
  const [loadingFeeSetup, setLoadingFeeSetup] = useState<boolean>(true);

  // Dropout state
  const [droppedOutDialogOpen, setDroppedOutDialogOpen] = useState(false);
  const [selectedStudentForDropout, setSelectedStudentForDropout] = useState<CohortStudent | null>(null);

  // Permissions
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canEditStudents = hasPermission('cohorts.edit_students');
  const canAssignScholarships = hasPermission('cohorts.assign_scholarships');

  // Filtered students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        student.first_name?.toLowerCase().includes(searchLower) ||
        student.last_name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || student.invite_status === statusFilter;

      // Scholarship filter
      const hasScholarship = scholarshipAssignments[student.id];
      const matchesScholarship = scholarshipFilter === 'all' || 
        (scholarshipFilter === 'assigned' && hasScholarship) ||
        (scholarshipFilter === 'not_assigned' && !hasScholarship);

      // Payment plan filter
      const hasPaymentPlan = paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan;
      const matchesPaymentPlan = paymentPlanFilter === 'all' || 
        (paymentPlanFilter === 'assigned' && hasPaymentPlan) ||
        (paymentPlanFilter === 'not_assigned' && !hasPaymentPlan);

      return matchesSearch && matchesStatus && matchesScholarship && matchesPaymentPlan;
    });
  }, [students, searchQuery, statusFilter, scholarshipFilter, paymentPlanFilter, scholarshipAssignments, paymentPlanAssignments, paymentPlanDetails]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setScholarshipFilter('all');
    setPaymentPlanFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || scholarshipFilter !== 'all' || paymentPlanFilter !== 'all';

  // Check if fee setup is complete for this cohort
  const checkFeeSetupCompletion = useCallback(async () => {
    if (!students.length) return;
    
    try {
      setLoadingFeeSetup(true);
      const cohortId = students[0]?.cohort_id;
      if (!cohortId) return;

      const { feeStructure } = await FeeStructureService.getCompleteFeeStructure(cohortId);
      setIsFeeSetupComplete(!!(feeStructure && feeStructure.is_setup_complete));
    } catch (error) {
      console.error('Error checking fee setup completion:', error);
      setIsFeeSetupComplete(false);
    } finally {
      setLoadingFeeSetup(false);
    }
  }, [students]);

  // Load scholarship assignments
  const loadScholarshipAssignments = useCallback(async () => {
    if (!students.length || !scholarships.length) return;

    try {
      setLoadingScholarships(true);
      const assignments: Record<string, boolean> = {};
      const details: Record<string, StudentScholarshipWithDetails> = {};

      for (const student of students) {
        try {
          const result = await studentScholarshipsService.getByStudent(student.id);
          if (result.success && result.data) {
            assignments[student.id] = true;
            details[student.id] = result.data;
          } else {
            assignments[student.id] = false;
          }
        } catch (error) {
          console.error(`Error loading scholarship for student ${student.id}:`, error);
          assignments[student.id] = false;
        }
      }

      setScholarshipAssignments(assignments);
      setScholarshipDetails(details);
    } catch (error) {
      console.error('Error loading scholarship assignments:', error);
    } finally {
      setLoadingScholarships(false);
    }
  }, [students, scholarships]);

  // Load payment plan assignments
  const loadPaymentPlanAssignments = useCallback(async () => {
    if (!students.length) return;

    try {
      setLoadingPaymentPlans(true);
      const assignments: Record<string, boolean> = {};
      const details: Record<string, StudentPaymentPlan> = {};
      const customStructures: Record<string, boolean> = {};

      for (const student of students) {
        try {
          const result = await studentPaymentPlanService.getByStudent(student.id);
          if (result.success && result.data) {
            assignments[student.id] = true;
            details[student.id] = result.data;
            customStructures[student.id] = false; // TODO: Implement custom fee structure check
          } else {
            assignments[student.id] = false;
          }
        } catch (error) {
          console.error(`Error loading payment plan for student ${student.id}:`, error);
          assignments[student.id] = false;
        }
      }

      setPaymentPlanAssignments(assignments);
      setPaymentPlanDetails(details);
      setCustomFeeStructures(customStructures);
    } catch (error) {
      console.error('Error loading payment plan assignments:', error);
    } finally {
      setLoadingPaymentPlans(false);
    }
  }, [students]);

  // Handle scholarship assignment
  const handleScholarshipAssigned = useCallback(async (studentId: string) => {
    try {
      const result = await studentScholarshipsService.getByStudent(studentId);
      if (result.success && result.data) {
        setScholarshipAssignments(prev => ({ ...prev, [studentId]: true }));
        setScholarshipDetails(prev => ({ ...prev, [studentId]: result.data }));
      } else {
        // If no scholarship data, mark as not assigned
        setScholarshipAssignments(prev => ({ ...prev, [studentId]: false }));
        setScholarshipDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[studentId];
          return newDetails;
        });
      }
    } catch (error) {
      console.error('Error updating scholarship assignment:', error);
    }
  }, []);

  // Handle payment plan update
  const handlePaymentPlanUpdated = useCallback(async (studentId: string) => {
    try {
      const result = await studentPaymentPlanService.getByStudent(studentId);
      if (result.success && result.data) {
        setPaymentPlanAssignments(prev => ({ ...prev, [studentId]: true }));
        setPaymentPlanDetails(prev => ({ ...prev, [studentId]: result.data }));
        setCustomFeeStructures(prev => ({ 
          ...prev, 
          [studentId]: false // TODO: Implement custom fee structure check
        }));
      } else {
        // If no payment plan data, mark as not assigned
        setPaymentPlanAssignments(prev => ({ ...prev, [studentId]: false }));
        setPaymentPlanDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[studentId];
          return newDetails;
        });
      }
    } catch (error) {
      console.error('Error updating payment plan assignment:', error);
    }
  }, []);

  // Handle send invitation
  const handleSendInvitation = async (student: CohortStudent) => {
    setInvitingStudentId(student.id);
    try {
      const invitationResult = await cohortStudentsService.sendCustomInvitation(
        student.id,
        profile?.user_id || ''
      );

      if (invitationResult.success) {
        // Send email via Edge Function
        const emailResult = await cohortStudentsService.sendInvitationEmail(
          student.id,
          student.email,
          student.first_name || '',
          student.last_name || '',
          cohortName || 'Your Cohort'
        );

        if (emailResult.success) {
          toast.success(`Invitation sent to ${student.first_name} ${student.last_name}`);
          onStudentUpdated?.(student.id, { invite_status: 'sent' });
        } else {
          toast.error('Failed to send invitation email');
        }
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInvitingStudentId(null);
      closeEmailConfirmation();
    }
  };

  // Email confirmation handlers
  const openEmailConfirmation = (student: CohortStudent) => {
    setEmailConfirmationDialog({
      open: true,
      student,
    });
  };

  const closeEmailConfirmation = () => {
    setEmailConfirmationDialog({
      open: false,
      student: null,
    });
  };

  const confirmSendEmail = () => {
    if (emailConfirmationDialog.student) {
      handleSendInvitation(emailConfirmationDialog.student);
    }
  };

  // Check if email option should be shown
  const shouldShowEmailOption = (student: CohortStudent) => {
    return student.invite_status === 'pending' || student.invite_status === 'sent';
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const result = await cohortStudentsService.deleteStudent(studentId);
      if (result.success) {
        toast.success('Student removed from cohort');
        onStudentDeleted();
      } else {
        toast.error('Failed to remove student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to remove student');
    } finally {
      setDeletingStudentId(null);
    }
  };

  // Handle mark as dropped out
  const handleMarkAsDroppedOut = (student: CohortStudent) => {
    setSelectedStudentForDropout(student);
    setDroppedOutDialogOpen(true);
  };

  const handleDroppedOutSuccess = () => {
    toast.success('Student marked as dropped out');
    onStudentDeleted();
  };

  const handleReverted = () => {
    toast.success('Student dropout status reverted');
    onStudentDeleted();
  };

  // Initialize data
  useEffect(() => {
    checkFeeSetupCompletion();
    loadScholarshipAssignments();
    loadPaymentPlanAssignments();
  }, [checkFeeSetupCompletion, loadScholarshipAssignments, loadPaymentPlanAssignments]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    scholarshipFilter,
    setScholarshipFilter,
    paymentPlanFilter,
    setPaymentPlanFilter,
    showFilters,
    setShowFilters,
    deletingStudentId,
    invitingStudentId,
    emailConfirmationDialog,
    scholarshipAssignments,
    scholarshipDetails,
    loadingScholarships,
    paymentPlanAssignments,
    paymentPlanDetails,
    loadingPaymentPlans,
    customFeeStructures,
    isFeeSetupComplete,
    loadingFeeSetup,
    droppedOutDialogOpen,
    setDroppedOutDialogOpen,
    selectedStudentForDropout,
    setSelectedStudentForDropout,

    // Computed values
    filteredStudents,
    hasActiveFilters,
    canManageStudents,
    canEditStudents,
    canAssignScholarships,

    // Actions
    clearFilters,
    handleScholarshipAssigned,
    handlePaymentPlanUpdated,
    openEmailConfirmation,
    closeEmailConfirmation,
    confirmSendEmail,
    shouldShowEmailOption,
    handleDeleteStudent,
    handleMarkAsDroppedOut,
    handleDroppedOutSuccess,
    handleReverted,
  };
};
