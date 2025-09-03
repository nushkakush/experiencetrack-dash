import { Target, Users, Wrench, BookOpen } from 'lucide-react';
import type { Session, SessionType, SessionTypeConfig } from '../types';

export class SessionService {
  /**
   * Get session type configuration
   */
  static getSessionTypeConfig(type: SessionType): SessionTypeConfig {
    const configs: Record<SessionType, SessionTypeConfig> = {
      cbl: {
        type: 'cbl',
        label: 'CBL',
        icon: Target,
        color:
          'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25',
        description: 'Challenge-Based Learning',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      challenge_intro: {
        type: 'challenge_intro',
        label: 'CI',
        icon: Target,
        color:
          'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-blue-400/25',
        description: 'Challenge + Learn',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      learn: {
        type: 'learn',
        label: 'L',
        icon: Target,
        color:
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
        description: 'Learn Session',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      innovate: {
        type: 'innovate',
        label: 'I',
        icon: Target,
        color:
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
        description: 'Innovate Session',
        defaultRole: 'trainer',
        allowMultipleAssignments: true,
        roleLabel: 'Trainer',
      },
      transform: {
        type: 'transform',
        label: 'T',
        icon: Target,
        color:
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
        description: 'Transform Session',
        defaultRole: 'judge',
        allowMultipleAssignments: true,
        roleLabel: 'Judge',
      },
      reflection: {
        type: 'reflection',
        label: 'R',
        icon: Target,
        color:
          'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25',
        description: 'Reflection Session',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      masterclass: {
        type: 'masterclass',
        label: 'MC',
        icon: Users,
        color:
          'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25',
        description: 'Masterclass',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      workshop: {
        type: 'workshop',
        label: 'WS',
        icon: Wrench,
        color:
          'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25',
        description: 'Workshop',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      gap: {
        type: 'gap',
        label: 'GAP',
        icon: BookOpen,
        color:
          'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25',
        description: 'Gap Day',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
      mock_challenge: {
        type: 'mock_challenge',
        label: 'MC',
        icon: Target,
        color:
          'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25',
        description: 'Mock Challenge',
        defaultRole: 'mentor',
        allowMultipleAssignments: false,
        roleLabel: 'Mentor',
      },
    };

    return configs[type];
  }

  /**
   * Get sessions for a specific date
   */
  static getSessionsForDate(sessions: Session[], date: Date): Session[] {
    const dateStr = this.formatDateForComparison(date);
    return sessions.filter(session => session.session_date === dateStr);
  }

  /**
   * Get session for a specific date and session number
   */
  static getSessionForDateAndNumber(
    sessions: Session[],
    date: Date,
    sessionNumber: number
  ): Session | undefined {
    const dateStr = this.formatDateForComparison(date);
    return sessions.find(
      session =>
        session.session_date === dateStr &&
        session.session_number === sessionNumber
    );
  }

  /**
   * Check if a session slot is available
   */
  static isSessionSlotAvailable(
    sessions: Session[],
    date: Date,
    sessionNumber: number
  ): boolean {
    const existingSession = this.getSessionForDateAndNumber(
      sessions,
      date,
      sessionNumber
    );
    if (existingSession) {
      console.log(
        `🔴 Session: Slot ${sessionNumber} unavailable - existing session found on ${this.formatDateForComparison(date)}`
      );
      return false;
    }

    console.log(
      `🟢 Session: Slot ${sessionNumber} available on ${this.formatDateForComparison(date)}`
    );
    return true;
  }

  /**
   * Calculate cell height based on number of sessions
   */
  static calculateCellHeight(sessionsCount: number): string {
    // Regular sessions
    if (sessionsCount === 0) return 'min-h-64';
    if (sessionsCount === 1) return 'min-h-80';
    if (sessionsCount === 2) return 'min-h-96';
    return 'min-h-[28rem]';
  }

  /**
   * Get session number for a specific session
   */
  static getSessionNumber(session: Session): number {
    return session.session_number || 1;
  }

  /**
   * Format date for comparison (YYYY-MM-DD)
   */
  static formatDateForComparison(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }
}
