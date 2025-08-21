import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Users,
  BookOpen,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useCohortAssignments } from '@/hooks/useCohortAssignments';
import { useCohorts } from '@/hooks/useCohorts';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';
import type { UserProfile } from '@/types/auth';
import type { Cohort } from '@/types/cohort';
import type { BulkCohortAssignmentInput, BulkCohortRemovalInput } from '@/types/cohortAssignment';

// Add interface for user details
interface UserDetails {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface CohortAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'assign-to-user' | 'assign-to-cohort';
  targetId?: string;
  userDetails?: UserDetails; // Add user details for assign-to-user mode
  cohortDetails?: { id: string; name: string; cohort_id: string }; // Add cohort details for assign-to-cohort mode
  onAssignmentChanged?: () => void;
}

export default function CohortAssignmentDialog({
  open,
  onOpenChange,
  mode,
  targetId,
  userDetails,
  cohortDetails,
  onAssignmentChanged,
}: CohortAssignmentDialogProps) {
  const { profile } = useAuth();
  const { hasPermission } = useFeaturePermissions();
  const { cohorts, isLoading: cohortsLoading } = useCohorts();
  const { state: userState, loadUsers } = useUserManagement();
  const {
    assignedCohorts,
    assignedUsers,
    loading: assignmentsLoading,
    error: assignmentsError,
    bulkAssignCohorts,
    bulkRemoveCohorts,
    loadUserAssignments,
    loadCohortAssignments,
    loadAssignedCohortsForUser,
    loadUsersForCohort,
  } = useCohortAssignments();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const canManageAssignments = hasPermission('users.manage') || profile?.role === 'super_admin';

  useEffect(() => {
    if (!open || !targetId || !canManageAssignments) return;

    if (mode === 'assign-to-user') {
      loadUserAssignments(targetId);
      loadAssignedCohortsForUser(targetId);
    } else if (mode === 'assign-to-cohort') {
      loadCohortAssignments(targetId);
      loadUsersForCohort(targetId);
    }
  }, [open, targetId, mode, canManageAssignments]);

  useEffect(() => {
    if (open && canManageAssignments) {
      loadUsers();
    }
  }, [open, canManageAssignments, loadUsers]);

  const filteredItems = React.useMemo(() => {
    if (mode === 'assign-to-user') {
      return cohorts?.filter(cohort => 
        cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cohort.cohort_id.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];
    } else {
      return userState.users.filter(user => 
        (user.role === 'program_manager' || user.role === 'fee_collector') &&
        (user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  }, [mode, cohorts, userState.users, searchQuery]);

  const currentlyAssigned = React.useMemo(() => {
    if (mode === 'assign-to-user') {
      return assignedCohorts.map(cohort => cohort.id);
    } else {
      return assignedUsers.map(user => user.user_id);
    }
  }, [mode, assignedCohorts, assignedUsers]);

  // Set currently assigned items as selected when dialog opens
  useEffect(() => {
    if (open && currentlyAssigned.length > 0) {
      setSelectedItems(currentlyAssigned);
    } else if (open) {
      setSelectedItems([]);
    }
  }, [open, currentlyAssigned]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const availableItems = filteredItems
      .map(item => mode === 'assign-to-user' ? (item as Cohort).id : (item as UserProfile).user_id);
    
    setSelectedItems(availableItems);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleOperation = async () => {
    if (!targetId) return;

    setLoading(true);
    try {
      let success = false;

      // Determine which items to assign and which to remove
      const itemsToAssign = selectedItems.filter(id => !currentlyAssigned.includes(id));
      const itemsToRemove = currentlyAssigned.filter(id => !selectedItems.includes(id));

      // Handle assignments
      if (itemsToAssign.length > 0) {
        if (mode === 'assign-to-user') {
          const input: BulkCohortAssignmentInput = {
            user_ids: [targetId],
            cohort_ids: itemsToAssign,
          };
          success = await bulkAssignCohorts(input);
        } else {
          const input: BulkCohortAssignmentInput = {
            user_ids: itemsToAssign,
            cohort_ids: [targetId],
          };
          success = await bulkAssignCohorts(input);
        }
      }

      // Handle removals
      if (itemsToRemove.length > 0) {
        if (mode === 'assign-to-user') {
          const input: BulkCohortRemovalInput = {
            user_ids: [targetId],
            cohort_ids: itemsToRemove,
          };
          success = await bulkRemoveCohorts(input);
        } else {
          const input: BulkCohortRemovalInput = {
            user_ids: itemsToRemove,
            cohort_ids: [targetId],
          };
          success = await bulkRemoveCohorts(input);
        }
      }

      if (success) {
        const assignMessage = itemsToAssign.length > 0 ? `assigned ${itemsToAssign.length}` : '';
        const removeMessage = itemsToRemove.length > 0 ? `removed ${itemsToRemove.length}` : '';
        const actionMessage = [assignMessage, removeMessage].filter(Boolean).join(' and ');
        
        if (actionMessage) {
          toast.success(
            `Successfully ${actionMessage} ${mode === 'assign-to-user' ? 'cohorts' : 'users'}`
          );
        } else {
          toast.success('No changes made');
        }
        
        // Refresh the data
        if (mode === 'assign-to-user') {
          await loadAssignedCohortsForUser(targetId);
        } else {
          await loadUsersForCohort(targetId);
        }
        
        setSelectedItems([]);
        onAssignmentChanged?.();
        onOpenChange(false);
      } else {
        toast.error('Failed to complete operation');
      }
    } catch (error) {
      console.error('Error during operation:', error);
      toast.error('An error occurred during the operation');
    } finally {
      setLoading(false);
    }
  };

  const getDialogInfo = () => {
    if (mode === 'assign-to-user') {
      const userInfo = userDetails ? `${userDetails.first_name} ${userDetails.last_name} (${userDetails.email})` : 'this user';
      return {
        title: 'Manage Cohort Assignments',
        description: `Assign or remove cohorts for ${userInfo}`,
        itemLabel: 'Cohorts',
        itemSingular: 'cohort',
        itemPlural: 'cohorts',
      };
    } else {
      const cohortInfo = cohortDetails ? `${cohortDetails.name} (${cohortDetails.cohort_id})` : 'this cohort';
      return {
        title: 'Manage User Assignments',
        description: `Assign or remove users for ${cohortInfo}`,
        itemLabel: 'Users',
        itemSingular: 'user',
        itemPlural: 'users',
      };
    }
  };

  const dialogInfo = getDialogInfo();

  if (!canManageAssignments) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              You don't have permission to manage cohort assignments.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'assign-to-user' ? <Users className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
            {dialogInfo.title}
          </DialogTitle>
          <DialogDescription>{dialogInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Currently assigned: {currentlyAssigned.length}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${dialogInfo.itemLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredItems.length === 0}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                disabled={selectedItems.length === 0}
              >
                Clear Selection
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedItems.length} {selectedItems.length === 1 ? dialogInfo.itemSingular : dialogInfo.itemPlural} selected
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md p-4">
            {assignmentsLoading || cohortsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : assignmentsError ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Error loading assignments: {assignmentsError}</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {dialogInfo.itemLabel.toLowerCase()} found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const itemId = mode === 'assign-to-user' ? (item as Cohort).id : (item as UserProfile).user_id;
                  const isAssigned = currentlyAssigned.includes(itemId);
                  const isSelected = selectedItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`flex items-center space-x-3 p-2 rounded-md border ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleItemToggle(itemId)}
                      />
                      <div className="flex-1 min-w-0">
                        {mode === 'assign-to-user' ? (
                          <div>
                            <div className="font-medium">{(item as Cohort).name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {(item as Cohort).cohort_id}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              {(item as UserProfile).first_name} {(item as UserProfile).last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {(item as UserProfile).email}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAssigned && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Currently Assigned
                          </Badge>
                        )}
                        {!isAssigned && (
                          <Badge variant="outline" className="text-xs">
                            Not Assigned
                          </Badge>
                        )}
                        {mode === 'assign-to-cohort' && (
                          <Badge variant="outline" className="text-xs">
                            {(item as UserProfile).role.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleOperation}
            disabled={selectedItems.length === 0 || loading}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Update {selectedItems.length} {selectedItems.length === 1 ? dialogInfo.itemSingular : dialogInfo.itemPlural}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
