import type { Experience } from '@/types/experience';
import type {
  ExperienceToSessionOptions,
  SessionCreationResult,
  SessionPreview,
} from './types';
import { getSessionPreview } from './utils/sessionPreview';
import { createCBLExperienceSessions } from './creators/cblSessionCreators';
import {
  createMockChallengeSessions,
  createMasterclassSessions,
  createWorkshopSessions,
  createGAPSessions,
} from './creators/simpleSessionCreators';

export class ExperienceToSessionService {
  /**
   * Convert an experience to sessions and add them to the timetable
   */
  static async addExperienceToTimetable(
    options: ExperienceToSessionOptions
  ): Promise<SessionCreationResult> {
    const { experience } = options;

    try {
      switch (experience.type) {
        case 'CBL':
          return await createCBLExperienceSessions(options);
        case 'Mock Challenge':
          return await createMockChallengeSessions(options);
        case 'Masterclass':
          return await createMasterclassSessions(options);
        case 'Workshop':
          return await createWorkshopSessions(options);
        case 'GAP':
          return await createGAPSessions(options);
        default:
          throw new Error(`Unsupported experience type: ${experience.type}`);
      }
    } catch (error) {
      console.error('Error adding experience to timetable:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get session creation preview for an experience
   */
  static getSessionPreview(experience: Experience): SessionPreview {
    return getSessionPreview(experience);
  }
}
