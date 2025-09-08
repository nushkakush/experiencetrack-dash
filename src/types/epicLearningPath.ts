export interface EpicInPath {
  id: string;
  order: number;
}

export interface EpicLearningPath {
  id: string;
  title: string;
  description?: string;
  outcomes?: string[]; // Array of learning outcomes
  avatar_url?: string;
  banner_url?: string;
  epics: EpicInPath[]; // Array of epics with their order
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEpicLearningPathRequest {
  title: string;
  description?: string;
  outcomes?: string[];
  avatar_url?: string;
  banner_url?: string;
  epics: EpicInPath[];
}

export interface UpdateEpicLearningPathRequest
  extends Partial<CreateEpicLearningPathRequest> {
  id: string;
}

// Extended interface for display purposes (includes epic details)
export interface EpicLearningPathWithDetails
  extends Omit<EpicLearningPath, 'epics'> {
  epics: (EpicInPath & {
    name: string;
    description?: string;
    avatar_url?: string;
    lecturesCount: number;
    deliverablesCount: number;
    toolsCount: number;
  })[];
}
