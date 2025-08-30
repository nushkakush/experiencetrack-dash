import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { CohortStudent } from '@/types/cohort';
import {
  Scholarship,
  StudentScholarshipWithDetails,
  PaymentPlan,
} from '@/types/fee';
import { StudentPaymentPlan } from '@/services/studentPaymentPlan.service';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { studentPaymentPlanService } from '@/services/studentPaymentPlan.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { supabase } from '@/integrations/supabase/client';

interface UseCohortStudentsTableProps {
  students: CohortStudent[];
  scholarships?: Scholarship[];
  onStudentDeleted: () => void;
  onStudentUpdated?: (
    studentId: string,
    updates: Partial<CohortStudent>
  ) => void;
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

  // Track if data has been loaded to prevent unnecessary reloading
  const dataLoadedRef = useRef(false);
  const studentsHashRef = useRef<string>('');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Student management state
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null
  );
  const [invitingStudentId, setInvitingStudentId] = useState<string | null>(
    null
  );
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
  const [updatingScholarshipId, setUpdatingScholarshipId] = useState<
    string | null
  >(null);

  // Payment plan state
  const [paymentPlanAssignments, setPaymentPlanAssignments] = useState<
    Record<string, boolean>
  >({});
  const [paymentPlanDetails, setPaymentPlanDetails] = useState<
    Record<string, StudentPaymentPlan>
  >({});
  const [loadingPaymentPlans, setLoadingPaymentPlans] = useState(false);
  const [updatingPaymentPlanId, setUpdatingPaymentPlanId] = useState<
    string | null
  >(null);

  // Fee structure state
  const [customFeeStructures, setCustomFeeStructures] = useState<
    Record<string, boolean>
  >({});
  const [isFeeSetupComplete, setIsFeeSetupComplete] = useState<boolean>(false);
  const [loadingFeeSetup, setLoadingFeeSetup] = useState<boolean>(true);

  // Dropout state
  const [droppedOutDialogOpen, setDroppedOutDialogOpen] = useState(false);
  const [selectedStudentForDropout, setSelectedStudentForDropout] =
    useState<CohortStudent | null>(null);

  // Permissions
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canEditStudents = hasPermission('cohorts.edit_students');
  const canAssignScholarships = hasPermission('cohorts.assign_scholarships');

  // Filtered students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search filter
      const searchLower = searchQuery.toLowerCase().trim();

      // Create full name for searching (first + last name with space)
      const fullName = [student.first_name, student.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Split search terms to handle multi-word searches
      const searchTerms = searchLower
        .split(' ')
        .filter(term => term.length > 0);

      const matchesSearch =
        searchQuery === '' ||
        student.first_name?.toLowerCase().includes(searchLower) ||
        student.last_name?.toLowerCase().includes(searchLower) ||
        fullName.includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        // Check if all search terms are found in either first name, last name, or full name
        (searchTerms.length > 1 &&
          searchTerms.every(
            term =>
              student.first_name?.toLowerCase().includes(term) ||
              student.last_name?.toLowerCase().includes(term) ||
              fullName.includes(term)
          ));

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || student.invite_status === statusFilter;

      // Scholarship filter
      const hasScholarship = scholarshipAssignments[student.id];
      const matchesScholarship =
        scholarshipFilter === 'all' ||
        (scholarshipFilter === 'assigned' && hasScholarship) ||
        (scholarshipFilter === 'not_assigned' && !hasScholarship);

      // Payment plan filter
      const hasPaymentPlan =
        paymentPlanAssignments[student.id] &&
        paymentPlanDetails[student.id]?.payment_plan;
      const matchesPaymentPlan =
        paymentPlanFilter === 'all' ||
        (paymentPlanFilter === 'assigned' && hasPaymentPlan) ||
        (paymentPlanFilter === 'not_assigned' && !hasPaymentPlan);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesScholarship &&
        matchesPaymentPlan
      );
    });
  }, [
    students,
    searchQuery,
    statusFilter,
    scholarshipFilter,
    paymentPlanFilter,
    scholarshipAssignments,
    paymentPlanAssignments,
    paymentPlanDetails,
  ]);

  // Bulk selection computed values
  const selectedStudents = useMemo(() => {
    return students.filter(student => selectedStudentIds.has(student.id));
  }, [students, selectedStudentIds]);

  const filteredSelectedStudents = useMemo(() => {
    return filteredStudents.filter(student =>
      selectedStudentIds.has(student.id)
    );
  }, [filteredStudents, selectedStudentIds]);

  const isAllSelected = useMemo(() => {
    return (
      filteredStudents.length > 0 &&
      filteredSelectedStudents.length === filteredStudents.length
    );
  }, [filteredStudents, filteredSelectedStudents]);

  const isIndeterminate = useMemo(() => {
    return (
      filteredSelectedStudents.length > 0 &&
      filteredSelectedStudents.length < filteredStudents.length
    );
  }, [filteredStudents, filteredSelectedStudents]);

  // Bulk selection handlers
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all filtered students
      const newSelectedIds = new Set(selectedStudentIds);
      filteredStudents.forEach(student => {
        newSelectedIds.delete(student.id);
      });
      setSelectedStudentIds(newSelectedIds);
    } else {
      // Select all filtered students
      const newSelectedIds = new Set(selectedStudentIds);
      filteredStudents.forEach(student => {
        newSelectedIds.add(student.id);
      });
      setSelectedStudentIds(newSelectedIds);
    }
  }, [isAllSelected, selectedStudentIds, filteredStudents]);

  const handleSelectStudent = useCallback(
    (studentId: string, checked: boolean) => {
      const newSelectedIds = new Set(selectedStudentIds);
      if (checked) {
        newSelectedIds.add(studentId);
      } else {
        newSelectedIds.delete(studentId);
      }
      setSelectedStudentIds(newSelectedIds);
    },
    [selectedStudentIds]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedStudentIds(new Set());
  }, []);

  // Bulk actions
  const handleBulkAssignScholarship = useCallback(
    async (studentIds: string[], scholarshipId: string) => {
      setIsBulkProcessing(true);
      try {
        const scholarship = scholarships.find(s => s.id === scholarshipId);
        if (!scholarship) {
          throw new Error('Scholarship not found');
        }

        // Process all assignments in parallel
        const assignmentPromises = studentIds.map(async studentId => {
          try {
            const result = await studentScholarshipsService.assignScholarship(
              studentId,
              scholarshipId,
              0,
              profile?.user_id || ''
            );
            if (!result.success) {
              throw new Error(
                `Failed to assign scholarship to student ${studentId}`
              );
            }
            return { studentId, success: true, data: result.data };
          } catch (error) {
            console.error(
              `Error assigning scholarship to student ${studentId}:`,
              error
            );
            return { studentId, success: false, error };
          }
        });

        const results = await Promise.all(assignmentPromises);
        const successfulAssignments = results.filter(r => r.success);
        const failedAssignments = results.filter(r => !r.success);

        // Update local state for successful assignments
        successfulAssignments.forEach(({ studentId }) => {
          setScholarshipAssignments(prev => ({ ...prev, [studentId]: true }));
        });

        // Clear selection
        setSelectedStudentIds(new Set());

        // Show results
        if (failedAssignments.length > 0) {
          toast.error(
            `${failedAssignments.length} assignment${failedAssignments.length > 1 ? 's' : ''} failed`
          );
        }
        if (successfulAssignments.length > 0) {
          toast.success(
            `Scholarship assigned to ${successfulAssignments.length} student${successfulAssignments.length > 1 ? 's' : ''}`
          );
        }
      } catch (error) {
        console.error('Error in bulk scholarship assignment:', error);
        toast.error('Failed to assign scholarships');
        throw error;
      } finally {
        setIsBulkProcessing(false);
      }
    },
    [scholarships]
  );

  const handleBulkAssignPaymentPlan = useCallback(
    async (studentIds: string[], paymentPlan: PaymentPlan) => {
      setIsBulkProcessing(true);
      try {
        // Process all assignments in parallel
        const assignmentPromises = studentIds.map(async studentId => {
          try {
            const result = await studentPaymentPlanService.setPaymentPlan(
              studentId,
              students.find(s => s.id === studentId)?.cohort_id || '',
              paymentPlan,
              profile?.user_id || ''
            );
            if (!result.success) {
              throw new Error(
                `Failed to assign payment plan to student ${studentId}`
              );
            }
            return { studentId, success: true, data: result.data };
          } catch (error) {
            console.error(
              `Error assigning payment plan to student ${studentId}:`,
              error
            );
            return { studentId, success: false, error };
          }
        });

        const results = await Promise.all(assignmentPromises);
        const successfulAssignments = results.filter(r => r.success);
        const failedAssignments = results.filter(r => !r.success);

        // Update local state for successful assignments
        successfulAssignments.forEach(({ studentId, data }) => {
          setPaymentPlanAssignments(prev => ({ ...prev, [studentId]: true }));
          if (data) {
            setPaymentPlanDetails(prev => ({ ...prev, [studentId]: data }));
          }
        });

        // Clear selection
        setSelectedStudentIds(new Set());

        // Show results
        if (failedAssignments.length > 0) {
          toast.error(
            `${failedAssignments.length} assignment${failedAssignments.length > 1 ? 's' : ''} failed`
          );
        }
        if (successfulAssignments.length > 0) {
          toast.success(
            `Payment plan assigned to ${successfulAssignments.length} student${successfulAssignments.length > 1 ? 's' : ''}`
          );
        }
      } catch (error) {
        console.error('Error in bulk payment plan assignment:', error);
        toast.error('Failed to assign payment plans');
        throw error;
      } finally {
        setIsBulkProcessing(false);
      }
    },
    []
  );

  const handleBulkDeleteStudents = useCallback(
    async (studentIds: string[]) => {
      setIsBulkProcessing(true);
      try {
        // Process all deletions in parallel
        const deletionPromises = studentIds.map(async studentId => {
          try {
            const result = await cohortStudentsService.delete(studentId);
            if (!result.success) {
              throw new Error(`Failed to delete student ${studentId}`);
            }
            return { studentId, success: true };
          } catch (error) {
            console.error(`Error deleting student ${studentId}:`, error);
            return { studentId, success: false, error };
          }
        });

        const results = await Promise.all(deletionPromises);
        const successfulDeletions = results.filter(r => r.success);
        const failedDeletions = results.filter(r => !r.success);

        // Clear selection
        setSelectedStudentIds(new Set());

        // Show results
        if (failedDeletions.length > 0) {
          toast.error(
            `${failedDeletions.length} deletion${failedDeletions.length > 1 ? 's' : ''} failed`
          );
        }
        if (successfulDeletions.length > 0) {
          toast.success(
            `${successfulDeletions.length} student${successfulDeletions.length > 1 ? 's' : ''} removed from cohort`
          );
          // Trigger parent refresh
          onStudentDeleted();
        }
      } catch (error) {
        console.error('Error in bulk student deletion:', error);
        toast.error('Failed to remove students');
        throw error;
      } finally {
        setIsBulkProcessing(false);
      }
    },
    [onStudentDeleted]
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setScholarshipFilter('all');
    setPaymentPlanFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    scholarshipFilter !== 'all' ||
    paymentPlanFilter !== 'all';

  // Check if fee setup is complete for this cohort
  const checkFeeSetupCompletion = useCallback(async () => {
    if (!students.length) return;

    try {
      setLoadingFeeSetup(true);
      const cohortId = students[0]?.cohort_id;
      if (!cohortId) return;

      const { feeStructure } =
        await FeeStructureService.getCompleteFeeStructure(cohortId);
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

      // Load all scholarship data in parallel
      const scholarshipPromises = students.map(async student => {
        try {
          const result = await studentScholarshipsService.getByStudent(
            student.id
          );
          return {
            studentId: student.id,
            success: result.success,
            data: result.data,
          };
        } catch (error) {
          console.error(
            `Error loading scholarship for student ${student.id}:`,
            error
          );
          return {
            studentId: student.id,
            success: false,
            data: null,
          };
        }
      });

      const results = await Promise.all(scholarshipPromises);

      results.forEach(({ studentId, success, data }) => {
        if (success && data) {
          assignments[studentId] = true;
          details[studentId] = data;
        } else {
          assignments[studentId] = false;
        }
      });

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

      // Load all payment plan data in parallel
      const paymentPlanPromises = students.map(async student => {
        try {
          const result = await studentPaymentPlanService.getByStudent(
            student.id
          );
          return {
            studentId: student.id,
            success: result.success,
            data: result.data,
          };
        } catch (error) {
          console.error(
            `Error loading payment plan for student ${student.id}:`,
            error
          );
          return {
            studentId: student.id,
            success: false,
            data: null,
          };
        }
      });

      const results = await Promise.all(paymentPlanPromises);

      // Check for custom fee structures for students with payment plans
      const studentsWithPlans = results.filter(
        ({ success, data }) => success && data
      );
      if (studentsWithPlans.length > 0) {
        const customStructurePromises = studentsWithPlans.map(
          async ({ studentId }) => {
            try {
              const { data: customStructure } = await supabase
                .from('fee_structures')
                .select('id')
                .eq('student_id', studentId)
                .eq('structure_type', 'custom')
                .maybeSingle();

              return { studentId, hasCustom: !!customStructure };
            } catch (error) {
              console.error(
                'Error checking custom fee structure for student:',
                studentId,
                error
              );
              return { studentId, hasCustom: false };
            }
          }
        );

        const customStructureResults = await Promise.all(
          customStructurePromises
        );
        customStructureResults.forEach(({ studentId, hasCustom }) => {
          customStructures[studentId] = hasCustom;
        });
      }

      results.forEach(({ studentId, success, data }) => {
        if (success && data) {
          assignments[studentId] = true;
          details[studentId] = data;
        } else {
          assignments[studentId] = false;
        }
      });

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
  const handleScholarshipAssigned = useCallback(
    async (
      studentId: string,
      scholarshipData?: StudentScholarshipWithDetails
    ) => {
      setUpdatingScholarshipId(studentId);
      try {
        console.log(
          '🔄 [DEBUG] handleScholarshipAssigned called for student:',
          studentId,
          'with data:',
          scholarshipData
        );

        if (scholarshipData) {
          // Use the provided scholarship data directly
          setScholarshipAssignments(prev => ({ ...prev, [studentId]: true }));
          setScholarshipDetails(prev => ({
            ...prev,
            [studentId]: scholarshipData,
          }));
        } else {
          // Scholarship was removed, fetch to confirm
          const result =
            await studentScholarshipsService.getByStudent(studentId);
          if (result.success && result.data) {
            setScholarshipAssignments(prev => ({ ...prev, [studentId]: true }));
            setScholarshipDetails(prev => ({
              ...prev,
              [studentId]: result.data,
            }));
          } else {
            setScholarshipAssignments(prev => ({
              ...prev,
              [studentId]: false,
            }));
            setScholarshipDetails(prev => {
              const newDetails = { ...prev };
              delete newDetails[studentId];
              return newDetails;
            });
          }
        }

        // Show success toast for the update
        toast.success('Scholarship updated successfully', {
          duration: 2000,
          position: 'bottom-right',
        });
      } catch (error) {
        console.error(
          '🔄 [DEBUG] Error updating scholarship assignment:',
          error
        );
        // On error, still update the state to reflect the change
        setScholarshipAssignments(prev => ({ ...prev, [studentId]: false }));
        setScholarshipDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[studentId];
          return newDetails;
        });

        // Show error toast
        toast.error('Failed to update scholarship', {
          duration: 3000,
          position: 'bottom-right',
        });
      } finally {
        setUpdatingScholarshipId(null);
      }
    },
    []
  );

  // Function to manually refresh data (useful for external triggers)
  const refreshData = useCallback(async () => {
    dataLoadedRef.current = false;
    studentsHashRef.current = '';

    if (students.length > 0) {
      await Promise.all([
        checkFeeSetupCompletion(),
        loadScholarshipAssignments(),
        loadPaymentPlanAssignments(),
      ]);

      dataLoadedRef.current = true;
      studentsHashRef.current = students
        .map(s => s.id)
        .sort()
        .join(',');
    }
  }, [
    students,
    scholarships,
    checkFeeSetupCompletion,
    loadScholarshipAssignments,
    loadPaymentPlanAssignments,
  ]);

  // Handle payment plan update
  const handlePaymentPlanUpdated = useCallback(
    async (studentId: string, paymentPlanData?: StudentPaymentPlan) => {
      setUpdatingPaymentPlanId(studentId);
      try {
        if (paymentPlanData) {
          // Use the provided payment plan data directly
          setPaymentPlanAssignments(prev => ({ ...prev, [studentId]: true }));
          setPaymentPlanDetails(prev => ({
            ...prev,
            [studentId]: paymentPlanData,
          }));
          // Check if this student has a custom fee structure
          try {
            const { data: customStructure } = await supabase
              .from('fee_structures')
              .select('id')
              .eq('student_id', studentId)
              .eq('structure_type', 'custom')
              .maybeSingle();

            setCustomFeeStructures(prev => ({
              ...prev,
              [studentId]: !!customStructure,
            }));
          } catch (error) {
            console.error(
              'Error checking custom fee structure for student:',
              studentId,
              error
            );
            setCustomFeeStructures(prev => ({
              ...prev,
              [studentId]: false,
            }));
          }
        } else {
          // Payment plan was removed, fetch to confirm
          const result =
            await studentPaymentPlanService.getByStudent(studentId);
          if (result.success && result.data) {
            setPaymentPlanAssignments(prev => ({ ...prev, [studentId]: true }));
            setPaymentPlanDetails(prev => ({
              ...prev,
              [studentId]: result.data,
            }));
            // Check if this student has a custom fee structure
            try {
              const { data: customStructure } = await supabase
                .from('fee_structures')
                .select('id')
                .eq('student_id', studentId)
                .eq('structure_type', 'custom')
                .maybeSingle();

              setCustomFeeStructures(prev => ({
                ...prev,
                [studentId]: !!customStructure,
              }));
            } catch (error) {
              console.error(
                'Error checking custom fee structure for student:',
                studentId,
                error
              );
              setCustomFeeStructures(prev => ({
                ...prev,
                [studentId]: false,
              }));
            }
          } else {
            setPaymentPlanAssignments(prev => ({
              ...prev,
              [studentId]: false,
            }));
            setPaymentPlanDetails(prev => {
              const newDetails = { ...prev };
              delete newDetails[studentId];
              return newDetails;
            });
          }
        }

        // Show success toast for the update
        toast.success('Payment plan updated successfully', {
          duration: 2000,
          position: 'bottom-right',
        });
      } catch (error) {
        console.error('Error updating payment plan assignment:', error);

        // Show error toast
        toast.error('Failed to update payment plan', {
          duration: 3000,
          position: 'bottom-right',
        });
      } finally {
        setUpdatingPaymentPlanId(null);
      }
    },
    []
  );

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
          toast.success(
            `Invitation sent to ${student.first_name} ${student.last_name}`
          );
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
    return (
      student.invite_status === 'pending' || student.invite_status === 'sent'
    );
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const result = await cohortStudentsService.delete(studentId);
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
    // Create a hash of the current students to detect changes
    const currentStudentsHash = students
      .map(s => s.id)
      .sort()
      .join(',');

    // Check if we need to reload data
    const shouldReload =
      !dataLoadedRef.current || currentStudentsHash !== studentsHashRef.current;

    if (shouldReload && students.length > 0) {
      const loadAllData = async () => {
        // Load all data in parallel for better performance
        await Promise.all([
          checkFeeSetupCompletion(),
          loadScholarshipAssignments(),
          loadPaymentPlanAssignments(),
        ]);

        // Mark data as loaded and update the hash
        dataLoadedRef.current = true;
        studentsHashRef.current = currentStudentsHash;

        // Show a subtle notification that data is loaded (only on first load)
        if (currentStudentsHash !== studentsHashRef.current) {
          toast.success('Student data loaded successfully', {
            duration: 2000,
            position: 'bottom-right',
          });
        }
      };

      loadAllData();
    }

    // Cleanup function to reset data loaded state when component unmounts or cohort changes
    return () => {
      // Only reset if the students array is empty (cohort changed or component unmounting)
      if (students.length === 0) {
        dataLoadedRef.current = false;
        studentsHashRef.current = '';
      }
    };
  }, [
    students,
    scholarships,
    checkFeeSetupCompletion,
    loadScholarshipAssignments,
    loadPaymentPlanAssignments,
  ]);

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
    updatingScholarshipId,
    paymentPlanAssignments,
    paymentPlanDetails,
    loadingPaymentPlans,
    updatingPaymentPlanId,
    customFeeStructures,
    isFeeSetupComplete,
    loadingFeeSetup,
    droppedOutDialogOpen,
    setDroppedOutDialogOpen,
    selectedStudentForDropout,
    setSelectedStudentForDropout,

    // Bulk selection state
    selectedStudentIds,
    selectedStudents,
    filteredSelectedStudents,
    isAllSelected,
    isIndeterminate,
    isBulkProcessing,

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
    refreshData,

    // Bulk selection actions
    handleSelectAll,
    handleSelectStudent,
    handleClearSelection,
    handleBulkAssignScholarship,
    handleBulkAssignPaymentPlan,
    handleBulkDeleteStudents,
  };
};
