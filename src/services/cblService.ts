import { supabase } from '@/integrations/supabase/client';
import { sessionPlanningService } from './sessionPlanningService';
import { cohortSettingsService } from './cohortSettingsService';

export interface CBLSessionData {
  title: string;
  session_type:
    | 'challenge_intro'
    | 'learn'
    | 'innovate'
    | 'transform'
    | 'reflection';
  description?: string;
}

export interface CBLGroupedSessionData {
  title: string;
  session_types: (
    | 'challenge_intro'
    | 'learn'
    | 'innovate'
    | 'transform'
    | 'reflection'
  )[];
  description?: string;
}

export interface MockChallengeGroupedSessionData {
  title: string;
  session_types: (
    | 'challenge_intro'
    | 'innovate'
    | 'transform'
    | 'reflection'
  )[];
  description?: string;
}

export interface CreateCBLChallengeData {
  cohort_id: string;
  epic_id: string;
  title: string;
  created_by: string;
}

class CBLService {
  /**
   * Update CBL challenge title
   */
  async updateCBLChallengeTitle(
    challengeId: string,
    newTitle: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('cbl_challenges')
        .update({ title: newTitle })
        .eq('id', challengeId);

      if (error) {
        console.error('Error updating CBL challenge title:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating CBL challenge title:', error);
      return {
        success: false,
        error: 'Failed to update CBL challenge title',
      };
    }
  }

  /**
   * Create a CBL challenge with grouped sessions in 3 slots
   */
  async createCBLChallengeWithSessions(
    challengeData: CreateCBLChallengeData,
    startDate: Date,
    sessionsPerDay: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // First, create the CBL challenge in the cbl_challenges table
      const { data: challenge, error: challengeError } = await supabase
        .from('cbl_challenges')
        .insert({
          cohort_id: challengeData.cohort_id,
          epic_id: challengeData.epic_id,
          title: challengeData.title,
          created_by: challengeData.created_by,
          status: 'active',
        })
        .select()
        .single();

      if (challengeError || !challenge) {
        console.error('❌ Failed to create CBL challenge:', challengeError);
        return {
          success: false,
          error: challengeError?.message || 'Failed to create CBL challenge',
        };
      }

      console.log(
        `✅ Created CBL challenge: "${challenge.title}" with ID: ${challenge.id}`
      );

      // Get cohort default session times
      const defaults = await cohortSettingsService.getDefaultSessionTimes(
        challengeData.cohort_id
      );

      // Define grouped CBL sessions - only 3 slots needed
      const cblGroupedSessions: CBLGroupedSessionData[] = [
        {
          title: 'Untitled',
          session_types: ['challenge_intro', 'learn'],
          description: 'Challenge Introduction and Learn sessions combined',
        },
        {
          title: 'Untitled',
          session_types: ['innovate'],
          description: 'Innovate session',
        },
        {
          title: 'Untitled',
          session_types: ['transform', 'reflection'],
          description: 'Transform and Reflection sessions combined',
        },
      ];

      let currentDate = new Date(startDate);
      let currentSlot = 1;
      const createdSessions: any[] = [];

      // Create each grouped CBL session in the next available slot
      for (const groupedSession of cblGroupedSessions) {
        let sessionCreated = false;
        let attempts = 0;
        const maxAttempts = 30; // Prevent infinite loops

        while (!sessionCreated && attempts < maxAttempts) {
          // Format date for comparison
          const sessionDate =
            currentDate.getFullYear() +
            '-' +
            String(currentDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(currentDate.getDate()).padStart(2, '0');

          // Check if this slot is available
          const checkResult =
            await sessionPlanningService.isSessionAlreadyPlanned(
              challengeData.cohort_id,
              challengeData.epic_id,
              sessionDate,
              currentSlot
            );

          if (checkResult.success && !checkResult.isPlanned) {
            // For grouped sessions, we'll use a composite session type
            // The first session type in the group will be the primary type
            const primarySessionType = groupedSession.session_types[0];

            // Get default times for this session slot
            const slotDefaults = defaults.find(
              d => d.sessionNumber === currentSlot
            );

            // Convert times to UTC if available
            const toUtcIso = (
              baseDate: Date,
              hhmm?: string
            ): string | undefined => {
              if (!hhmm) return undefined;
              try {
                const [hh, mm] = hhmm.split(':').map(Number);
                // Create a local date with the specified time
                const local = new Date(
                  baseDate.getFullYear(),
                  baseDate.getMonth(),
                  baseDate.getDate(),
                  hh || 0,
                  mm || 0,
                  0,
                  0
                );
                // Convert to UTC for storage, but preserve the date by using UTC methods
                const utc = new Date(
                  Date.UTC(
                    local.getFullYear(),
                    local.getMonth(),
                    local.getDate(),
                    local.getHours(),
                    local.getMinutes(),
                    local.getSeconds()
                  )
                );
                return utc.toISOString();
              } catch (error) {
                console.error('Error parsing time:', hhmm, error);
                return undefined;
              }
            };

            // Create the grouped session with CBL challenge link
            const result = await sessionPlanningService.createPlannedSession({
              cohort_id: challengeData.cohort_id,
              epic_id: challengeData.epic_id,
              session_date: sessionDate,
              session_number: currentSlot,
              session_type: primarySessionType,
              title: groupedSession.title, // Use the individual session name
              created_by: challengeData.created_by,
              start_time: toUtcIso(currentDate, slotDefaults?.start),
              end_time: toUtcIso(currentDate, slotDefaults?.end),
              cbl_challenge_id: challenge.id, // Link to the CBL challenge
              original_cbl: true, // Mark as original CBL session
            });

            if (result.success && result.data) {
              createdSessions.push(result.data);
              sessionCreated = true;
              console.log(
                `✅ Created grouped session "${groupedSession.title}" on ${sessionDate} slot ${currentSlot} (types: ${groupedSession.session_types.join(', ')})`
              );
            } else {
              console.error(
                `❌ Failed to create grouped session "${groupedSession.title}":`,
                result.error
              );
              return {
                success: false,
                error: result.error || 'Failed to create CBL grouped session',
              };
            }
          } else {
            // Slot is occupied, try next slot
            currentSlot++;
            if (currentSlot > sessionsPerDay) {
              // Move to next day
              currentSlot = 1;
              currentDate = new Date(
                currentDate.getTime() + 24 * 60 * 60 * 1000
              );
            }
          }
          attempts++;
        }

        if (!sessionCreated) {
          console.error(
            `❌ Could not find available slot for grouped session "${groupedSession.title}" after ${maxAttempts} attempts`
          );
          return {
            success: false,
            error: `Could not find available slot for grouped session "${groupedSession.title}"`,
          };
        }
      }

      console.log(
        `🎉 Successfully created CBL challenge with ${createdSessions.length} grouped sessions in 3 slots`
      );
      return { success: true, data: { sessions: createdSessions } };
    } catch (error) {
      console.error('Error creating CBL challenge:', error);
      return { success: false, error: 'Failed to create CBL challenge' };
    }
  }

  /**
   * Create a Mock Challenge with grouped sessions in 2 slots
   */
  async createMockChallengeWithSessions(
    challengeData: CreateCBLChallengeData,
    startDate: Date,
    sessionsPerDay: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(
        `🚀 Creating Mock Challenge: "${challengeData.title}" starting from ${startDate.toISOString().split('T')[0]}`
      );

      // Check authentication first
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();
      if (authError || !session) {
        console.error('Authentication error:', authError);
        return {
          success: false,
          error: 'User not authenticated. Please log in and try again.',
        };
      }

      // Verify user has proper role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        return {
          success: false,
          error: 'User profile not found. Please contact support.',
        };
      }

      const allowedRoles = ['super_admin', 'program_manager', 'mentor_manager'];
      if (!allowedRoles.includes(profile.role)) {
        console.error('Insufficient permissions. User role:', profile.role);
        return {
          success: false,
          error:
            'Insufficient permissions. Only super admins, program managers, and mentor managers can create mock challenges.',
        };
      }

      console.log(`✅ User authenticated with role: ${profile.role}`);

      // Create the challenge record with is_mock = true
      let challenge: any = null;
      const { data: createdChallenge, error: challengeError } = await supabase
        .from('cbl_challenges')
        .insert([
          {
            ...challengeData,
            is_mock: true,
          },
        ])
        .select()
        .single();

      if (challengeError || !createdChallenge) {
        console.error('Error creating mock challenge:', challengeError);
        return {
          success: false,
          error: `Failed to create mock challenge: ${challengeError?.message || 'Unknown error'}`,
        };
      }

      challenge = createdChallenge;
      console.log(`✅ Created mock challenge with ID: ${challenge.id}`);

      // Mock Challenge grouped sessions (2 slots only)
      const mockChallengeSessions: MockChallengeGroupedSessionData[] = [
        {
          title: 'Untitled',
          session_types: ['challenge_intro', 'innovate'],
          description: 'Challenge introduction and innovate sessions combined',
        },
        {
          title: 'Untitled',
          session_types: ['transform', 'reflection'],
          description: 'Transformation and reflection activities',
        },
      ];

      // Get cohort session defaults
      const defaults = await cohortSettingsService.getDefaultSessionTimes(
        challengeData.cohort_id
      );
      console.log(`📋 Retrieved session defaults:`, defaults);

      const createdSessions = [];
      const currentDate = new Date(startDate);
      let currentSlot = 1;

      // Create sessions for each grouped session
      for (const groupedSession of mockChallengeSessions) {
        let sessionCreated = false;
        let attempts = 0;
        const maxAttempts = 30; // Prevent infinite loops

        while (!sessionCreated && attempts < maxAttempts) {
          attempts++;

          // Check if slot is available
          const sessionDate =
            currentDate.getFullYear() +
            '-' +
            String(currentDate.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(currentDate.getDate()).padStart(2, '0');
          console.log(
            `🔍 Checking slot availability for ${sessionDate}, slot ${currentSlot}`
          );

          const checkResult =
            await sessionPlanningService.isSessionAlreadyPlanned(
              challengeData.cohort_id,
              challengeData.epic_id,
              sessionDate,
              currentSlot
            );

          console.log(`📋 Slot check result:`, {
            success: checkResult.success,
            isPlanned: checkResult.isPlanned,
            error: checkResult.error,
          });

          if (!checkResult.success) {
            console.error(
              `❌ Failed to check slot availability: ${checkResult.error}`
            );
            return {
              success: false,
              error: `Failed to check slot availability: ${checkResult.error}`,
            };
          }

          if (!checkResult.isPlanned) {
            // For grouped sessions, we'll use a composite session type
            // For mock challenges, use the second type (innovate) as primary since it's more representative
            const primarySessionType =
              groupedSession.session_types.length > 1
                ? groupedSession.session_types[1]
                : groupedSession.session_types[0];

            // Get default times for this session slot
            const slotDefaults = defaults.find(
              d => d.sessionNumber === currentSlot
            );

            // Convert times to UTC if available
            const toUtcIso = (
              baseDate: Date,
              hhmm?: string
            ): string | undefined => {
              if (!hhmm) return undefined;
              try {
                const [hh, mm] = hhmm.split(':').map(Number);
                // Create a local date with the specified time
                const local = new Date(
                  baseDate.getFullYear(),
                  baseDate.getMonth(),
                  baseDate.getDate(),
                  hh || 0,
                  mm || 0,
                  0,
                  0
                );
                // Convert to UTC for storage, but preserve the date by using UTC methods
                const utc = new Date(
                  Date.UTC(
                    local.getFullYear(),
                    local.getMonth(),
                    local.getDate(),
                    local.getHours(),
                    local.getMinutes(),
                    local.getSeconds()
                  )
                );
                return utc.toISOString();
              } catch (error) {
                console.error('Error parsing time:', hhmm, error);
                return undefined;
              }
            };

            // Create the grouped session with mock challenge link
            console.log(`🔍 Creating mock challenge session:`, {
              title: groupedSession.title,
              sessionType: primarySessionType,
              slot: currentSlot,
              date: sessionDate,
              slotDefaults,
              challengeId: challenge.id,
            });

            const result = await sessionPlanningService.createPlannedSession({
              cohort_id: challengeData.cohort_id,
              epic_id: challengeData.epic_id,
              session_date: sessionDate,
              session_number: currentSlot,
              session_type: primarySessionType,
              title: groupedSession.title,
              created_by: challengeData.created_by,
              start_time: toUtcIso(currentDate, slotDefaults?.start),
              end_time: toUtcIso(currentDate, slotDefaults?.end),
              cbl_challenge_id: challenge.id,
              original_cbl: true,
            });

            if (result.success && result.data) {
              createdSessions.push(result.data);
              sessionCreated = true;
              console.log(
                `✅ Created mock challenge session: "${groupedSession.title}" in slot ${currentSlot}`
              );
            } else {
              console.error(`❌ Failed to create session:`, {
                error: result.error,
                sessionData: {
                  title: groupedSession.title,
                  sessionType: primarySessionType,
                  slot: currentSlot,
                  date: sessionDate,
                  challengeId: challenge.id,
                },
              });
              return {
                success: false,
                error: `Failed to create session "${groupedSession.title}": ${result.error || 'Unknown error'}`,
              };
            }
          } else {
            // Slot is occupied, try next slot
            currentSlot++;
            if (currentSlot > sessionsPerDay) {
              currentSlot = 1;
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        }

        if (!sessionCreated) {
          console.error(
            `❌ Failed to create session "${groupedSession.title}" after ${maxAttempts} attempts`
          );
          return {
            success: false,
            error: `Failed to find available slot for session "${groupedSession.title}" after checking ${maxAttempts} slots`,
          };
        }

        // Move to next slot for next session
        currentSlot++;
        if (currentSlot > sessionsPerDay) {
          currentSlot = 1;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      console.log(
        `🎉 Successfully created Mock Challenge with ${createdSessions.length} grouped sessions in 2 slots`
      );
      return { success: true, data: { sessions: createdSessions } };
    } catch (error) {
      console.error('Error creating Mock Challenge:', error);

      // If we created a challenge but failed to create sessions, clean up the challenge
      if (challenge && createdSessions.length === 0) {
        console.log(`🧹 Cleaning up orphaned challenge: ${challenge.id}`);
        try {
          await supabase.from('cbl_challenges').delete().eq('id', challenge.id);
          console.log(`✅ Cleaned up orphaned challenge: ${challenge.id}`);
        } catch (cleanupError) {
          console.error('Failed to clean up orphaned challenge:', cleanupError);
        }
      }

      return {
        success: false,
        error: `Failed to create Mock Challenge: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const cblService = new CBLService();
