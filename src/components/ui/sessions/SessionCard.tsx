import React, { useState } from 'react';
import { Badge } from '../badge';
import { Button } from '../button';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { X, Edit2, Crown, UserPlus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Session } from '../../../domains/sessions/types';
import { SessionService } from '../../../domains/sessions/services/SessionService';
import type { PlannedSession } from '../../../services/sessionPlanningService';
import type { SessionMentorAssignmentWithMentor } from '../../../types/sessionMentorAssignment';

interface SessionCardProps {
  session: Session;
  sessionNumber: number;
  onClick?: () => void;
  className?: string;
  onDragStart?: (e: React.DragEvent, session: Session) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDelete?: (session: Session, sessionNumber: number) => void;
  onUpdate?: (sessionId: string, updates: { title: string }) => Promise<void>;
  mentorAssignments?: SessionMentorAssignmentWithMentor[];
  draggable?: boolean;
  challengeTitle?: string;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  sessionNumber,
  onClick,
  className,
  onDragStart,
  onDragEnd,
  onDelete,
  onUpdate,
  mentorAssignments = [],
  draggable = true,
  challengeTitle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.title || 'Untitled');

  // Helper function to get mentor initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Sort mentors: Epic Master first, then Associate Epic Master, then others
  const sortedMentorAssignments = [...mentorAssignments].sort((a, b) => {
    if (a.is_epic_master && !b.is_epic_master) return -1;
    if (!a.is_epic_master && b.is_epic_master) return 1;
    if (a.is_associate_epic_master && !b.is_associate_epic_master) return -1;
    if (!a.is_associate_epic_master && b.is_associate_epic_master) return 1;
    return 0;
  });

  // Get session config with fallback for unknown types (like old CBL sessions)
  const sessionConfig = SessionService.getSessionTypeConfig(
    session.session_type
  ) || {
    type: session.session_type,
    label: session.session_type.toUpperCase(),
    icon: () => null,
    color:
      'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-500/25',
    description: 'Session',
  };

  // Get session type emoji(s) - returns array for dual emojis
  const getSessionEmojis = (sessionType: string, session: PlannedSession) => {
    // Check if this is a mock challenge session by looking at the challenge title or cbl_challenge_id
    const isMockChallenge =
      session.challenge_title?.toLowerCase().includes('mock') ||
      (session.cbl_challenge_id && session.original_cbl);

    switch (sessionType) {
      case 'challenge_intro':
        return ['🎯', '📚']; // Challenge + Learn
      case 'learn':
        return ['📚'];
      case 'innovate':
        // If this is a mock challenge session with innovate type, show challenge + innovate
        if (isMockChallenge && session.session_number === 1) {
          return ['🎯', '💡']; // Challenge + Innovate for mock challenge first session
        }
        return ['💡'];
      case 'transform':
        // If this is a mock challenge session with transform type, show transform + reflection
        if (isMockChallenge && session.session_number === 2) {
          return ['⚡', '👁️']; // Transform + Reflection for mock challenge second session
        }
        return ['⚡', '👁️']; // Transform + Reflection
      case 'reflection':
        return ['👁️'];
      case 'mock_challenge':
        return ['🎯', '⚡', '👁️']; // Challenge + Transform + Reflection
      case 'masterclass':
        return ['🎓'];
      case 'workshop':
        return ['🔧'];
      case 'gap':
        return ['⚡'];
      case 'cbl':
        return ['🎯', '📚']; // Default CBL also shows challenge + learn
      default:
        return ['🎯'];
    }
  };

  // Debug logging for SessionCard
  if (session.session_date && new Date(session.session_date).getDate() === 3) {
    console.log(
      `🟢 SessionCard Debug for ${session.title} (S${session.session_number}) on ${session.session_date}:`
    );
    console.log(`  - Session type: ${session.session_type}`);
    console.log(`  - Container uses: w-full h-full rounded-lg p-3`);
    console.log(`  - Flex layout: flex flex-col justify-between`);
  }

  // Debug logging for challenge title footer
  const isCBLType = [
    'cbl',
    'challenge_intro',
    'learn',
    'innovate',
    'transform',
    'reflection',
    'mock_challenge',
  ].includes(session.session_type);
  const hasChallengeId = !!session.cbl_challenge_id;
  const hasChallengeTitle = !!(session.challenge_title || challengeTitle);

  console.log(`🔍 SessionCard Challenge Footer Debug for "${session.title}":`, {
    sessionType: session.session_type,
    isCBLType,
    cblChallengeId: session.cbl_challenge_id,
    hasChallengeId,
    sessionChallengeTitle: session.challenge_title,
    propChallengeTitle: challengeTitle,
    hasChallengeTitle,
    shouldShowFooter: isCBLType && hasChallengeId,
  });

  // Additional detailed logging for the blue card issue
  if (session.title === 'dxXZ') {
    console.log(`🔍 DETAILED DEBUG for "dxXZ" session:`, {
      fullSession: session,
      challengeTitleProp: challengeTitle,
      sessionType: session.session_type,
      cblChallengeId: session.cbl_challenge_id,
      challengeTitle: session.challenge_title,
      isCBLType,
      hasChallengeId,
      hasChallengeTitle,
      shouldShowFooter: isCBLType && hasChallengeId,
      footerCondition: `isCBLType (${isCBLType}) && hasChallengeId (${hasChallengeId}) = ${isCBLType && hasChallengeId}`,
    });
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.setData('sessionType', session.session_type);
    e.dataTransfer.setData('sessionTitle', session.title);
    e.dataTransfer.setData('sessionDescription', session.title); // Use title as description
    e.dataTransfer.setData('sessionNumber', sessionNumber.toString());
    e.dataTransfer.setData('sessionDate', session.session_date);
    e.dataTransfer.effectAllowed = 'move';

    if (onDragStart) {
      onDragStart(e, session);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(session, sessionNumber);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onUpdate && editName.trim() !== '') {
      try {
        await onUpdate(session.id, { title: editName.trim() });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update session title:', error);
        // Reset to original title on error
        setEditName(session.title || 'Untitled');
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditName(session.title || 'Untitled');
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'w-full h-full rounded-lg p-3 shadow-sm border border-white/10 hover:shadow-md transition-all cursor-pointer relative group',
        'flex flex-col justify-between',
        sessionConfig.color,
        isDragging && 'opacity-50 scale-95 rotate-2',
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Delete Button - aligned with header elements */}
      {onDelete && (
        <Button
          variant='ghost'
          size='sm'
          className='absolute top-3 right-3 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-600 text-white rounded-full'
          onClick={handleDelete}
          title='Delete session'
        >
          <X className='h-3 w-3' />
        </Button>
      )}

      {/* Session Header */}
      <div className='flex items-center gap-2'>
        <div className='flex items-center gap-1'>
          {getSessionEmojis(session.session_type, session).map(
            (emoji, index) => (
              <div
                key={index}
                className='flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs'
              >
                {emoji}
              </div>
            )
          )}
        </div>
        <Badge
          variant='secondary'
          className='text-xs px-2 py-1 h-6 bg-white/20 text-white border-white/30'
        >
          {session.status}
        </Badge>
      </div>

      {/* Mentor Avatars */}
      {sortedMentorAssignments.length > 0 && (
        <div className='flex justify-center items-center gap-1 my-2'>
          {sortedMentorAssignments.slice(0, 3).map((assignment) => (
            <div key={assignment.id} className='relative'>
              <Avatar className='h-6 w-6 border border-white/30'>
                <AvatarImage 
                  src={assignment.mentor.avatar_url || undefined} 
                  alt={`${assignment.mentor.first_name} ${assignment.mentor.last_name}`}
                />
                <AvatarFallback className='text-xs bg-white/20 text-white border-white/30'>
                  {getInitials(assignment.mentor.first_name, assignment.mentor.last_name)}
                </AvatarFallback>
              </Avatar>
              {/* Epic Master indicators */}
              {assignment.is_epic_master && (
                <Crown className='absolute -top-1 -right-1 h-3 w-3 text-yellow-400 drop-shadow-sm' />
              )}
              {assignment.is_associate_epic_master && (
                <UserPlus className='absolute -top-1 -right-1 h-3 w-3 text-blue-400 drop-shadow-sm' />
              )}
            </div>
          ))}
          {sortedMentorAssignments.length > 3 && (
            <div className='h-6 w-6 bg-white/20 border border-white/30 rounded-full flex items-center justify-center'>
              <span className='text-xs text-white font-medium'>
                +{sortedMentorAssignments.length - 3}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Session Content */}
      <div className='flex-1 flex flex-col justify-center'>
        {isEditing ? (
          <div className='mb-2'>
            <input
              type='text'
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className='text-sm bg-white/20 text-white border border-white/30 rounded px-2 py-1 w-full text-center'
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter')
                  handleSaveEdit(e as React.KeyboardEvent<HTMLInputElement>);
                if (e.key === 'Escape')
                  handleCancelEdit(e as React.KeyboardEvent<HTMLInputElement>);
              }}
            />
          </div>
        ) : (
          <div className='relative mb-2'>
            <div
              className='text-sm font-medium text-center'
              title={session.title}
            >
              {/* For CBL sessions, show individual session name (defaulting to Untitled), for others show the title they entered */}
              {[
                'cbl',
                'challenge_intro',
                'learn',
                'innovate',
                'transform',
                'reflection',
              ].includes(session.session_type)
                ? session.title || 'Untitled'
                : session.title}
            </div>
            {[
              'cbl',
              'challenge_intro',
              'learn',
              'innovate',
              'transform',
              'reflection',
            ].includes(session.session_type) && (
              <button
                onClick={handleEdit}
                className='absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-opacity'
                title='Edit session name'
              >
                <Edit2 className='h-3 w-3 text-white/70' />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session Time Display */}
      {(session.start_time || session.end_time) && (
        <div className='text-[11px] text-center text-white/90'>
          {(session.start_time
            ? new Date(session.start_time)
            : null
          )?.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
          {session.start_time && session.end_time ? ' – ' : ''}
          {(session.end_time
            ? new Date(session.end_time)
            : null
          )?.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
      )}

      {/* Challenge Name Footer - Only for CBL sessions */}
      {[
        'cbl',
        'challenge_intro',
        'learn',
        'innovate',
        'transform',
        'reflection',
        'mock_challenge',
      ].includes(session.session_type) &&
        session.cbl_challenge_id && (
          <div className='text-xs text-center font-semibold bg-white/10 py-1 px-2 rounded-md mt-2 uppercase tracking-wide'>
            {session.challenge_title || challengeTitle || 'CBL Challenge'}
          </div>
        )}



      {/* Drag Indicator */}
      {draggable && (
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'>
          <div className='w-2 h-2 bg-white/30 rounded-full'></div>
        </div>
      )}
    </div>
  );
};
