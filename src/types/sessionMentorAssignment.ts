import type { BaseEntity } from './common';
import type { Mentor } from './mentor';
import type { PlannedSession } from '../services/sessionPlanningService';

export type MentorRole = 'mentor' | 'trainer' | 'judge';

export interface SessionMentorAssignment extends BaseEntity {
  session_id: string;
  mentor_id: string;
  role_type: MentorRole;
  is_epic_master: boolean;
  is_associate_epic_master: boolean;
  assigned_by?: string | null;
  // Joined data
  mentor?: Mentor | null;
}

export interface CreateSessionMentorAssignmentData {
  session_id: string;
  mentor_id: string;
  role_type: MentorRole;
  is_epic_master?: boolean;
  is_associate_epic_master?: boolean;
  assigned_by?: string | null;
}

export interface UpdateSessionMentorAssignmentData {
  role_type?: MentorRole;
  is_epic_master?: boolean;
  is_associate_epic_master?: boolean;
}

export interface SessionMentorAssignmentWithMentor extends SessionMentorAssignment {
  mentor: Mentor;
}

export interface SessionWithMentors extends PlannedSession {
  mentor_assignments: SessionMentorAssignmentWithMentor[];
}

// Role-specific assignment rules
export interface SessionRoleConfig {
  role: MentorRole;
  label: string;
  allowMultiple: boolean;
  description: string;
}

// Session type to role mapping
export const SESSION_TYPE_ROLES: Record<string, SessionRoleConfig> = {
  'learn': {
    role: 'mentor',
    label: 'Mentor',
    allowMultiple: false,
    description: 'Session mentor for guidance and support'
  },
  'masterclass': {
    role: 'mentor',
    label: 'Mentor',
    allowMultiple: false,
    description: 'Masterclass instructor'
  },
  'gap': {
    role: 'mentor',
    label: 'Mentor',
    allowMultiple: false,
    description: 'Gap session mentor'
  },
  'innovate': {
    role: 'trainer',
    label: 'Trainer',
    allowMultiple: true,
    description: 'Innovation session trainer'
  },
  'transform': {
    role: 'judge',
    label: 'Judge',
    allowMultiple: true,
    description: 'Transformation session judge'
  },
  // Default fallback for other session types
  'default': {
    role: 'mentor',
    label: 'Mentor',
    allowMultiple: false,
    description: 'Session mentor'
  }
};

// Helper function to get role config for a session type
export const getSessionRoleConfig = (sessionType: string): SessionRoleConfig => {
  return SESSION_TYPE_ROLES[sessionType] || SESSION_TYPE_ROLES['default'];
};

// Helper function to get role display name
export const getRoleDisplayName = (role: MentorRole): string => {
  switch (role) {
    case 'mentor':
      return 'Mentor';
    case 'trainer':
      return 'Trainer';
    case 'judge':
      return 'Judge';
    default:
      return 'Mentor';
  }
};

// Helper function to check if multiple assignments are allowed
export const allowsMultipleAssignments = (sessionType: string): boolean => {
  const config = getSessionRoleConfig(sessionType);
  return config.allowMultiple;
};
