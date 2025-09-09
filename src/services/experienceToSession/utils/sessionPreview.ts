import type { Experience } from '@/types/experience';
import type { SessionPreview } from '../types';

/**
 * Get session creation preview for an experience
 */
export function getSessionPreview(experience: Experience): SessionPreview {
  switch (experience.type) {
    case 'CBL': {
      const lectureCount = Array.isArray(experience.lecture_sessions)
        ? experience.lecture_sessions.length
        : 0;
      // Pattern:
      // - If lectures >= 1: Challenge+Learn combined (1) + Innovate (1) + for each remaining lecture: Learn (1) + Innovate (1) + final Transform (1)
      //   => total = 2*lectureCount + 1
      // - If lectures == 0: Challenge Intro (1) + Innovate (1) + Transform (1) => 3
      const sessionCount = lectureCount > 0 ? 2 * lectureCount + 1 : 3;
      return {
        sessionCount,
        sessionTypes: [
          'Challenge Introduction + Learn (combined)',
          'Innovate (paired with each Learn)',
          'Transform (combined with Reflection visually)',
        ],
        description:
          'Creates a CBL schedule where each Learn is paired with an Innovate; first card combines Challenge + first Learn; final card is Transform (with Reflection)',
      };
    }
    case 'Mock Challenge':
      return {
        sessionCount: 1,
        sessionTypes: ['Mock Challenge'],
        description: 'Creates a single mock challenge session',
      };
    case 'Masterclass':
      return {
        sessionCount: 1,
        sessionTypes: ['Masterclass'],
        description: 'Creates a single masterclass session',
      };
    case 'Workshop':
      return {
        sessionCount: 1,
        sessionTypes: ['Workshop'],
        description: 'Creates a single workshop session',
      };
    case 'GAP':
      return {
        sessionCount: 1,
        sessionTypes: ['GAP'],
        description: 'Creates a single GAP session',
      };
    default:
      return {
        sessionCount: 1,
        sessionTypes: ['Session'],
        description: 'Creates a single session',
      };
  }
}
