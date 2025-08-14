import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Logger } from '@/lib/logging/Logger';
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
import EditStudentDialog from './EditStudentDialog';
import StudentScholarshipDialog from './StudentScholarshipDialog';
import AvatarUpload from './AvatarUpload';
import { CohortStudent } from '@/types/cohort';
import { Scholarship } from '@/types/fee';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { studentScholarshipsService } from '@/services/studentScholarships.service';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';
import {
  Edit2,
  Award,
  Mail,
  Trash2,
  UserPlus,
  CheckCircle,
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
}

export default function CohortStudentsTable({
  students,
  scholarships = [],
  onStudentDeleted,
  onStudentUpdated,
  loading = false,
}: CohortStudentsTableProps) {
  const { profile } = useAuth();
  const { hasPermission } = useFeaturePermissions();
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(
    null
  );
  const [invitingStudentId, setInvitingStudentId] = useState<string | null>(
    null
  );
  const [scholarshipAssignments, setScholarshipAssignments] = useState<
    Record<string, boolean>
  >({});
  const [scholarshipDetails, setScholarshipDetails] = useState<
    Record<string, StudentScholarshipWithDetails>
  >({});
  const [loadingScholarships, setLoadingScholarships] = useState(false);

  const canManageStudents = hasPermission('cohorts.manage_students');
  const canEditStudents = hasPermission('cohorts.edit_students');
  const canAssignScholarships = hasPermission('cohorts.assign_scholarships');

  const handleSendInvitation = async (student: CohortStudent) => {
    setInvitingStudentId(student.id);
    try {
      const invitationResult = await cohortStudentsService.sendCustomInvitation(
        student.id,
        profile?.user_id || ''
      );

      if (invitationResult.success) {
        // TODO: Send email via Edge Function or SendGrid
        // For now, just show success message
        toast.success('Invitation prepared successfully!');
        Logger.getInstance().info('Invitation URL generated', {
          url: invitationResult.data?.invitationUrl,
        });

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

  // Load scholarship assignments when students change
  useEffect(() => {
    loadScholarshipAssignments();
  }, [students, canAssignScholarships, loadScholarshipAssignments]);

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
  }

  return (
    <div className='space-y-4'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            {canAssignScholarships && <TableHead>Scholarship</TableHead>}
            {canManageStudents && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => (
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
              </TableCell>
              {canAssignScholarships && (
                <TableCell>
                  <div className='flex items-center gap-2'>
                    {scholarshipAssignments[student.id] ? (
                      <div className='flex-1 min-w-0'>
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
                        No scholarship
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
                          scholarshipAssignments[student.id]
                            ? 'Edit scholarship'
                            : 'Assign scholarship'
                        }
                        disabled={loadingScholarships}
                      >
                        {scholarshipAssignments[student.id] ? (
                          <CheckCircle className='h-4 w-4' />
                        ) : (
                          <Award className='h-4 w-4' />
                        )}
                      </Button>
                    </StudentScholarshipDialog>
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

                    {student.invite_status === 'pending' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleSendInvitation(student)}
                        disabled={invitingStudentId === student.id}
                        className='h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        title='Send invitation'
                      >
                        <Mail className='h-4 w-4' />
                      </Button>
                    )}

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
    </div>
  );
}
