import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CohortStudent } from '@/types/cohort';

interface EmailConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: CohortStudent | null;
  onConfirm: () => void;
}

export const EmailConfirmationDialog: React.FC<EmailConfirmationDialogProps> = ({
  open,
  onOpenChange,
  student,
  onConfirm,
}) => {
  if (!student) return null;

  const isPending = student.invite_status === 'pending';
  const title = isPending ? 'Send Invitation' : 'Resend Invitation';
  const description = isPending
    ? `Are you sure you want to send an invitation email to ${student.first_name} ${student.last_name}?`
    : `This student has already been sent an invitation. Would you like to resend it to ${student.first_name} ${student.last_name}?`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {title}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
