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
} from '../alert-dialog';
import { Trash2 } from 'lucide-react';
import type { Session } from '../../../domains/sessions/types';

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  sessionNumber: number;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteSessionDialog: React.FC<DeleteSessionDialogProps> = ({
  open,
  onOpenChange,
  session,
  sessionNumber,
  onConfirm,
  isDeleting = false,
}) => {
  if (!session) return null;

  // Check if this is a CBL session
  const isCBLSession = [
    'cbl',
    'challenge_intro',
    'learn',
    'innovate',
    'transform',
    'reflection',
  ].includes(session.session_type);

  // Determine if this is an individual CBL session or part of a grouped set
  const isIndividualCBL = ['learn', 'innovate', 'transform'].includes(
    session.session_type
  );
  const isGroupedCBL = isCBLSession && !isIndividualCBL;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <Trash2 className='h-5 w-5 text-destructive' />
            {isGroupedCBL ? 'Delete CBL Challenge' : 'Delete Session'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isGroupedCBL ? (
              <>
                Are you sure you want to delete the entire CBL Challenge{' '}
                <strong>"{session.title}"</strong>?
                <br />
                <br />
                This will delete <strong>
                  all 3 CBL grouped sessions
                </strong>{' '}
                from this challenge:
                <br />
                • Challenge + Learn • Innovate • Transform + Reflection
                <br />
                <br />
                <strong>Warning:</strong> This action cannot be undone. All
                sessions will be permanently removed from your calendar.
              </>
            ) : (
              <>
                Are you sure you want to delete{' '}
                <strong>"{session.title}"</strong> (Session {sessionNumber})?
                {isIndividualCBL && (
                  <>
                    <br />
                    <br />
                    This is an individual {session.session_type} session that
                    was added separately from a CBL challenge.
                  </>
                )}
                <br />
                <br />
                This action cannot be undone. The session will be permanently
                removed from your calendar.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting
              ? 'Deleting...'
              : isGroupedCBL
                ? 'Delete Challenge'
                : 'Delete Session'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
