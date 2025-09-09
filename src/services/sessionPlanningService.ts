import { supabase } from '@/integrations/supabase/client';

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

export interface PlannedSession {
  id: string;
  cohort_id: string;
  epic_id: string;
  session_date: string;
  session_number: number;
  session_type: SessionType;
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  start_time?: string | null;
  end_time?: string | null;
  cbl_challenge_id?: string | null;
  original_cbl?: boolean;
  challenge_title?: string | null;
  experience_id?: string | null; // Link to the experience that created this session
  mentor_assignments?: any[]; // Will be populated by SessionMentorService
}

export interface CreatePlannedSessionData {
  cohort_id: string;
  epic_id: string;
  session_date: string;
  session_number: number;
  session_type: SessionType;
  title: string;
  created_by?: string;
  start_time?: string; // ISO string (UTC)
  end_time?: string; // ISO string (UTC)
  cbl_challenge_id?: string; // Link to CBL challenge
  original_cbl?: boolean; // Mark as original CBL session
  experience_id?: string; // Link to the experience that created this session
}

export interface UpdatePlannedSessionData
  extends Partial<CreatePlannedSessionData> {
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

class SessionPlanningService {
  /**
   * Create a new planned session
   */
  async createPlannedSession(data: CreatePlannedSessionData): Promise<{
    success: boolean;
    data?: PlannedSession;
    error?: string;
  }> {
    try {
      // Check authentication first
      const {
        data: { session: authSession },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !authSession) {
        console.error(
          'SessionPlanningService: Authentication error:',
          authError
        );
        return {
          success: false,
          error: 'User not authenticated. Please log in and try again.',
        };
      }

      // Verify user has proper role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', authSession.user.id)
        .single();

      if (profileError || !profile) {
        console.error('SessionPlanningService: Profile error:', profileError);
        return {
          success: false,
          error: 'User profile not found. Please contact support.',
        };
      }

      const allowedRoles = ['super_admin', 'program_manager', 'mentor_manager'];
      if (!allowedRoles.includes(profile.role)) {
        console.error(
          'SessionPlanningService: Insufficient permissions. User role:',
          profile.role
        );
        return {
          success: false,
          error: 'Insufficient permissions to create sessions.',
        };
      }

      console.log(
        `✅ SessionPlanningService: User authenticated with role: ${profile.role}`
      );

      // If this is a CBL session, fetch the challenge title
      let challengeTitle = null;
      if (data.cbl_challenge_id) {
        console.log(
          `🔍 SessionPlanningService: Fetching challenge title for cbl_challenge_id: ${data.cbl_challenge_id}`
        );
        const { data: challenge, error: challengeError } = await supabase
          .from('cbl_challenges')
          .select('title')
          .eq('id', data.cbl_challenge_id)
          .single();

        if (!challengeError && challenge) {
          challengeTitle = challenge.title;
          console.log(
            `✅ SessionPlanningService: Found challenge title: "${challengeTitle}"`
          );
        } else {
          console.log(
            `❌ SessionPlanningService: Failed to fetch challenge title:`,
            challengeError
          );
        }
      } else {
        console.log(
          `🔍 SessionPlanningService: No cbl_challenge_id provided for session type: ${data.session_type}`
        );
      }

      const { data: session, error } = await supabase
        .from('planned_sessions')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating planned session:', {
          error,
          sessionData: {
            title: data.title,
            sessionType: data.session_type,
            date: data.session_date,
            slot: data.session_number,
            challengeId: data.cbl_challenge_id,
          },
        });
        return {
          success: false,
          error: `Failed to create session: ${error.message || 'Unknown database error'}`,
        };
      }

      // Add the challenge title to the returned session data
      const sessionWithChallengeTitle = {
        ...session,
        challenge_title: challengeTitle,
      };

      return {
        success: true,
        data: sessionWithChallengeTitle,
      };
    } catch (error) {
      console.error('Error creating planned session:', error);
      return {
        success: false,
        error: 'Failed to create planned session',
      };
    }
  }

  /**
   * Get planned sessions for a specific cohort and epic
   */
  async getPlannedSessions(
    cohortId: string,
    epicId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    data?: PlannedSession[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('planned_sessions')
        .select(
          `
          *,
          cbl_challenges!left(title)
        `
        )
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .order('session_date', { ascending: true })
        .order('session_number', { ascending: true });

      if (startDate) {
        query = query.gte('session_date', startDate);
      }

      if (endDate) {
        query = query.lte('session_date', endDate);
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching planned sessions:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Process sessions to extract challenge title
      const processedSessions = (sessions || []).map(session => {
        // Handle the joined data structure
        const challengeTitle = session.cbl_challenges?.title || null;

        // Debug logging for challenge title processing
        if (['learn', 'innovate', 'transform'].includes(session.session_type)) {
          console.log(
            `🔍 SessionPlanningService.getPlannedSessions: Processing individual CBL session "${session.title}":`,
            {
              sessionType: session.session_type,
              cblChallengeId: session.cbl_challenge_id,
              challengeTitle,
              hasJoinedData: !!session.cbl_challenges,
            }
          );
        }

        // Remove the nested cbl_challenges object to avoid breaking other code
        const { cbl_challenges, ...sessionData } = session;

        return {
          ...sessionData,
          challenge_title: challengeTitle,
        };
      });

      return {
        success: true,
        data: processedSessions,
      };
    } catch (error) {
      console.error('Error fetching planned sessions:', error);
      return {
        success: false,
        error: 'Failed to fetch planned sessions',
      };
    }
  }

  /**
   * Get a specific planned session by ID
   */
  async getPlannedSession(sessionId: string): Promise<{
    success: boolean;
    data?: PlannedSession;
    error?: string;
  }> {
    try {
      const { data: session, error } = await supabase
        .from('planned_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching planned session:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      console.error('Error fetching planned session:', error);
      return {
        success: false,
        error: 'Failed to fetch planned session',
      };
    }
  }

  /**
   * Update a planned session
   */
  async updatePlannedSession(
    sessionId: string,
    data: UpdatePlannedSessionData
  ): Promise<{
    success: boolean;
    data?: PlannedSession;
    error?: string;
  }> {
    try {
      const { data: session, error } = await supabase
        .from('planned_sessions')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating planned session:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // If this is a CBL session, fetch the challenge title
      let challengeTitle = null;
      if (session.cbl_challenge_id) {
        const { data: challenge, error: challengeError } = await supabase
          .from('cbl_challenges')
          .select('title')
          .eq('id', session.cbl_challenge_id)
          .single();

        if (!challengeError && challenge) {
          challengeTitle = challenge.title;
        }
      }

      // Add the challenge title to the returned session data
      const sessionWithChallengeTitle = {
        ...session,
        challenge_title: challengeTitle,
      };

      return {
        success: true,
        data: sessionWithChallengeTitle,
      };
    } catch (error) {
      console.error('Error updating planned session:', error);
      return {
        success: false,
        error: 'Failed to update planned session',
      };
    }
  }

  /**
   * Delete a planned session
   */
  async deletePlannedSession(sessionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('planned_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        console.error('Error deleting planned session:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting planned session:', error);
      return {
        success: false,
        error: 'Failed to delete planned session',
      };
    }
  }

  /**
   * Delete all CBL sessions from the same challenge group
   */
  async deleteCBLChallengeGroup(sessionId: string): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      // First, get the session to find its cbl_challenge_id and original_cbl status
      const { data: session, error: fetchError } = await supabase
        .from('planned_sessions')
        .select('cbl_challenge_id, original_cbl, cohort_id, epic_id')
        .eq('id', sessionId)
        .single();

      if (fetchError || !session) {
        console.error('Error fetching session for deletion:', fetchError);
        return {
          success: false,
          error: 'Session not found',
        };
      }

      if (!session.original_cbl || !session.cbl_challenge_id) {
        return {
          success: false,
          error: 'Session is not an original CBL challenge session',
        };
      }

      // Delete all original CBL sessions with the same cbl_challenge_id
      const { error: deleteError, count } = await supabase
        .from('planned_sessions')
        .delete()
        .eq('cbl_challenge_id', session.cbl_challenge_id)
        .eq('original_cbl', true);

      if (deleteError) {
        console.error('Error deleting CBL challenge group:', deleteError);
        return {
          success: false,
          error: deleteError.message,
        };
      }

      // Also delete the CBL challenge record
      const { error: challengeDeleteError } = await supabase
        .from('cbl_challenges')
        .delete()
        .eq('id', session.cbl_challenge_id);

      if (challengeDeleteError) {
        console.error(
          'Error deleting CBL challenge record:',
          challengeDeleteError
        );
        // Don't fail the whole operation if challenge record deletion fails
      }

      return {
        success: true,
        deletedCount: count || 0,
      };
    } catch (error) {
      console.error('Error deleting CBL challenge group:', error);
      return {
        success: false,
        error: 'Failed to delete CBL challenge group',
      };
    }
  }

  /**
   * Count number of CBL-group sessions that share a title within a cohort/epic.
   * Used to determine if a session (including innovate/transform) is part of a grouped CBL challenge.
   */
  async countCBLGroupSessions(
    cohortId: string,
    epicId: string,
    title: string
  ): Promise<{
    success: boolean;
    count: number;
    hasAnchor: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('planned_sessions')
        .select('id, session_type')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .eq('title', title);

      if (error) {
        return {
          success: false,
          count: 0,
          hasAnchor: false,
          error: error.message,
        };
      }

      const cblTypes = new Set([
        'cbl',
        'challenge_intro',
        'learn',
        'innovate',
        'transform',
        'reflection',
      ]);
      const rows = data || [];
      const count = rows.filter((s: any) =>
        cblTypes.has(s.session_type)
      ).length;
      const hasAnchor = rows.some(
        (s: any) =>
          s.session_type === 'cbl' || s.session_type === 'challenge_intro'
      );
      return { success: true, count, hasAnchor };
    } catch (err) {
      return {
        success: false,
        count: 0,
        hasAnchor: false,
        error: 'Failed to count CBL sessions',
      };
    }
  }

  /**
   * Delete all individual CBL sessions (learn/innovate/transform) within a date boundary
   * for a given cohort/epic. This does NOT delete anchors.
   */
  async deleteIndividualCBLWithinBoundary(
    cohortId: string,
    epicId: string,
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { error, count } = await supabase
        .from('planned_sessions')
        .delete()
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .gte('session_date', startDate)
        .lte('session_date', endDate)
        .in('session_type', ['learn', 'innovate', 'transform']);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, deletedCount: count || 0 };
    } catch (err) {
      return {
        success: false,
        error: 'Failed to delete individual CBL within boundary',
      };
    }
  }

  /**
   * Check if a session is already planned for a specific date and session number
   */
  async isSessionAlreadyPlanned(
    cohortId: string,
    epicId: string,
    sessionDate: string,
    sessionNumber: number
  ): Promise<{
    success: boolean;
    isPlanned: boolean;
    data?: PlannedSession;
    error?: string;
  }> {
    try {
      const { data: session, error } = await supabase
        .from('planned_sessions')
        .select('*')
        .eq('cohort_id', cohortId)
        .eq('epic_id', epicId)
        .eq('session_date', sessionDate)
        .eq('session_number', sessionNumber)
        .maybeSingle();

      if (error) {
        console.error('Error checking if session is planned:', error);
        return {
          success: false,
          isPlanned: false,
          error: error.message,
        };
      }

      return {
        success: true,
        isPlanned: !!session,
        data: session || undefined,
      };
    } catch (error) {
      console.error('Error checking if session is planned:', error);
      return {
        success: false,
        isPlanned: false,
        error: 'Failed to check if session is planned',
      };
    }
  }

  /**
   * Check if an experience has already been used in a cohort
   */
  async isExperienceAlreadyUsed(
    cohortId: string,
    experienceId: string
  ): Promise<{
    success: boolean;
    isUsed: boolean;
    error?: string;
  }> {
    try {
      const { data: sessions, error } = await supabase
        .from('planned_sessions')
        .select('id')
        .eq('cohort_id', cohortId)
        .eq('experience_id', experienceId)
        .limit(1);

      if (error) {
        console.error('Error checking if experience is already used:', error);
        return {
          success: false,
          isUsed: false,
          error: error.message,
        };
      }

      return {
        success: true,
        isUsed: sessions && sessions.length > 0,
      };
    } catch (error) {
      console.error('Error checking if experience is already used:', error);
      return {
        success: false,
        isUsed: false,
        error: 'Failed to check if experience is already used',
      };
    }
  }
}

export const sessionPlanningService = new SessionPlanningService();
