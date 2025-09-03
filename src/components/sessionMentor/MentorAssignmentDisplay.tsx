import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown, UserPlus, Users, Gavel, User } from 'lucide-react';
import type { SessionMentorAssignmentWithMentor, MentorRole } from '@/types/sessionMentorAssignment';

interface MentorAssignmentDisplayProps {
  assignments: SessionMentorAssignmentWithMentor[];
  className?: string;
  showRoleBadges?: boolean;
  compact?: boolean;
  maxDisplay?: number;
}

export const MentorAssignmentDisplay: React.FC<MentorAssignmentDisplayProps> = ({
  assignments,
  className = '',
  showRoleBadges = true,
  compact = false,
  maxDisplay = 3,
}) => {
  if (!assignments || assignments.length === 0) {
    return null;
  }

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

  const getRoleColor = (role: MentorRole) => {
    switch (role) {
      case 'trainer':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'judge':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEpicMasterIcon = (assignment: SessionMentorAssignmentWithMentor) => {
    if (assignment.is_epic_master) {
      return <Crown className="h-3 w-3 text-yellow-600" />;
    }
    if (assignment.is_associate_epic_master) {
      return <UserPlus className="h-3 w-3 text-blue-600" />;
    }
    return null;
  };

  // Sort assignments: Epic Master first, then Associate Epic Master, then others
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.is_epic_master && !b.is_epic_master) return -1;
    if (!a.is_epic_master && b.is_epic_master) return 1;
    if (a.is_associate_epic_master && !b.is_associate_epic_master) return -1;
    if (!a.is_associate_epic_master && b.is_associate_epic_master) return 1;
    return 0;
  });

  const displayAssignments = sortedAssignments.slice(0, maxDisplay);
  const remainingCount = Math.max(0, assignments.length - maxDisplay);

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {displayAssignments.map((assignment) => (
          <div key={assignment.id} className="relative">
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignment.mentor.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(assignment.mentor.first_name, assignment.mentor.last_name)}
              </AvatarFallback>
            </Avatar>
            {(assignment.is_epic_master || assignment.is_associate_epic_master) && (
              <div className="absolute -top-1 -right-1">
                {getEpicMasterIcon(assignment)}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {displayAssignments.map((assignment) => {
        const RoleIcon = getRoleIcon(assignment.role_type);
        
        return (
          <div
            key={assignment.id}
            className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={assignment.mentor.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(assignment.mentor.first_name, assignment.mentor.last_name)}
                </AvatarFallback>
              </Avatar>
              {(assignment.is_epic_master || assignment.is_associate_epic_master) && (
                <div className="absolute -top-1 -right-1">
                  {getEpicMasterIcon(assignment)}
                </div>
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
                {assignment.mentor.email}
              </p>
            </div>
            
            {showRoleBadges && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getRoleColor(assignment.role_type)}`}
              >
                <RoleIcon className="h-3 w-3 mr-1" />
                {assignment.role_type.charAt(0).toUpperCase() + assignment.role_type.slice(1)}
              </Badge>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div className="text-xs text-muted-foreground text-center py-1">
          +{remainingCount} more mentor{remainingCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
