import { supabase } from '@/integrations/supabase/client';
import type { Experience, LectureModule } from '@/types/experience';
import type {
  ExperienceToSessionOptions,
  SessionCreationResult,
  CBLChallenge,
  CBLSessionCreationOptions,
  LectureSessionOptions,
  SingleSessionOptions,
} from '../types';
import {
  createBasicSession,
  advanceSlotAndDate,
  advanceSlotAndDateSkipSundays,
  isSlotAvailable,
  createBatchSessions,
} from '../utils/sessionUtils';

/**
 * Pre-validate all required slots for a CBL experience before creating any sessions
 * Optimized to use a single database query instead of sequential calls
 */
async function validateAllCBLSlots(options: {
  lectures: LectureModule[];
  date: Date;
  cohortId: string;
  epicId: string;
  sessionsPerDay: number;
}): Promise<{ success: boolean; error?: string }> {
  const { lectures, date, cohortId, epicId, sessionsPerDay } = options;

  try {
    const currentDate = new Date(date);
    let currentSlot = 1;
    const requiredSlots = lectures.length > 0 ? 2 * lectures.length + 1 : 3;

    // Build list of all required slots to check
    const slotsToCheck: { date: string; slot: number }[] = [];

    for (let i = 0; i < requiredSlots; i++) {
      const sessionDate = currentDate.toISOString().split('T')[0];
      slotsToCheck.push({ date: sessionDate, slot: currentSlot });

      // Advance to next slot, skipping Sundays during automatic allocation
      if (currentSlot < sessionsPerDay) {
        currentSlot++;
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        currentSlot = 1;

        // Skip Sundays during automatic allocation
        while (currentDate.getDay() === 0) {
          // 0 = Sunday
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Single database query to check all slots at once
    const { data: existingSessions, error } = await supabase
      .from('planned_sessions')
      .select('session_date, session_number')
      .eq('cohort_id', cohortId)
      .eq('epic_id', epicId)
      .in(
        'session_date',
        slotsToCheck.map(s => s.date)
      );

    if (error) {
      return {
        success: false,
        error: `Failed to check slot availability: ${error.message}`,
      };
    }

    // Check if any of the required slots are occupied
    for (const slot of slotsToCheck) {
      const isOccupied = existingSessions?.some(
        session =>
          session.session_date === slot.date &&
          session.session_number === slot.slot
      );

      if (isOccupied) {
        return {
          success: false,
          error: `Slot ${slot.slot} on ${slot.date} is already occupied. CBL requires ${requiredSpots} consecutive slots.`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to validate CBL slots',
    };
  }
}

/**
 * Create CBL experience sessions (creates a full CBL challenge with enhanced sessions)
 */
export async function createCBLExperienceSessions(
  options: ExperienceToSessionOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    date,
    cohortId,
    epicId,
    createdBy,
    sessionsPerDay,
    defaults,
  } = options;

  try {
    // Create CBL challenge first
    const challengeData = {
      cohort_id: cohortId,
      epic_id: epicId,
      title: experience.title,
      created_by: createdBy,
    };

    // Create the CBL challenge record
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

    // Create enhanced CBL sessions based on experience data
    const createdSessions = await createEnhancedCBLSessions({
      experience,
      challenge,
      date,
      cohortId,
      epicId,
      createdBy,
      sessionsPerDay,
      defaults: defaults || [],
    });

    if (!createdSessions.success) {
      return createdSessions;
    }

    return {
      success: true,
      data: createdSessions.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create CBL sessions',
    };
  }
}

/**
 * Create enhanced CBL sessions with challenge details and lecture-based learn sessions
 * Optimized version using batch session creation for better performance
 */
export async function createEnhancedCBLSessions(
  options: CBLSessionCreationOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    challenge,
    date,
    cohortId,
    epicId,
    createdBy,
    sessionsPerDay,
    defaults,
  } = options;

  try {
    // Sort lectures if present
    const lectures = Array.isArray(experience.lecture_sessions)
      ? [...experience.lecture_sessions].sort((a, b) => a.order - b.order)
      : [];

    // Pre-validate ALL required slots before creating any sessions
    const validationResult = await validateAllCBLSlots({
      lectures,
      date,
      cohortId,
      epicId,
      sessionsPerDay,
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
      };
    }

    // Prepare all sessions for batch creation
    const sessionsToCreate: Array<{
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
    }> = [];

    let currentDate = new Date(date);
    let currentSlot = 1;

    // 1. Challenge intro session (combines first learn if available)
    const firstLectureTitle =
      lectures.length > 0 ? lectures[0].title : undefined;
    sessionsToCreate.push({
      cohortId,
      epicId,
      createdBy,
      date: currentDate,
      slot: currentSlot,
      defaults,
      sessionType: 'challenge_intro',
      title: firstLectureTitle || experience.title,
      cblChallengeId: challenge.id,
      originalCbl: true,
      experienceId: experience.id,
    });

    // Advance to next slot for Innovate
    let next = advanceSlotAndDateSkipSundays(
      currentDate,
      currentSlot,
      sessionsPerDay
    );
    currentDate = next.newDate;
    currentSlot = next.newSlot;

    // 2. Innovate session after intro
    sessionsToCreate.push({
      cohortId,
      epicId,
      createdBy,
      date: currentDate,
      slot: currentSlot,
      defaults,
      sessionType: 'innovate',
      title: challenge.title,
      cblChallengeId: challenge.id,
      originalCbl: true,
      experienceId: experience.id,
    });

    // Advance to next slot
    next = advanceSlotAndDateSkipSundays(
      currentDate,
      currentSlot,
      sessionsPerDay
    );
    currentDate = next.newDate;
    currentSlot = next.newSlot;

    // 3. For remaining lectures (excluding the first which is combined), pair Learn + Innovate per day
    if (lectures.length > 1) {
      for (const lecture of lectures.slice(1)) {
        // Learn session
        sessionsToCreate.push({
          cohortId,
          epicId,
          createdBy,
          date: currentDate,
          slot: currentSlot,
          defaults,
          sessionType: 'learn',
          title: lecture.title,
          cblChallengeId: challenge.id,
          originalCbl: true,
          experienceId: experience.id,
        });

        // Advance to next slot for Innovate
        next = advanceSlotAndDateSkipSundays(
          currentDate,
          currentSlot,
          sessionsPerDay
        );
        currentDate = next.newDate;
        currentSlot = next.newSlot;

        // Innovate session
        sessionsToCreate.push({
          cohortId,
          epicId,
          createdBy,
          date: currentDate,
          slot: currentSlot,
          defaults,
          sessionType: 'innovate',
          title: challenge.title,
          cblChallengeId: challenge.id,
          originalCbl: true,
          experienceId: experience.id,
        });

        // Advance to next slot
        next = advanceSlotAndDateSkipSundays(
          currentDate,
          currentSlot,
          sessionsPerDay
        );
        currentDate = next.newDate;
        currentSlot = next.newSlot;
      }
    }

    // 4. Transform session (final session)
    sessionsToCreate.push({
      cohortId,
      epicId,
      createdBy,
      date: currentDate,
      slot: currentSlot,
      defaults,
      sessionType: 'transform',
      title: challenge.title,
      cblChallengeId: challenge.id,
      originalCbl: true,
      experienceId: experience.id,
    });

    // Create all sessions in a single batch operation
    const result = await createBatchSessions({
      sessions: sessionsToCreate,
      challengeTitle: challenge.title,
    });

    if (result.success) {
      console.log(
        `🎉 Successfully created enhanced CBL challenge with ${result.data?.length || 0} sessions in batch`
      );
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create enhanced CBL sessions',
    };
  }
}

/**
 * Create challenge_intro session with challenge details
 */
export async function createChallengeIntroSession(options: {
  experience: Experience;
  challenge: CBLChallenge;
  date: Date;
  slot: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  defaults: any[];
  firstLectureTitle?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const {
    experience,
    challenge,
    date,
    slot,
    cohortId,
    epicId,
    createdBy,
    defaults,
    firstLectureTitle,
  } = options;

  const sessionTitle = firstLectureTitle || experience.title;

  return await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot,
    defaults,
    sessionType: 'challenge_intro',
    title: sessionTitle,
    cblChallengeId: challenge.id,
    originalCbl: true,
    experienceId: experience.id,
  });
}

/**
 * Create learn session based on lecture module
 */
export async function createLearnSession(
  options: LectureSessionOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const {
    lecture,
    challenge,
    experience,
    date,
    slot,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  const sessionTitle = lecture.title;

  return await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot,
    defaults,
    sessionType: 'learn',
    title: sessionTitle,
    cblChallengeId: challenge.id,
    originalCbl: true,
    experienceId: experience.id,
  });
}

/**
 * Create innovate session
 */
export async function createInnovateSession(options: {
  challenge: CBLChallenge;
  experience: Experience;
  date: Date;
  slot: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  defaults: any[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const {
    challenge,
    experience,
    date,
    slot,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  const sessionTitle = challenge.title;

  return await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot,
    defaults,
    sessionType: 'innovate',
    title: sessionTitle,
    cblChallengeId: challenge.id,
    originalCbl: true,
    experienceId: experience.id,
  });
}

/**
 * Create transform and reflection sessions
 */
export async function createTransformReflectionSessions(options: {
  challenge: CBLChallenge;
  date: Date;
  slot: number;
  cohortId: string;
  epicId: string;
  createdBy: string;
  defaults: any[];
  sessionsPerDay: number;
}): Promise<SessionCreationResult> {
  const {
    challenge,
    date,
    slot,
    cohortId,
    epicId,
    createdBy,
    defaults,
    sessionsPerDay,
  } = options;

  try {
    const createdSessions: any[] = [];
    let currentDate = new Date(date);
    let currentSlot = slot;

    // Create transform session
    const transformSession = await createSingleSession({
      challenge,
      date: currentDate,
      slot: currentSlot,
      cohortId,
      epicId,
      createdBy,
      defaults,
      sessionType: 'transform',
      title: `Transform: ${challenge.title}`,
    });

    if (transformSession.success && transformSession.data) {
      createdSessions.push(transformSession.data);
      const { newDate, newSlot } = advanceSlotAndDate(
        currentDate,
        currentSlot,
        sessionsPerDay
      );
      currentDate = newDate;
      currentSlot = newSlot;
    }

    // Create reflection session
    const reflectionSession = await createSingleSession({
      challenge,
      date: currentDate,
      slot: currentSlot,
      cohortId,
      epicId,
      createdBy,
      defaults,
      sessionType: 'reflection',
      title: `Reflection: ${challenge.title}`,
    });

    if (reflectionSession.success && reflectionSession.data) {
      createdSessions.push(reflectionSession.data);
    }

    return {
      success: true,
      data: createdSessions,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create transform/reflection sessions',
    };
  }
}

/**
 * Helper method to create a single session
 */
export async function createSingleSession(
  options: SingleSessionOptions
): Promise<{ success: boolean; data?: any; error?: string }> {
  const {
    challenge,
    experience,
    date,
    slot,
    cohortId,
    epicId,
    createdBy,
    defaults,
    sessionType,
    title,
  } = options;

  return await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot,
    defaults,
    sessionType,
    title,
    cblChallengeId: challenge.id,
    originalCbl: true,
    experienceId: experience.id,
  });
}
