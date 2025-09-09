import type { PlannedSession } from '../../sessionPlanningService';
import { sessionPlanningService } from '../../sessionPlanningService';
import { supabase } from '@/integrations/supabase/client';

export interface SessionCreationOptions {
  cohortId: string;
  epicId: string;
  createdBy: string;
  date: Date;
  slot: number;
  defaults: any[];
}

export interface SessionCreationResult {
  success: boolean;
  data?: PlannedSession;
  error?: string;
}

/**
 * Convert time string (HH:MM) to UTC ISO string for a given date
 */
export function toUtcIso(baseDate: Date, hhmm?: string): string | undefined {
  if (!hhmm) return undefined;
  try {
    const [hh, mm] = hhmm.split(':').map(Number);
    const local = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hh || 0,
      mm || 0,
      0,
      0
    );
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
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateToSessionDate(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

/**
 * Check if a session slot is available
 */
export async function isSlotAvailable(
  cohortId: string,
  epicId: string,
  sessionDate: string,
  slot: number
): Promise<{ success: boolean; isPlanned: boolean; error?: string }> {
  return await sessionPlanningService.isSessionAlreadyPlanned(
    cohortId,
    epicId,
    sessionDate,
    slot
  );
}

/**
 * Get default times for a session slot
 */
export function getSlotDefaults(defaults: any[], slot: number): any {
  return defaults.find(d => d.sessionNumber === slot);
}

/**
 * Create a basic session with common validation and setup
 */
export async function createBasicSession(options: {
  cohortId: string;
  epicId: string;
  createdBy: string;
  date: Date;
  slot: number;
  defaults: any[];
  sessionType: string;
  title: string;
  cblChallengeId?: string;
  originalCbl?: boolean;
  experienceId?: string;
  skipSlotCheck?: boolean; // New option to skip redundant slot checks
}): Promise<SessionCreationResult> {
  const {
    cohortId,
    epicId,
    createdBy,
    date,
    slot,
    defaults,
    sessionType,
    title,
    cblChallengeId,
    originalCbl,
    experienceId,
    skipSlotCheck = false,
  } = options;

  try {
    const sessionDate = formatDateToSessionDate(date);

    // Only check slot availability if not pre-validated
    if (!skipSlotCheck) {
      const checkResult = await isSlotAvailable(
        cohortId,
        epicId,
        sessionDate,
        slot
      );

      if (!checkResult.success || checkResult.isPlanned) {
        return {
          success: false,
          error: `Slot ${slot} on ${sessionDate} is not available`,
        };
      }
    }

    // Get default times for this session slot
    const slotDefaults = getSlotDefaults(defaults, slot);

    // Create the session
    const result = await sessionPlanningService.createPlannedSession({
      cohort_id: cohortId,
      epic_id: epicId,
      session_date: sessionDate,
      session_number: slot,
      session_type: sessionType as any,
      title: title,
      created_by: createdBy,
      start_time: toUtcIso(date, slotDefaults?.start),
      end_time: toUtcIso(date, slotDefaults?.end),
      cbl_challenge_id: cblChallengeId,
      original_cbl: originalCbl,
      experience_id: experienceId,
    });

    if (result.success && result.data) {
      console.log(
        `✅ Created ${sessionType} session: "${title}" in slot ${slot}`
      );
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || `Failed to create ${sessionType} session`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Failed to create ${sessionType} session`,
    };
  }
}

/**
 * Advance to next slot or next day if needed
 */
export function advanceSlotAndDate(
  currentDate: Date,
  currentSlot: number,
  sessionsPerDay: number
): { newDate: Date; newSlot: number } {
  let newSlot = currentSlot + 1;
  let newDate = new Date(currentDate);

  if (newSlot > sessionsPerDay) {
    newSlot = 1;
    newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return { newDate, newSlot };
}

/**
 * Advance to next slot or next day if needed, skipping Sundays during automatic allocation
 */
export function advanceSlotAndDateSkipSundays(
  currentDate: Date,
  currentSlot: number,
  sessionsPerDay: number
): { newDate: Date; newSlot: number } {
  let newSlot = currentSlot + 1;
  let newDate = new Date(currentDate);

  if (newSlot > sessionsPerDay) {
    newSlot = 1;
    newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    // Skip Sundays during automatic allocation
    while (newDate.getDay() === 0) {
      // 0 = Sunday
      newDate = new Date(newDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return { newDate, newSlot };
}

/**
 * Create multiple sessions in a single batch operation for better performance
 */
export async function createBatchSessions(options: {
  sessions: Array<{
    cohortId: string;
    epicId: string;
    createdBy: string;
    date: Date;
    slot: number;
    defaults: any[];
    sessionType: string;
    title: string;
    cblChallengeId?: string;
    originalCbl?: boolean;
    experienceId?: string;
  }>;
  challengeTitle?: string; // Pre-fetched challenge title to avoid individual lookups
}): Promise<SessionCreationResult> {
  const { sessions, challengeTitle } = options;

  try {
    // Prepare all session data
    const sessionData = sessions.map(session => {
      const sessionDate = formatDateToSessionDate(session.date);
      const slotDefaults = getSlotDefaults(session.defaults, session.slot);

      return {
        cohort_id: session.cohortId,
        epic_id: session.epicId,
        session_date: sessionDate,
        session_number: session.slot,
        session_type: session.sessionType as any,
        title: session.title,
        created_by: session.createdBy,
        start_time: toUtcIso(session.date, slotDefaults?.start),
        end_time: toUtcIso(session.date, slotDefaults?.end),
        cbl_challenge_id: session.cblChallengeId,
        original_cbl: session.originalCbl,
        experience_id: session.experienceId,
      };
    });

    // Create all sessions in a single database operation
    console.log(
      `🔄 Creating ${sessionData.length} sessions in batch:`,
      sessionData.map(s => ({
        title: s.title,
        date: s.session_date,
        slot: s.session_number,
        type: s.session_type,
      }))
    );

    const { data: createdSessions, error } = await supabase
      .from('planned_sessions')
      .insert(sessionData)
      .select();

    if (error) {
      console.error('❌ Error creating batch sessions:', error);
      return {
        success: false,
        error: `Failed to create sessions: ${error.message}`,
      };
    }

    console.log(
      `✅ Database returned ${createdSessions?.length || 0} created sessions`
    );

    // Add challenge title to sessions that need it
    const sessionsWithChallengeTitle =
      createdSessions?.map(session => ({
        ...session,
        challenge_title: session.cbl_challenge_id ? challengeTitle : null,
      })) || [];

    console.log(
      `✅ Created ${sessionsWithChallengeTitle.length} sessions in batch with challenge titles`
    );

    return {
      success: true,
      data: sessionsWithChallengeTitle,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create batch sessions',
    };
  }
}
