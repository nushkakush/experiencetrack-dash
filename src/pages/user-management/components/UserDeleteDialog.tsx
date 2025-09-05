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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, User, Trash2, Shield, Calendar } from 'lucide-react';
import { UserProfile } from '@/types/userManagement';
import { UserRole } from '@/types/auth';
import { format } from 'date-fns';

interface UserDeleteDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export const UserDeleteDialog: React.FC<UserDeleteDialogProps> = ({
  user,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      student: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      super_admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
      program_manager: 'bg-green-500/10 text-green-600 dark:text-green-400',
      fee_collector: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      partnerships_head:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      placement_coordinator:
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      applications_manager: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      application_reviewer: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      litmus_test_reviewer:
        'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    };
    return colors[role] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/10 text-green-600 dark:text-green-400',
      inactive: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      suspended: 'bg-red-500/10 text-red-600 dark:text-red-400',
      invited: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };
    return (
      colors[status as keyof typeof colors] ||
      'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='h-5 w-5' />
            {user.status === 'invited'
              ? 'Delete Invitation'
              : 'Delete User Account'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {user.status === 'invited'
              ? 'This will permanently delete the invitation and remove it from the system.'
              : 'This will permanently delete the user account and remove all associated data from the system.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* User Information Card */}
        <Card className='border-red-200/50 bg-red-500/5 dark:border-red-400/30 dark:bg-red-500/10'>
          <CardContent className='pt-4'>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                <div className='font-medium'>
                  {user.first_name} {user.last_name}
                </div>
              </div>

              <div className='text-sm text-muted-foreground'>{user.email}</div>

              <div className='flex items-center gap-2'>
                <Shield className='h-4 w-4 text-muted-foreground' />
                <Badge variant='secondary' className={getRoleColor(user.role)}>
                  {user.role.replace('_', ' ')}
                </Badge>
                <Badge
                  variant='secondary'
                  className={getStatusColor(user.status)}
                >
                  {user.status}
                </Badge>
              </div>

              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Calendar className='h-3 w-3' />
                Member since {format(new Date(user.created_at), 'MMM yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Message */}
        <div className='bg-red-500/5 border border-red-200/50 dark:bg-red-500/10 dark:border-red-400/30 rounded-lg p-3'>
          <div className='flex items-start gap-2'>
            <AlertTriangle className='h-4 w-4 text-red-600 dark:text-red-400 mt-0.5' />
            <div className='text-sm text-red-700 dark:text-red-300'>
              <p className='font-medium mb-1'>Warning:</p>
              <ul className='list-disc list-inside space-y-1 text-xs'>
                {user.status === 'invited' ? (
                  <>
                    <li>Invitation will be permanently deleted</li>
                    <li>User will not be able to accept this invitation</li>
                    <li>This action cannot be reversed</li>
                  </>
                ) : (
                  <>
                    <li>All user data will be permanently deleted</li>
                    <li>User will lose access to all system features</li>
                    <li>This action cannot be reversed</li>
                    <li>Associated records may be affected</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
          >
            <Trash2 className='h-4 w-4 mr-2' />
            {loading
              ? 'Deleting...'
              : user.status === 'invited'
                ? 'Delete Invitation'
                : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
