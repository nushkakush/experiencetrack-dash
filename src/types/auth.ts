export type UserRole = 
  | 'student'
  | 'super_admin' 
  | 'program_manager'
  | 'fee_collector'
  | 'partnerships_head'
  | 'placement_coordinator';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}