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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Mentor } from '@/types/mentor';

interface DeleteMentorDialogProps {
  mentor: Mentor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteMentorDialog: React.FC<DeleteMentorDialogProps> = ({
  mentor,
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}) => {
  if (!mentor) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Mentor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this mentor? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Mentor Info */}
        <div className='flex items-center gap-3 p-4 bg-muted/50 rounded-lg'>
          <Avatar className='h-12 w-12'>
            <AvatarImage src={mentor.avatar_url || ''} alt={`${mentor.first_name} ${mentor.last_name}`} />
            <AvatarFallback>
              {getInitials(mentor.first_name, mentor.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className='font-semibold'>{mentor.first_name} {mentor.last_name}</h3>
            <p className='text-sm text-muted-foreground'>{mentor.email}</p>
            {mentor.specialization && (
              <p className='text-sm text-muted-foreground'>{mentor.specialization}</p>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            {loading ? 'Deleting...' : 'Delete Mentor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMentorDialog;
