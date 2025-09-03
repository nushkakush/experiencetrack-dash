export interface Epic {
  id: string;
  name: string;
  description?: string;
  outcomes?: string[]; // Changed from string to string array for bulleted points
  avatar_url?: string;
  banner_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEpicRequest {
  name: string;
  description?: string;
  outcomes?: string[]; // Changed from string to string array
  avatar_url?: string;
  banner_url?: string;
}

export interface UpdateEpicRequest extends Partial<CreateEpicRequest> {
  id: string;
}
