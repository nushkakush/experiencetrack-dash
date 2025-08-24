import React from 'react';
import { Button } from '@/components/ui/button';
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
import { Edit2, Mail, Trash2, UserX } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import EditStudentDialog from '../EditStudentDialog';

interface StudentActionsProps {
  student: CohortStudent;
  canEditStudents: boolean;
  deletingStudentId: string | null;
  invitingStudentId: string | null;
  onStudentUpdated?: (studentId: string, updates: Partial<CohortStudent>) => void;
  onStudentDeleted: () => void;
  onOpenEmailConfirmation: (student: CohortStudent) => void;
  onMarkAsDroppedOut: (student: CohortStudent) => void;
  onDeleteStudent: (studentId: string) => void;
  shouldShowEmailOption: (student: CohortStudent) => boolean;
}

export const StudentActions: React.FC<StudentActionsProps> = ({
  student,
  canEditStudents,
  deletingStudentId,
  invitingStudentId,
  onStudentUpdated,
  onStudentDeleted,
  onOpenEmailConfirmation,
  onMarkAsDroppedOut,
  onDeleteStudent,
  shouldShowEmailOption,
}) => {
  return (
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
          onClick={() => onOpenEmailConfirmation(student)}
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
        onClick={() => onMarkAsDroppedOut(student)}
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
              onClick={() => onDeleteStudent(student.id)}
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
  );
};
