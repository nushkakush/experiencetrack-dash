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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  SortAsc,
  SortDesc,
  BookOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useCohortAssignments } from '@/hooks/useCohortAssignments';
import { CohortAssignmentService } from '@/services/cohortAssignment.service';
import { UserProfile } from '@/types/userManagement';
import { UserRole } from '@/types/auth';
import { UserDetailsDialog, UserDeleteDialog } from './';
import CohortAssignmentDialog from '@/components/cohorts/CohortAssignmentDialog';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface UserTableProps {
  showOnlyRegistered?: boolean;
  showOnlyInvited?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  showOnlyRegistered,
  showOnlyInvited,
}) => {
  const { profile } = useAuth();
  const { hasPermission } = useFeaturePermissions();
  const {
    state,
    toggleUserSelection,
    selectAllUsers,
    isAllSelected,
    deleteUser,
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cohortAssignmentDialogOpen, setCohortAssignmentDialogOpen] = useState(false);
  const [userForCohortAssignment, setUserForCohortAssignment] = useState<UserProfile | null>(null);
  const [userCohortAssignments, setUserCohortAssignments] = useState<Record<string, string[]>>({});
  const { loadAssignedCohortsForUser } = useCohortAssignments();

  // Update selectedUser when user data changes (e.g., after refresh)
  useEffect(() => {
    if (selectedUser) {
      const updatedUser = state.users.find(
        u => u.user_id === selectedUser.user_id
      );
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  }, [state.users, selectedUser]);

  const handleSort = (column: string) => {
    const newOrder =
      state.sortBy === column && state.sortOrder === 'asc' ? 'desc' : 'asc';
    // TODO: Implement sorting through the hook
    console.log('Sort by', column, newOrder);
  };

  const handleManageCohorts = (user: UserProfile) => {
    setUserForCohortAssignment(user);
    setCohortAssignmentDialogOpen(true);
  };

  const handleAssignmentChanged = async () => {
    // Refresh cohort assignments for all users
    const assignments: Record<string, string[]> = {};
    
    for (const user of state.users) {
      if (canAssignCohortsToUser(user)) {
        try {
          const result = await CohortAssignmentService.getAssignedCohortsForUser(user.user_id);
          if (result.success && result.data && result.data.length > 0) {
            assignments[user.user_id] = result.data.map(cohort => cohort.name);
          } else {
            assignments[user.user_id] = [];
          }
        } catch (error) {
          console.error(`Error loading assignments for user ${user.user_id}:`, error);
          assignments[user.user_id] = [];
        }
      }
    }
    
    setUserCohortAssignments(assignments);
  };

  const canManageCohortAssignments = hasPermission('users.manage') || profile?.role === 'super_admin';
  const canAssignCohortsToUser = useCallback((user: UserProfile) => {
    return canManageCohortAssignments && 
           (user.role === 'program_manager' || user.role === 'fee_collector');
  }, [canManageCohortAssignments]);

  // Load cohort assignments for all users
  useEffect(() => {
    const loadAllCohortAssignments = async () => {
      const assignments: Record<string, string[]> = {};
      
      for (const user of state.users) {
        if (canAssignCohortsToUser(user)) {
          try {
            const result = await CohortAssignmentService.getAssignedCohortsForUser(user.user_id);
            if (result.success && result.data && result.data.length > 0) {
              assignments[user.user_id] = result.data.map(cohort => cohort.name);
            } else {
              assignments[user.user_id] = [];
            }
          } catch (error) {
            console.error(`Error loading assignments for user ${user.user_id}:`, error);
            assignments[user.user_id] = [];
          }
        }
      }
      
      setUserCohortAssignments(assignments);
    };

    if (state.users.length > 0) {
      loadAllCohortAssignments();
    }
  }, [state.users, canAssignCohortsToUser]);

  const getRoleColor = (role: UserRole) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-red-100 text-red-800',
      program_manager: 'bg-green-100 text-green-800',
      fee_collector: 'bg-yellow-100 text-yellow-800',
      partnerships_head: 'bg-purple-100 text-purple-800',
      placement_coordinator: 'bg-indigo-100 text-indigo-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      invited: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSortIcon = (column: string) => {
    if (state.sortBy !== column) {
      return <SortAsc className='h-4 w-4' />;
    }
    return state.sortOrder === 'asc' ? (
      <ChevronUp className='h-4 w-4' />
    ) : (
      <ChevronDown className='h-4 w-4' />
    );
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.user_id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  if (state.loading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex items-center space-x-4'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-8' />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={selectAllUsers}
                  aria-label='Select all users'
                />
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-medium'
                  onClick={() => handleSort('first_name')}
                >
                  Name
                  {getSortIcon('first_name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-medium'
                  onClick={() => handleSort('email')}
                >
                  Email
                  {getSortIcon('email')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-medium'
                  onClick={() => handleSort('role')}
                >
                  Role
                  {getSortIcon('role')}
                </Button>
              </TableHead>
              <TableHead>
                <div className='font-medium'>Cohorts</div>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-medium'
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-medium'
                  onClick={() => handleSort('created_at')}
                >
                  Created
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className='w-12'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              // Filter users based on props
              let filteredUsers = state.users;
              if (showOnlyRegistered) {
                filteredUsers = state.users.filter(
                  user => user.status !== 'invited'
                );
              } else if (showOnlyInvited) {
                filteredUsers = state.users.filter(
                  user => user.status === 'invited'
                );
              }

              if (filteredUsers.length === 0) {
                return (
                  <TableRow>
                                      <TableCell
                    colSpan={8}
                    className='text-center py-8 text-muted-foreground'
                  >
                      {showOnlyRegistered
                        ? 'No registered users found'
                        : showOnlyInvited
                          ? 'No invited users found'
                          : 'No users found'}
                    </TableCell>
                  </TableRow>
                );
              }

              return filteredUsers.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <Checkbox
                      checked={state.selectedUsers.includes(user.user_id)}
                      onCheckedChange={() => toggleUserSelection(user.user_id)}
                      aria-label={`Select ${user.first_name} ${user.last_name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={user.avatar_url}
                        name={`${user.first_name} ${user.last_name}`}
                        size="md"
                      />
                      <div className='font-medium'>
                        {user.first_name} {user.last_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm text-muted-foreground'>
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={getRoleColor(user.role)}
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canAssignCohortsToUser(user) ? (
                      <div className="flex flex-wrap gap-1">
                        {userCohortAssignments[user.user_id]?.length > 0 ? (
                          userCohortAssignments[user.user_id].slice(0, 2).map((cohortName, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cohortName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No cohorts assigned</span>
                        )}
                        {userCohortAssignments[user.user_id]?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{userCohortAssignments[user.user_id].length - 2} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={getStatusColor(user.status)}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm text-muted-foreground'>
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye className='h-4 w-4 mr-2' />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit User
                        </DropdownMenuItem>
                        {canAssignCohortsToUser(user) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleManageCohorts(user)}>
                              <BookOpen className='h-4 w-4 mr-2' />
                              Manage Cohorts
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className='text-red-600'
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {state.pagination.total > state.pagination.pageSize && (
        <div className='flex items-center justify-between mt-4'>
          <div className='text-sm text-muted-foreground'>
            Showing{' '}
            {(state.pagination.page - 1) * state.pagination.pageSize + 1} to{' '}
            {Math.min(
              state.pagination.page * state.pagination.pageSize,
              state.pagination.total
            )}{' '}
            of {state.pagination.total} users
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={state.pagination.page === 1}
              onClick={() => {
                // TODO: Implement pagination through the hook
                console.log('Previous page');
              }}
            >
              Previous
            </Button>
            <span className='text-sm'>
              Page {state.pagination.page} of{' '}
              {Math.ceil(state.pagination.total / state.pagination.pageSize)}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={
                state.pagination.page >=
                Math.ceil(state.pagination.total / state.pagination.pageSize)
              }
              onClick={() => {
                // TODO: Implement pagination through the hook
                console.log('Next page');
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
        />
      )}

      {userToDelete && (
        <UserDeleteDialog
          user={userToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
        />
      )}

      {/* Cohort Assignment Dialog */}
      {userForCohortAssignment && (
        <CohortAssignmentDialog
          open={cohortAssignmentDialogOpen}
          onOpenChange={(open) => {
            setCohortAssignmentDialogOpen(open);
            if (!open) {
              // Refresh cohort assignments when dialog closes
              handleAssignmentChanged();
            }
          }}
          mode="assign-to-user"
          targetId={userForCohortAssignment.user_id}
          userDetails={{
            user_id: userForCohortAssignment.user_id,
            first_name: userForCohortAssignment.first_name || '',
            last_name: userForCohortAssignment.last_name || '',
            email: userForCohortAssignment.email || '',
            role: userForCohortAssignment.role,
          }}
          onAssignmentChanged={handleAssignmentChanged}
        />
      )}
    </>
  );
};
