import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Trash2, UserCheck, UserX, Shield, AlertTriangle } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserRole } from '@/types/auth';
import { UserStatus, BulkUserAction } from '@/types/userManagement';

export const UserActions: React.FC = () => {
  const { selectedUsers, bulkAction } = useUserManagement();
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<BulkUserAction | null>(
    null
  );

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    setSelectedRole('');
    setSelectedStatus('');
  };

  const handleExecuteAction = () => {
    if (!selectedAction) return;

    let actionData: BulkUserAction;

    switch (selectedAction) {
      case 'delete':
        actionData = {
          action: 'delete',
          userIds: selectedUsers.map(user => user.user_id),
        };
        break;
      case 'change_role':
        if (!selectedRole) return;
        actionData = {
          action: 'change_role',
          userIds: selectedUsers.map(user => user.user_id),
          data: { role: selectedRole },
        };
        break;
      case 'change_status':
        if (!selectedStatus) return;
        actionData = {
          action: 'change_status',
          userIds: selectedUsers.map(user => user.user_id),
          data: { status: selectedStatus },
        };
        break;
      default:
        return;
    }

    setActionToConfirm(actionData);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (actionToConfirm) {
      await bulkAction(actionToConfirm);
      setShowConfirmDialog(false);
      setActionToConfirm(null);
      setSelectedAction('');
      setSelectedRole('');
      setSelectedStatus('');
    }
  };

  const getActionDescription = () => {
    if (!selectedAction) return '';

    const userCount = selectedUsers.length;
    const userText = userCount === 1 ? 'user' : 'users';

    switch (selectedAction) {
      case 'delete':
        return `Delete ${userCount} ${userText}`;
      case 'change_role':
        return `Change role to "${selectedRole.replace('_', ' ')}" for ${userCount} ${userText}`;
      case 'change_status':
        return `Change status to "${selectedStatus}" for ${userCount} ${userText}`;
      default:
        return '';
    }
  };

  const isActionValid = () => {
    switch (selectedAction) {
      case 'delete':
        return true;
      case 'change_role':
        return selectedRole !== '';
      case 'change_status':
        return selectedStatus !== '';
      default:
        return false;
    }
  };

  return (
    <div className='bg-blue-500/5 border border-blue-200/50 dark:bg-blue-500/10 dark:border-blue-400/30 rounded-lg p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Badge
            variant='secondary'
            className='bg-blue-500/10 text-blue-600 dark:text-blue-400'
          >
            {selectedUsers.length} selected
          </Badge>
          <span className='text-sm text-muted-foreground'>
            Bulk actions available
          </span>
        </div>

        <div className='flex items-center gap-2'>
          {/* Action Selector */}
          <Select value={selectedAction} onValueChange={handleActionChange}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Select action...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='delete'>
                <div className='flex items-center gap-2'>
                  <Trash2 className='h-4 w-4' />
                  Delete Users
                </div>
              </SelectItem>
              <SelectItem value='change_role'>
                <div className='flex items-center gap-2'>
                  <Shield className='h-4 w-4' />
                  Change Role
                </div>
              </SelectItem>
              <SelectItem value='change_status'>
                <div className='flex items-center gap-2'>
                  <UserCheck className='h-4 w-4' />
                  Change Status
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Role Selector (for change_role action) */}
          {selectedAction === 'change_role' && (
            <Select
              value={selectedRole}
              onValueChange={value => setSelectedRole(value as UserRole)}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Select new role...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='student'>Student</SelectItem>
                <SelectItem value='program_manager'>Program Manager</SelectItem>
                <SelectItem value='fee_collector'>Fee Collector</SelectItem>
                <SelectItem value='partnerships_head'>
                  Partnerships Head
                </SelectItem>
                <SelectItem value='placement_coordinator'>
                  Placement Coordinator
                </SelectItem>
                <SelectItem value='super_admin'>Super Admin</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Status Selector (for change_status action) */}
          {selectedAction === 'change_status' && (
            <Select
              value={selectedStatus}
              onValueChange={value => setSelectedStatus(value as UserStatus)}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Select new status...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='suspended'>Suspended</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Execute Button */}
          {selectedAction && (
            <Button
              onClick={handleExecuteAction}
              disabled={!isActionValid()}
              variant={selectedAction === 'delete' ? 'destructive' : 'default'}
              size='sm'
            >
              {selectedAction === 'delete' && (
                <Trash2 className='h-4 w-4 mr-2' />
              )}
              {selectedAction === 'change_role' && (
                <Shield className='h-4 w-4 mr-2' />
              )}
              {selectedAction === 'change_status' && (
                <UserCheck className='h-4 w-4 mr-2' />
              )}
              Execute
            </Button>
          )}
        </div>
      </div>

      {/* Action Description */}
      {selectedAction && (
        <div className='mt-2 text-sm text-muted-foreground'>
          {getActionDescription()}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-red-600' />
              Confirm Bulk Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionToConfirm && (
                <div className='space-y-2'>
                  <p>{getActionDescription()}</p>
                  <p className='text-sm text-muted-foreground'>
                    This action will affect {selectedUsers.length} user(s) and
                    cannot be undone.
                  </p>
                  {actionToConfirm.action === 'delete' && (
                    <div className='bg-red-500/5 border border-red-200/50 dark:bg-red-500/10 dark:border-red-400/30 rounded p-3'>
                      <p className='text-sm text-red-700 dark:text-red-300 font-medium'>
                        ⚠️ Warning: This will permanently delete the selected
                        users and all their data.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={
                actionToConfirm?.action === 'delete'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
