export interface Session {
  id: string;
  title: string;
  session_type: SessionType;
  status: SessionStatus;
  session_date: string;
  session_number: number;
  cohort_id: string;
  epic_id: string;
  created_at?: string;
  updated_at?: string;
  start_time?: string | null;
  end_time?: string | null;
  cbl_challenge_id?: string | null;
  original_cbl?: boolean;
  challenge_title?: string | null;
}

export type SessionType =
  | 'cbl'
  | 'challenge_intro'
  | 'learn'
  | 'innovate'
  | 'transform'
  | 'reflection'
  | 'mock_challenge'
  | 'masterclass'
  | 'workshop'
  | 'gap';

export type SessionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface SessionDisplayProps {
  session: Session;
  sessionNumber: number;
  onClick?: () => void;
}

export interface SessionTypeConfig {
  type: SessionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  defaultRole: 'mentor' | 'trainer' | 'judge';
  allowMultipleAssignments: boolean;
  roleLabel: string;
}

export interface SessionPlanningData {
  date: Date;
  sessionNumber: number;
  sessionType: SessionType;
  title: string;
}
