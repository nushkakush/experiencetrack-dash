import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import EditStudentDialog from './EditStudentDialog';
import StudentScholarshipDialog from './StudentScholarshipDialog';
import PaymentPlanDialog from './PaymentPlanDialog';
import AvatarUpload from './AvatarUpload';
import MarkDroppedOutDialog from './MarkDroppedOutDialog';
import { CohortStudent } from '@/types/cohort';
import { Scholarship, StudentScholarshipWithDetails } from '@/types/fee';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { studentPaymentPlanService, StudentPaymentPlan } from '@/services/studentPaymentPlan.service';
import { FeeStructureService } from '@/services/feeStructure.service';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import {
  Edit2,
  Award,
  Mail,
  Trash2,
  UserPlus,
  CheckCircle,
  CreditCard,
  Search,
  Filter,
  X,
  UserX,
} from 'lucide-react';

interface CohortStudentsTableProps {
  students: CohortStudent[];
  scholarships?: Scholarship[];
  onStudentDeleted: () => void;
  onStudentUpdated?: (
    studentId: string,
    updates: Partial<CohortStudent>
  ) => void;
  loading?: boolean;
  cohortName?: string;
}

export default function CohortStudentsTable({
  students,
  scholarships = [],
  onStudentDeleted,
  onStudentUpdated,
  loading = false,
  cohortName,
}: CohortStudentsTableProps) {
  const { profile } = useAuth();
  const { hasPermission } = useFeaturePermissions();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all');
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
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
  const [scholarshipAssignments, setScholarshipAssignments] = useState<
    Record<string, boolean>
  >({});
  const [scholarshipDetails, setScholarshipDetails] = useState<
    Record<string, StudentScholarshipWithDetails>
  >({});
  const [loadingScholarships, setLoadingScholarships] = useState(false);
  const [paymentPlanAssignments, setPaymentPlanAssignments] = useState<
    Record<string, boolean>
  >({});
  const [paymentPlanDetails, setPaymentPlanDetails] = useState<
    Record<string, StudentPaymentPlan>
  >({});
  const [loadingPaymentPlans, setLoadingPaymentPlans] = useState(false);
  const [customFeeStructures, setCustomFeeStructures] = useState<
    Record<string, boolean>
  >({});
  const [isFeeSetupComplete, setIsFeeSetupComplete] = useState<boolean>(false);
  const [loadingFeeSetup, setLoadingFeeSetup] = useState<boolean>(true);
  const [droppedOutDialogOpen, setDroppedOutDialogOpen] = useState(false);
  const [selectedStudentForDropout, setSelectedStudentForDropout] = useState<CohortStudent | null>(null);

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
        
        if (emailResult.success && emailResult.data?.emailSent) {
          toast.success('Invitation email sent successfully!');
        } else {
          toast.success('Invitation prepared successfully!');
          Logger.getInstance().info('Invitation URL generated', {
            url: invitationResult.data?.invitationUrl,
          });
        }

        // Update the student's status locally
        if (onStudentUpdated) {
          onStudentUpdated(student.id, {
            invite_status: 'sent',
            invited_at: new Date().toISOString(),
          });
        } else {
          onStudentDeleted(); // Fallback to full reload
        }
      } else {
        toast.error('Failed to prepare invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('An error occurred while preparing the invitation');
    } finally {
      setInvitingStudentId(null);
    }
  };

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

  const confirmSendEmail = async () => {
    if (emailConfirmationDialog.student) {
      await handleSendInvitation(emailConfirmationDialog.student);
      closeEmailConfirmation();
    }
  };

  // Helper function to check if email option should be shown
  const shouldShowEmailOption = (student: CohortStudent) => {
    // Show for pending status (no email sent yet)
    if (student.invite_status === 'pending') {
      return true;
    }
    
    // Show for sent status (email sent but not yet accepted/registered)
    if (student.invite_status === 'sent') {
      return true;
    }
    
    // Don't show for accepted, failed, or other statuses
    return false;
  };

  const handleDeleteStudent = async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const result = await cohortStudentsService.delete(studentId);
      if (result.success) {
        toast.success('Student removed from cohort successfully');
        onStudentDeleted();
      } else {
        toast.error('Failed to remove student from cohort');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('An error occurred while removing the student');
    } finally {
      setDeletingStudentId(null);
    }
  };

  const loadScholarshipAssignments = useCallback(async () => {
    if (!students.length || !canAssignScholarships) return;

    setLoadingScholarships(true);
    try {
      const studentIds = students.map(s => s.id);
      const assignments: Record<string, boolean> = {};

      // Use Promise.all for parallel requests to improve performance
      const results = await Promise.all(
        studentIds.map(studentId =>
          studentScholarshipsService
            .getByStudent(studentId)
            .then(result => ({
              studentId,
              hasScholarship: result.success && !!result.data,
              scholarshipData: result.data,
            }))
            .catch(() => ({
              studentId,
              hasScholarship: false,
              scholarshipData: null,
            }))
        )
      );

      // Convert results to assignments object and store details
      const details: Record<string, StudentScholarshipWithDetails> = {};
      results.forEach(({ studentId, hasScholarship, scholarshipData }) => {
        assignments[studentId] = hasScholarship;
        if (scholarshipData) {
          details[studentId] = scholarshipData;
        }
      });

      setScholarshipAssignments(assignments);
      setScholarshipDetails(details);

      // Log the results for debugging
      console.log('Scholarship assignments loaded:', results);
      console.log('Scholarship details:', details);
    } catch (error) {
      console.error('Error loading scholarship assignments:', error);
    } finally {
      setLoadingScholarships(false);
    }
  }, [students, canAssignScholarships]);

  const loadPaymentPlanAssignments = useCallback(async () => {
    if (!students.length || !canAssignScholarships) return;

    setLoadingPaymentPlans(true);
    try {
      const studentIds = students.map(s => s.id);
      const assignments: Record<string, boolean> = {};

      // Use Promise.all for parallel requests to improve performance
      const results = await Promise.all(
        studentIds.map(studentId =>
          studentPaymentPlanService
            .getByStudent(studentId)
            .then(result => ({
              studentId,
              hasPaymentPlan: result.success && !!result.data,
              paymentPlanData: result.data,
            }))
            .catch(() => ({
              studentId,
              hasPaymentPlan: false,
              paymentPlanData: null,
            }))
        )
      );

      // Convert results to assignments object and store details
      const details: Record<string, StudentPaymentPlan> = {};
      results.forEach(({ studentId, hasPaymentPlan, paymentPlanData }) => {
        assignments[studentId] = hasPaymentPlan && !!paymentPlanData?.payment_plan;
        if (paymentPlanData) {
          details[studentId] = paymentPlanData;
        }
      });

      setPaymentPlanAssignments(assignments);
      setPaymentPlanDetails(details);

      // Load custom fee structures for students with payment plans
      const customStructures: Record<string, boolean> = {};
      const studentsWithPlans = results.filter(r => r.hasPaymentPlan && r.paymentPlanData);
      
      if (studentsWithPlans.length > 0) {
        const customResults = await Promise.all(
          studentsWithPlans.map(async ({ studentId }) => {
            try {
              // Check if student has a custom fee structure
              const customStructure = await FeeStructureService.getFeeStructure(
                students.find(s => s.id === studentId)?.cohort_id || '',
                studentId
              );
              return {
                studentId,
                hasCustomStructure: !!customStructure && customStructure.structure_type === 'custom'
              };
            } catch {
              return { studentId, hasCustomStructure: false };
            }
          })
        );

        customResults.forEach(({ studentId, hasCustomStructure }) => {
          customStructures[studentId] = hasCustomStructure;
        });
      }

      setCustomFeeStructures(customStructures);

      // Log the results for debugging
      console.log('Payment plan assignments loaded:', results);
      console.log('Payment plan details:', details);
      console.log('Custom fee structures:', customStructures);
    } catch (error) {
      console.error('Error loading payment plan assignments:', error);
    } finally {
      setLoadingPaymentPlans(false);
    }
  }, [students, canAssignScholarships]);

  const handleScholarshipAssigned = () => {
    console.log('handleScholarshipAssigned called - refreshing data');
    // Force immediate refresh of scholarship assignments
    loadScholarshipAssignments();
    // Also refresh the table to show updated scholarship information
    // Use a small delay to ensure the database update is complete
    setTimeout(() => {
      console.log('Triggering full table reload');
      onStudentDeleted(); // This will trigger a reload
    }, 200);
  };

  const handlePaymentPlanUpdated = () => {
    console.log('handlePaymentPlanUpdated called - refreshing data');
    // Force immediate refresh of payment plan assignments
    loadPaymentPlanAssignments();
    // Also refresh the table to show updated payment plan information
    // Use a small delay to ensure the database update is complete
    setTimeout(() => {
      console.log('Triggering full table reload');
      onStudentDeleted(); // This will trigger a reload
    }, 200);
  };

  const handleMarkAsDroppedOut = (student: CohortStudent) => {
    setSelectedStudentForDropout(student);
    setDroppedOutDialogOpen(true);
  };

  const handleDroppedOutSuccess = () => {
    onStudentDeleted(); // Refresh the data
  };

  const handleReverted = () => {
    onStudentDeleted(); // Refresh the data
  };

  // Check fee setup completion when students change
  useEffect(() => {
    checkFeeSetupCompletion();
  }, [checkFeeSetupCompletion]);

  // Load scholarship assignments when students change and fee setup is complete
  useEffect(() => {
    if (isFeeSetupComplete) {
      loadScholarshipAssignments();
    }
  }, [students, canAssignScholarships, isFeeSetupComplete, loadScholarshipAssignments]);

  // Load payment plan assignments when students change and fee setup is complete
  useEffect(() => {
    if (isFeeSetupComplete) {
      loadPaymentPlanAssignments();
    }
  }, [students, canAssignScholarships, isFeeSetupComplete, loadPaymentPlanAssignments]);

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='flex items-center space-x-4 p-4 border rounded-lg'
          >
            <div className='h-10 w-10 bg-gray-200 rounded-full animate-pulse' />
            <div className='space-y-2 flex-1'>
              <div className='h-4 bg-gray-200 rounded w-32 animate-pulse' />
              <div className='h-3 bg-gray-200 rounded w-24 animate-pulse' />
            </div>
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
            <div className='h-8 w-8 bg-gray-200 rounded animate-pulse' />
          </div>
        ))}
      </div>
    );
  }

  if (filteredStudents.length === 0) {
    if (students.length === 0) {
      return (
        <div className='text-center py-8'>
          <UserPlus className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Students Found
          </h3>
          <p className='text-gray-600'>
            Add students to the cohort to see them here.
          </p>
        </div>
      );
    } else {
      return (
        <div className='space-y-4'>
          {/* Search and Filter Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      {[searchQuery, statusFilter, scholarshipFilter, paymentPlanFilter].filter(f => f !== 'all' && f !== '').length}
                    </Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                0 of {students.length} students
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {canAssignScholarships && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Scholarship</label>
                      <Select value={scholarshipFilter} onValueChange={setScholarshipFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by scholarship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="assigned">With Scholarship</SelectItem>
                          <SelectItem value="not_assigned">Without Scholarship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {canAssignScholarships && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Plan</label>
                      <Select value={paymentPlanFilter} onValueChange={setPaymentPlanFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by payment plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="assigned">With Payment Plan</SelectItem>
                          <SelectItem value="not_assigned">Without Payment Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* No Results Message */}
          <div className='text-center py-8'>
            <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Students Match Your Filters
            </h3>
            <p className='text-gray-600 mb-4'>
              Try adjusting your search terms or filters to find the students you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className='space-y-4'>
      {/* Search and Filter Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {[searchQuery, statusFilter, scholarshipFilter, paymentPlanFilter].filter(f => f !== 'all' && f !== '').length}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredStudents.length} of {students.length} students
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {canAssignScholarships && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scholarship</label>
                  <Select value={scholarshipFilter} onValueChange={setScholarshipFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by scholarship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="assigned">With Scholarship</SelectItem>
                      <SelectItem value="not_assigned">Without Scholarship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {canAssignScholarships && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Plan</label>
                  <Select value={paymentPlanFilter} onValueChange={setPaymentPlanFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="assigned">With Payment Plan</SelectItem>
                      <SelectItem value="not_assigned">Without Payment Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          {filteredStudents.length === 0 && (
            <span className="text-amber-600">No students match your filters</span>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            {canAssignScholarships && <TableHead>Scholarship & Payment Plan</TableHead>}
            {canManageStudents && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.map(student => (
            <TableRow key={student.id}>
              <TableCell>
                <div className='flex items-center space-x-3'>
                  <AvatarUpload
                    studentId={student.id}
                    currentAvatarUrl={student.avatar_url}
                    studentName={`${student.first_name} ${student.last_name}`}
                    onAvatarUpdated={newAvatarUrl => {
                      if (onStudentUpdated) {
                        onStudentUpdated(student.id, {
                          avatar_url: newAvatarUrl,
                        });
                      } else {
                        onStudentDeleted(); // Fallback to full reload
                      }
                    }}
                    disabled={!canManageStudents}
                  />
                  <div>
                    <p className='font-medium'>
                      {student.first_name} {student.last_name}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{student.email}</TableCell>
              <TableCell>{student.phone || '-'}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant={
                      student.invite_status === 'accepted'
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      student.invite_status === 'accepted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : student.invite_status === 'sent'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }
                  >
                    {student.invite_status}
                  </Badge>
                  {student.dropped_out_status === 'dropped_out' && (
                    <Badge variant="destructive" className="text-xs">
                      Dropped Out
                    </Badge>
                  )}
                </div>
              </TableCell>
              {canAssignScholarships && (
                <TableCell>
                  <div className='space-y-3'>
                    {/* Scholarship Section */}
                    <div className='flex items-center justify-between'>
                      {scholarshipAssignments[student.id] ? (
                        <div className='min-w-0'>
                          <div className='text-sm font-medium text-green-700 dark:text-green-300'>
                            {scholarshipDetails[student.id]?.scholarship?.name ||
                              'Scholarship'}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {
                              scholarshipDetails[student.id]?.scholarship
                                ?.amount_percentage
                            }
                            %
                            {scholarshipDetails[student.id]
                              ?.additional_discount_percentage > 0 &&
                              ` + ${scholarshipDetails[student.id]?.additional_discount_percentage}% additional`}
                          </div>
                        </div>
                      ) : (
                        <div className='text-sm text-muted-foreground'>
                          {!isFeeSetupComplete ? 'Fee setup required' : 'No scholarship'}
                        </div>
                      )}
                      <StudentScholarshipDialog
                        student={student}
                        scholarships={scholarships}
                        onScholarshipAssigned={handleScholarshipAssigned}
                      >
                        <Button
                          variant='ghost'
                          size='sm'
                          className={`h-8 w-8 p-0 hover:bg-primary/10 ${
                            scholarshipAssignments[student.id]
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-primary hover:text-primary/80'
                          }`}
                          title={
                            !isFeeSetupComplete
                              ? 'Complete fee setup first'
                              : scholarshipAssignments[student.id]
                                ? 'Edit scholarship'
                                : 'Assign scholarship'
                          }
                          disabled={loadingScholarships || !isFeeSetupComplete}
                        >
                          {scholarshipAssignments[student.id] ? (
                            <CheckCircle className='h-4 w-4' />
                          ) : (
                            <Award className='h-4 w-4' />
                          )}
                        </Button>
                      </StudentScholarshipDialog>
                    </div>

                    {/* Payment Plan Section */}
                    <div className='flex items-center justify-between'>
                      {paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan ? (
                        <div className='min-w-0'>
                          <div className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                            {(() => {
                              const plan = paymentPlanDetails[student.id]?.payment_plan;
                              const isCustom = customFeeStructures[student.id];
                              const planName = 
                                plan === 'one_shot' ? 'One Shot Payment' :
                                plan === 'sem_wise' ? 'Semester Wise' :
                                plan === 'instalment_wise' ? 'Instalment Wise' :
                                plan === 'not_selected' ? 'Not Selected' : '';
                              return isCustom ? `Custom ${planName}` : planName;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className='text-sm text-muted-foreground'>
                          {!isFeeSetupComplete ? 'Fee setup required' : 'No payment plan'}
                        </div>
                      )}
                      <PaymentPlanDialog
                        student={student}
                        onPaymentPlanUpdated={handlePaymentPlanUpdated}
                      >
                        <Button
                          variant='ghost'
                          size='sm'
                          className={`h-8 w-8 p-0 hover:bg-primary/10 ${
                            paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan
                              ? 'text-blue-600 hover:text-blue-700'
                              : 'text-primary hover:text-primary/80'
                          }`}
                          title={
                            !isFeeSetupComplete
                              ? 'Complete fee setup first'
                              : paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan
                                ? 'Edit payment plan'
                                : 'Select payment plan'
                          }
                          disabled={loadingPaymentPlans || !isFeeSetupComplete}
                        >
                          {paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan ? (
                            <CheckCircle className='h-4 w-4' />
                          ) : (
                            <CreditCard className='h-4 w-4' />
                          )}
                        </Button>
                      </PaymentPlanDialog>
                    </div>
                  </div>
                </TableCell>
              )}
              {canManageStudents && (
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {canEditStudents && (
                      <EditStudentDialog
                        student={student}
                        onUpdated={
                          onStudentUpdated
                            ? () => onStudentUpdated(student.id, {})
                            : onStudentDeleted
                        }
                      />
                    )}

                    {shouldShowEmailOption(student) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => openEmailConfirmation(student)}
                        disabled={invitingStudentId === student.id}
                        className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        title={student.invite_status === 'pending' ? 'Send invitation' : 'Resend invitation'}
                      >
                        <Mail className='h-4 w-4' />
                      </Button>
                    )}

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleMarkAsDroppedOut(student)}
                      className='h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                      title={student.dropped_out_status === 'dropped_out' ? 'View dropout details' : 'Mark as dropped out'}
                    >
                      <UserX className='h-4 w-4' />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                          title='Remove student'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {student.first_name}{' '}
                            {student.last_name} from this cohort? This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(student.id)}
                            disabled={deletingStudentId === student.id}
                            className='bg-red-600 hover:bg-red-700'
                          >
                            {deletingStudentId === student.id
                              ? 'Removing...'
                              : 'Remove'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mark Dropped Out Dialog */}
      <MarkDroppedOutDialog
        open={droppedOutDialogOpen}
        onOpenChange={setDroppedOutDialogOpen}
        student={selectedStudentForDropout}
        onMarkedAsDroppedOut={handleDroppedOutSuccess}
        onReverted={handleReverted}
      />

             {/* Email Confirmation Dialog */}
       <AlertDialog open={emailConfirmationDialog.open} onOpenChange={closeEmailConfirmation}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {emailConfirmationDialog.student?.invite_status === 'pending' 
                 ? 'Send Invitation' 
                 : 'Resend Invitation'
               }
             </AlertDialogTitle>
             <AlertDialogDescription>
               {emailConfirmationDialog.student?.invite_status === 'pending' 
                 ? `Are you sure you want to send an invitation email to ${emailConfirmationDialog.student?.first_name} ${emailConfirmationDialog.student?.last_name}?`
                 : `This student has already been sent an invitation. Would you like to resend it to ${emailConfirmationDialog.student?.first_name} ${emailConfirmationDialog.student?.last_name}?`
               }
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={closeEmailConfirmation}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={confirmSendEmail}>
               {emailConfirmationDialog.student?.invite_status === 'pending' 
                 ? 'Send Invitation' 
                 : 'Resend Invitation'
               }
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}
