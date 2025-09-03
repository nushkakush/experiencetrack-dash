import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, UserPlus, Search, X, Building, MapPin } from 'lucide-react';
import { EpicMasterService } from '@/services/epicMaster.service';
import { MentorSearchDialog } from './MentorSearchDialog';
import type { EpicMasterAssignmentWithMentors, Mentor } from '@/types/epicMasterAssignment';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface EpicMasterAssignmentProps {
  cohortEpicId: string;
  epicName: string;
  assignment?: EpicMasterAssignmentWithMentors | null;
  loading?: boolean;
  onAssignmentChange?: (assignment: EpicMasterAssignmentWithMentors | null) => void;
}

export const EpicMasterAssignment: React.FC<EpicMasterAssignmentProps> = ({
  cohortEpicId,
  epicName,
  assignment,
  loading = false,
  onAssignmentChange,
}) => {
  const { user } = useAuth();
  const [isEpicMasterDialogOpen, setIsEpicMasterDialogOpen] = useState(false);
  const [isAssociateDialogOpen, setIsAssociateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleAssignEpicMaster = async (mentor: Mentor) => {
    if (!user) {
      toast.error('You must be logged in to assign epic masters');
      return;
    }

    setUpdating(true);
    try {
      const result = await EpicMasterService.assignEpicMasters({
        cohort_epic_id: cohortEpicId,
        epic_master_id: mentor.id,
        associate_epic_master_id: assignment?.associate_epic_master_id || null,
        created_by: user.id,
      });

      if (result.success && result.data) {
        toast.success(`${mentor.first_name} ${mentor.last_name} assigned as Epic Master`);
        onAssignmentChange?.(result.data);
      } else {
        toast.error(result.error || 'Failed to assign epic master');
      }
    } catch (error) {
      console.error('Error assigning epic master:', error);
      toast.error('Failed to assign epic master');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignAssociateEpicMaster = async (mentor: Mentor) => {
    if (!user) {
      toast.error('You must be logged in to assign epic masters');
      return;
    }

    setUpdating(true);
    try {
      const result = await EpicMasterService.assignEpicMasters({
        cohort_epic_id: cohortEpicId,
        epic_master_id: assignment?.epic_master_id || null,
        associate_epic_master_id: mentor.id,
        created_by: user.id,
      });

      if (result.success && result.data) {
        toast.success(`${mentor.first_name} ${mentor.last_name} assigned as Associate Epic Master`);
        onAssignmentChange?.(result.data);
      } else {
        toast.error(result.error || 'Failed to assign associate epic master');
      }
    } catch (error) {
      console.error('Error assigning associate epic master:', error);
      toast.error('Failed to assign associate epic master');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveEpicMaster = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const result = await EpicMasterService.updateEpicMasterAssignment(cohortEpicId, {
        epic_master_id: null,
      });

      if (result.success && result.data) {
        toast.success('Epic Master removed');
        onAssignmentChange?.(result.data);
      } else {
        toast.error(result.error || 'Failed to remove epic master');
      }
    } catch (error) {
      console.error('Error removing epic master:', error);
      toast.error('Failed to remove epic master');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveAssociateEpicMaster = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const result = await EpicMasterService.updateEpicMasterAssignment(cohortEpicId, {
        associate_epic_master_id: null,
      });

      if (result.success && result.data) {
        toast.success('Associate Epic Master removed');
        onAssignmentChange?.(result.data);
      } else {
        toast.error(result.error || 'Failed to remove associate epic master');
      }
    } catch (error) {
      console.error('Error removing associate epic master:', error);
      toast.error('Failed to remove associate epic master');
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Epic Master Assignments
          </CardTitle>
          <CardDescription>
            Assign epic master and associate epic master for {epicName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Epic Master Assignments
          </CardTitle>
          <CardDescription>
            Assign epic master and associate epic master for {epicName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Epic Master */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  Epic Master
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEpicMasterDialogOpen(true)}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {assignment?.epic_master ? 'Change' : 'Assign'}
                </Button>
              </div>

              {assignment?.epic_master ? (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignment.epic_master.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(assignment.epic_master.first_name, assignment.epic_master.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">
                        {assignment.epic_master.first_name} {assignment.epic_master.last_name}
                      </h5>
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.epic_master.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {assignment.epic_master.specialization && (
                          <Badge variant="secondary" className="text-xs">
                            {assignment.epic_master.specialization}
                          </Badge>
                        )}
                        {assignment.epic_master.current_company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span className="truncate">{assignment.epic_master.current_company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveEpicMaster}
                      disabled={updating}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No epic master assigned
                  </p>
                </div>
              )}
            </div>

            {/* Associate Epic Master */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  Associate Epic Master
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssociateDialogOpen(true)}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {assignment?.associate_epic_master ? 'Change' : 'Assign'}
                </Button>
              </div>

              {assignment?.associate_epic_master ? (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignment.associate_epic_master.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(assignment.associate_epic_master.first_name, assignment.associate_epic_master.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium truncate">
                        {assignment.associate_epic_master.first_name} {assignment.associate_epic_master.last_name}
                      </h5>
                      <p className="text-sm text-muted-foreground truncate">
                        {assignment.associate_epic_master.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {assignment.associate_epic_master.specialization && (
                          <Badge variant="secondary" className="text-xs">
                            {assignment.associate_epic_master.specialization}
                          </Badge>
                        )}
                        {assignment.associate_epic_master.current_company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span className="truncate">{assignment.associate_epic_master.current_company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAssociateEpicMaster}
                      disabled={updating}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No associate epic master assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentor Search Dialogs */}
      <MentorSearchDialog
        isOpen={isEpicMasterDialogOpen}
        onClose={() => setIsEpicMasterDialogOpen(false)}
        onSelect={handleAssignEpicMaster}
        title="Assign Epic Master"
        description={`Select a mentor to assign as Epic Master for ${epicName}`}
        excludeMentorId={assignment?.associate_epic_master_id}
      />

      <MentorSearchDialog
        isOpen={isAssociateDialogOpen}
        onClose={() => setIsAssociateDialogOpen(false)}
        onSelect={handleAssignAssociateEpicMaster}
        title="Assign Associate Epic Master"
        description={`Select a mentor to assign as Associate Epic Master for ${epicName}`}
        excludeMentorId={assignment?.epic_master_id}
      />
    </>
  );
};
