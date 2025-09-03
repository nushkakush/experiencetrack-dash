import { BaseEntity } from '@/types/common';

export type MentorStatus = 'active' | 'inactive' | 'on_leave';

export interface Mentor extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  current_company?: string | null;
  designation?: string | null;
  linkedin_url?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  status: MentorStatus;
  internal_notes?: string | null;
  created_by?: string | null; // profiles.user_id
}

export interface CreateMentorData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialization?: string;
  experience_years?: number;
  current_company?: string;
  designation?: string;
  linkedin_url?: string;
  bio?: string;
  avatar_url?: string;
  internal_notes?: string;
}

export interface UpdateMentorData extends Partial<CreateMentorData> {
  status?: MentorStatus;
}




