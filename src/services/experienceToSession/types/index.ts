import type { Experience, LectureModule } from '@/types/experience';
import type { PlannedSession } from '../../sessionPlanningService';

export interface ExperienceToSessionOptions {
  experience: Experience;
  date: Date;
  sessionNumber: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  sessionsPerDay: number;
  defaults?: any[];
}

export interface SessionPreview {
  sessionCount: number;
  sessionTypes: string[];
  description: string;
}

export interface SessionCreationResult {
  success: boolean;
  data?: PlannedSession[];
  error?: string;
}

export interface CBLChallenge {
  id: string;
  cohort_id: string;
  epic_id: string;
  title: string;
  created_by: string;
  status: string;
}

export interface CBLSessionCreationOptions {
  experience: Experience;
  challenge: CBLChallenge;
  date: Date;
  cohortId: string;
  epicId: string;
  createdBy: string;
  sessionsPerDay: number;
  defaults: any[];
}

export interface LectureSessionOptions {
  lecture: LectureModule;
  challenge: CBLChallenge;
  experience: Experience;
  date: Date;
  slot: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  defaults: any[];
}

export interface SingleSessionOptions {
  challenge: CBLChallenge;
  experience: Experience;
  date: Date;
  slot: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  defaults: any[];
  sessionType: 'transform' | 'reflection';
  title: string;
}
