import type {
  ExperienceToSessionOptions,
  SessionCreationResult,
} from '../types';
import { createBasicSession } from '../utils/sessionUtils';

/**
 * Create Mock Challenge sessions (single session)
 */
export async function createMockChallengeSessions(
  options: ExperienceToSessionOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    date,
    sessionNumber,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  // Use provided defaults or fetch them if not provided
  let sessionDefaults = defaults;
  if (!sessionDefaults) {
    const { cohortSettingsService } = await import(
      '../../cohortSettingsService'
    );
    sessionDefaults =
      await cohortSettingsService.getDefaultSessionTimes(cohortId);
  }

  const result = await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot: sessionNumber,
    defaults: sessionDefaults,
    sessionType: 'mock_challenge',
    title: experience.title,
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: [result.data],
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to create Mock Challenge session',
  };
}

/**
 * Create Masterclass sessions (single session)
 */
export async function createMasterclassSessions(
  options: ExperienceToSessionOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    date,
    sessionNumber,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  // Use provided defaults or fetch them if not provided
  let sessionDefaults = defaults;
  if (!sessionDefaults) {
    const { cohortSettingsService } = await import(
      '../../cohortSettingsService'
    );
    sessionDefaults =
      await cohortSettingsService.getDefaultSessionTimes(cohortId);
  }

  const result = await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot: sessionNumber,
    defaults: sessionDefaults,
    sessionType: 'masterclass',
    title: experience.title,
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: [result.data],
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to create Masterclass session',
  };
}

/**
 * Create Workshop sessions (single session)
 */
export async function createWorkshopSessions(
  options: ExperienceToSessionOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    date,
    sessionNumber,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  // Use provided defaults or fetch them if not provided
  let sessionDefaults = defaults;
  if (!sessionDefaults) {
    const { cohortSettingsService } = await import(
      '../../cohortSettingsService'
    );
    sessionDefaults =
      await cohortSettingsService.getDefaultSessionTimes(cohortId);
  }

  const result = await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot: sessionNumber,
    defaults: sessionDefaults,
    sessionType: 'workshop',
    title: experience.title,
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: [result.data],
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to create Workshop session',
  };
}

/**
 * Create GAP sessions (single session)
 */
export async function createGAPSessions(
  options: ExperienceToSessionOptions
): Promise<SessionCreationResult> {
  const {
    experience,
    date,
    sessionNumber,
    cohortId,
    epicId,
    createdBy,
    defaults,
  } = options;

  // Use provided defaults or fetch them if not provided
  let sessionDefaults = defaults;
  if (!sessionDefaults) {
    const { cohortSettingsService } = await import(
      '../../cohortSettingsService'
    );
    sessionDefaults =
      await cohortSettingsService.getDefaultSessionTimes(cohortId);
  }

  const result = await createBasicSession({
    cohortId,
    epicId,
    createdBy,
    date,
    slot: sessionNumber,
    defaults: sessionDefaults,
    sessionType: 'gap',
    title: experience.title,
  });

  if (result.success && result.data) {
    return {
      success: true,
      data: [result.data],
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to create GAP session',
  };
}
