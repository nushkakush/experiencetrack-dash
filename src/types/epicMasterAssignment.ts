import type { BaseEntity } from './common';
import type { Mentor } from './mentor';

export interface EpicMasterAssignment extends BaseEntity {
  cohort_epic_id: string;
  epic_master_id?: string | null;
  associate_epic_master_id?: string | null;
  created_by?: string | null;
  // Joined data
  epic_master?: Mentor | null;
  associate_epic_master?: Mentor | null;
}

export interface CreateEpicMasterAssignmentData {
  cohort_epic_id: string;
  epic_master_id?: string | null;
  associate_epic_master_id?: string | null;
  created_by?: string | null;
}

export interface UpdateEpicMasterAssignmentData {
  epic_master_id?: string | null;
  associate_epic_master_id?: string | null;
}

export interface EpicMasterAssignmentWithMentors extends EpicMasterAssignment {
  epic_master: Mentor | null;
  associate_epic_master: Mentor | null;
}