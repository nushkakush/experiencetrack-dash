import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  User, 
  Building, 
  Crown, 
  UserPlus, 
  X, 
  Users, 
  Gavel,
  Plus,
  Trash2 
} from 'lucide-react';
import { SessionMentorService } from '@/services/sessionMentor.service';
import { MentorsService } from '@/services/mentors.service';
import { EpicMasterService } from '@/services/epicMaster.service';
import { MentorAssignmentDisplay } from './MentorAssignmentDisplay';
import type { Mentor } from '@/types/mentor';
import type { 
  SessionMentorAssignmentWithMentor, 
  MentorRole,
  SessionRoleConfig 
} from '@/types/sessionMentorAssignment';
import type { EpicMasterAssignmentWithMentors } from '@/types/epicMasterAssignment';
import { getSessionRoleConfig } from '@/types/sessionMentorAssignment';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SessionMentorAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  sessionType: string;
  cohortEpicId: string;
  onAssignmentsChange?: () => void;
}

export const SessionMentorAssignmentDialog: React.FC<SessionMentorAssignmentDialogProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  sessionType,
  cohortEpicId,
  onAssignmentsChange,
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<SessionMentorAssignmentWithMentor[]>([]);
  const [epicMasterAssignment, setEpicMasterAssignment] = useState<EpicMasterAssignmentWithMentors | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const roleConfig = getSessionRoleConfig(sessionType);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      // Reset state when dialog closes
      setSearchTerm('');
      setCurrentAssignments([]);
      setEpicMasterAssignment(null);
    }
  }, [isOpen, sessionId, cohortEpicId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current assignments, available mentors, and epic master assignments in parallel
      const [assignmentsResult, mentorsResult, epicMasterResult] = await Promise.all([
        SessionMentorService.getSessionMentorAssignments(sessionId),
        MentorsService.listMentors(),
        EpicMasterService.getEpicMasterAssignment(cohortEpicId),
      ]);

      if (assignmentsResult.success) {
        setCurrentAssignments(assignmentsResult.data || []);
      }

      if (mentorsResult.success && mentorsResult.data) {
        // Filter out inactive mentors
        const availableMentors = mentorsResult.data.filter(
          mentor => mentor.status === 'active'
        );
        setMentors(availableMentors);
      }

      if (epicMasterResult.success) {
        setEpicMasterAssignment(epicMasterResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    // Filter out Epic Master and Associate Epic Master if they exist (to avoid duplication)
    const isEpicMaster = epicMasterAssignment?.epic_master?.id === mentor.id;
    const isAssociateEpicMaster = epicMasterAssignment?.associate_epic_master?.id === mentor.id;
    
    if (isEpicMaster || isAssociateEpicMaster) {
      return false;
    }

    // Apply search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.first_name.toLowerCase().includes(searchLower) ||
      mentor.last_name.toLowerCase().includes(searchLower) ||
      mentor.email.toLowerCase().includes(searchLower) ||
      mentor.specialization?.toLowerCase().includes(searchLower) ||
      mentor.current_company?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssignMentor = async (mentor: Mentor, isEpicMaster = false, isAssociateEpicMaster = false) => {
    if (!user) {
      toast.error('You must be logged in to assign mentors');
      return;
    }

    // Check if mentor is already assigned with the same role
    const existingAssignment = currentAssignments.find(
      assignment => 
        assignment.mentor_id === mentor.id && 
        assignment.role_type === roleConfig.role
    );

    if (existingAssignment) {
      toast.error(`${mentor.first_name} ${mentor.last_name} is already assigned as ${roleConfig.label}`);
      return;
    }

    // Check if multiple assignments are allowed
    if (!roleConfig.allowMultiple && currentAssignments.length > 0) {
      toast.error(`Only one ${roleConfig.label.toLowerCase()} can be assigned to this session type`);
      return;
    }

    setAssigning(true);
    try {
      const result = await SessionMentorService.assignMentorToSession({
        session_id: sessionId,
        mentor_id: mentor.id,
        role_type: roleConfig.role,
        is_epic_master: isEpicMaster,
        is_associate_epic_master: isAssociateEpicMaster,
        assigned_by: user.id,
      });

      if (result.success && result.data) {
        setCurrentAssignments(prev => [...prev, result.data]);
        const roleLabel = isEpicMaster ? 'Epic Master' : isAssociateEpicMaster ? 'Associate Epic Master' : roleConfig.label;
        toast.success(`${mentor.first_name} ${mentor.last_name} assigned as ${roleLabel}`);
        onAssignmentsChange?.();
      } else {
        toast.error(result.error || 'Failed to assign mentor');
      }
    } catch (error) {
      console.error('Error assigning mentor:', error);
      toast.error('Failed to assign mentor');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, mentorName: string) => {
    setAssigning(true);
    try {
      const result = await SessionMentorService.removeMentorFromSession(assignmentId);

      if (result.success) {
        setCurrentAssignments(prev => prev.filter(a => a.id !== assignmentId));
        toast.success(`${mentorName} removed from session`);
        onAssignmentsChange?.();
      } else {
        toast.error(result.error || 'Failed to remove mentor');
      }
    } catch (error) {
      console.error('Error removing mentor:', error);
      toast.error('Failed to remove mentor');
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleIcon = (role: MentorRole) => {
    switch (role) {
      case 'trainer':
        return Users;
      case 'judge':
        return Gavel;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon(roleConfig.role);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5" />
            Assign {roleConfig.roleLabel}s to Session
          </DialogTitle>
          <DialogDescription>
            {sessionTitle} - {roleConfig.description}
            {roleConfig.allowMultiple && (
              <span className="text-green-600 ml-2">(Multiple assignments allowed)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Current Assignments */}
          {currentAssignments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Current Assignments</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {currentAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-2 bg-muted/30 rounded-md"
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={assignment.mentor.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(assignment.mentor.first_name, assignment.mentor.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      {assignment.is_epic_master && (
                        <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-600" />
                      )}
                      {assignment.is_associate_epic_master && (
                        <UserPlus className="absolute -top-1 -right-1 h-3 w-3 text-blue-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {assignment.mentor.first_name} {assignment.mentor.last_name}
                        </p>
                        {(assignment.is_epic_master || assignment.is_associate_epic_master) && (
                          <Badge variant="outline" className="text-xs">
                            {assignment.is_epic_master ? 'Epic Master' : 'Associate Epic Master'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {assignment.mentor.specialization} • {assignment.mentor.current_company}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssignment(
                        assignment.id, 
                        `${assignment.mentor.first_name} ${assignment.mentor.last_name}`
                      )}
                      disabled={assigning}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator />
            </div>
          )}

          {/* Epic Master Quick Assign */}
          {epicMasterAssignment && (epicMasterAssignment.epic_master || epicMasterAssignment.associate_epic_master) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                Quick Assign Epic Masters
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {epicMasterAssignment.epic_master && (
                  <Button
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => handleAssignMentor(epicMasterAssignment.epic_master!, true, false)}
                    disabled={assigning || currentAssignments.some(a => a.mentor_id === epicMasterAssignment.epic_master!.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={epicMasterAssignment.epic_master.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(epicMasterAssignment.epic_master.first_name, epicMasterAssignment.epic_master.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {epicMasterAssignment.epic_master.first_name} {epicMasterAssignment.epic_master.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Epic Master</p>
                      </div>
                      <Crown className="h-4 w-4 text-yellow-600 ml-auto" />
                    </div>
                  </Button>
                )}
                
                {epicMasterAssignment.associate_epic_master && (
                  <Button
                    variant="outline"
                    className="justify-start p-3 h-auto"
                    onClick={() => handleAssignMentor(epicMasterAssignment.associate_epic_master!, false, true)}
                    disabled={assigning || currentAssignments.some(a => a.mentor_id === epicMasterAssignment.associate_epic_master!.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={epicMasterAssignment.associate_epic_master.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(epicMasterAssignment.associate_epic_master.first_name, epicMasterAssignment.associate_epic_master.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {epicMasterAssignment.associate_epic_master.first_name} {epicMasterAssignment.associate_epic_master.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">Associate Epic Master</p>
                      </div>
                      <UserPlus className="h-4 w-4 text-blue-600 ml-auto" />
                    </div>
                  </Button>
                )}
              </div>
              <Separator />
            </div>
          )}

          {/* Search and Browse All Mentors */}
          <div className="space-y-3 flex-1 min-h-0">
            <h4 className="font-medium text-sm">Browse All Mentors</h4>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search mentors by name, email, specialization, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mentors List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No mentors found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                filteredMentors.map((mentor) => {
                  const isAlreadyAssigned = currentAssignments.some(a => a.mentor_id === mentor.id);
                  
                  return (
                    <div
                      key={mentor.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mentor.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(mentor.first_name, mentor.last_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate text-sm">
                          {mentor.first_name} {mentor.last_name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {mentor.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {mentor.specialization && (
                            <Badge variant="secondary" className="text-xs">
                              {mentor.specialization}
                            </Badge>
                          )}
                          {mentor.current_company && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{mentor.current_company}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAssignMentor(mentor)}
                        disabled={assigning || isAlreadyAssigned || (!roleConfig.allowMultiple && currentAssignments.length > 0)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        {isAlreadyAssigned ? 'Assigned' : 'Assign'}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
