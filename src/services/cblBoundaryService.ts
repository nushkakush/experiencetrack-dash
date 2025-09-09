import type { Session } from '@/domains/sessions/types';
import { supabase } from '@/integrations/supabase/client';

export interface CBLBoundaryInfo {
  isBetweenCBLSet: boolean;
  cblChallengeTitle: string | null;
  availableSessionTypes: string[];
  isMockChallenge: boolean;
}

export interface CBLVisualBoundaryInfo {
  isBetweenCBLSet: boolean;
  cblChallengeTitle: string | null;
  cblChallengeId: string | null;
  cblStartDate: Date | null;
  cblEndDate: Date | null;
  cblSlotRange: { min: number; max: number } | null;
  isMockChallenge: boolean;
}

export class CBLBoundaryService {
  /**
   * Detect if a given date and session number is between CBL set boundaries
   * Uses the same logic as detectCBLVisualBoundaries for consistency
   */
  static async detectCBLBoundaries(
    date: Date,
    sessionNumber: number,
    plannedSessions: Session[],
    cohortId: string,
    epicId: string
  ): Promise<CBLBoundaryInfo> {
    // Use the visual boundary detection logic for consistency
    const visualBoundaries = await this.detectCBLVisualBoundaries(
      plannedSessions,
      cohortId,
      epicId
    );

    // Check if current date/slot is between any CBL boundaries
    for (const boundary of visualBoundaries) {
      if (!boundary.cblStartDate || !boundary.cblEndDate) continue;

      // **FIXED: Normalize dates to remove time components for accurate comparison**
      const currentDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const startDate = new Date(
        boundary.cblStartDate.getFullYear(),
        boundary.cblStartDate.getMonth(),
        boundary.cblStartDate.getDate()
      );
      const endDate = new Date(
        boundary.cblEndDate.getFullYear(),
        boundary.cblEndDate.getMonth(),
        boundary.cblEndDate.getDate()
      );

      const isDateInRange = currentDate >= startDate && currentDate <= endDate;

      if (!isDateInRange) continue;

      // If this is the end date, check if the slot is within the CBL session range
      if (currentDate.getTime() === endDate.getTime()) {
        const maxSlot = boundary.cblSlotRange?.max || 1;
        const isSlotInRange = sessionNumber <= maxSlot;

        if (isSlotInRange) {
          return {
            isBetweenCBLSet: true,
            cblChallengeTitle: boundary.cblChallengeTitle,
            availableSessionTypes: [
              'learn',
              'innovate',
              'transform',
              'masterclass',
              'workshop',
              'gap',
            ],
            isMockChallenge: boundary.isMockChallenge || false,
          };
        } else {
          return {
            isBetweenCBLSet: false,
            cblChallengeTitle: null,
            availableSessionTypes: [
              'cbl',
              'mock_challenge',
              'masterclass',
              'workshop',
              'gap',
            ],
            isMockChallenge: false,
          };
        }
      }

      // If this is a middle date (between start and end), all slots are within boundaries
      if (isDateInRange) {
        return {
          isBetweenCBLSet: true,
          cblChallengeTitle: boundary.cblChallengeTitle,
          availableSessionTypes: [
            'learn',
            'innovate',
            'transform',
            'masterclass',
            'workshop',
            'gap',
          ],
          isMockChallenge: boundary.isMockChallenge || false,
        };
      }
    }

    // Not between CBL set boundaries
    console.log(
      `❌ Date ${date.toISOString().split('T')[0]}, Slot ${sessionNumber} is OUTSIDE CBL boundaries`
    );
    return {
      isBetweenCBLSet: false,
      cblChallengeTitle: null,
      availableSessionTypes: [
        'cbl',
        'mock_challenge',
        'masterclass',
        'workshop',
        'gap',
      ],
      isMockChallenge: false,
    };
  }

  /**
   * Detect CBL boundaries for visual display purposes
   * Returns information about CBL challenge boundaries for a specific cohort/epic
   */
  static async detectCBLVisualBoundaries(
    plannedSessions: Session[],
    cohortId: string,
    epicId: string
  ): Promise<CBLVisualBoundaryInfo[]> {
    // Find all CBL and Mock Challenge sessions for this cohort and epic
    const cblSessions = plannedSessions.filter(
      session =>
        session.cohort_id === cohortId &&
        session.epic_id === epicId &&
        [
          'cbl',
          'challenge_intro',
          'learn',
          'innovate',
          'transform',
          'reflection',
          'mock_challenge',
        ].includes(session.session_type)
    );

    // Group CBL sessions by cbl_challenge_id to identify sets
    const cblSets = new Map<string, Session[]>();
    cblSessions.forEach(session => {
      const challengeId = session.cbl_challenge_id || 'no-challenge-id';
      if (!cblSets.has(challengeId)) {
        cblSets.set(challengeId, []);
      }
      cblSets.get(challengeId)!.push(session);
    });

    const boundaries: CBLVisualBoundaryInfo[] = [];

    // Check each CBL set
    for (const [challengeId, sessions] of cblSets) {
      if (sessions.length < 1) {
        console.log(
          `⚠️ Skipping empty CBL set "${challengeId}" with ${sessions.length} sessions`
        );
        continue; // Empty set, skip
      }

      // Sort sessions by date and session number
      const sortedSessions = sessions.sort((a, b) => {
        const dateA = new Date(a.session_date);
        const dateB = new Date(b.session_date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return (a.session_number || 1) - (b.session_number || 1);
      });

      // **CRITICAL FIX: Only consider the FIRST and LAST sessions for boundaries**
      // Middle sessions (like Innovate) should NOT affect the boundary calculation
      const firstSession = sortedSessions[0];
      const lastSession = sortedSessions[sortedSessions.length - 1];

      const firstDate = new Date(firstSession.session_date);
      const lastDate = new Date(lastSession.session_date);
      const challengeTitle =
        sessions[0]?.challenge_title || 'Unknown Challenge';
      const cblChallengeId = sessions[0]?.cbl_challenge_id || null;

      console.log(`🔍 Processing CBL Challenge "${challengeTitle}":`, {
        totalSessions: sessions.length,
        allSessions: sortedSessions.map(s => ({
          type: s.session_type,
          date: s.session_date,
          slot: s.session_number,
          title: s.title,
        })),
        firstSession: {
          type: firstSession.session_type,
          date: firstSession.session_date,
          slot: firstSession.session_number,
        },
        lastSession: {
          type: lastSession.session_type,
          date: lastSession.session_date,
          slot: lastSession.session_number,
        },
      });

      // **FIXED: Boundary is ONLY between first and last dates, regardless of middle sessions**
      console.log(`✅ CBL Challenge "${challengeTitle}" boundaries:`, {
        startDate: firstDate.toISOString().split('T')[0],
        endDate: lastDate.toISOString().split('T')[0],
        startSession: {
          type: firstSession.session_type,
          slot: firstSession.session_number,
        },
        endSession: {
          type: lastSession.session_type,
          slot: lastSession.session_number,
        },
        slotRange: { min: 1, max: lastSession.session_number || 1 },
        totalSessions: sessions.length,
        note: 'Boundary determined by start/end dates + slot precision on end date',
      });

      // Check if this is a mock challenge by fetching the is_mock flag from the database
      let isMockChallenge = false;
      if (cblChallengeId && cblChallengeId !== 'no-challenge-id') {
        try {
          // Fetch the is_mock flag from the challenge record
          const { data: challenge, error } = await supabase
            .from('cbl_challenges')
            .select('is_mock')
            .eq('id', cblChallengeId)
            .single();

          if (!error && challenge) {
            isMockChallenge = challenge.is_mock === true;
          } else {
            // Fallback: check if title contains "mock"
            isMockChallenge =
              challengeTitle?.toLowerCase().includes('mock') || false;
          }
        } catch (error) {
          console.error('Error fetching challenge is_mock flag:', error);
          // Fallback: check if title contains "mock"
          isMockChallenge =
            challengeTitle?.toLowerCase().includes('mock') || false;
        }

        console.log(`🔍 Mock challenge detection for "${challengeTitle}":`, {
          cblChallengeId,
          isMockChallenge,
          sessionTypes: sessions.map(s => s.session_type),
          sessionCount: sessions.length,
        });
      }

      boundaries.push({
        isBetweenCBLSet: true,
        cblChallengeTitle: challengeTitle,
        cblChallengeId: cblChallengeId,
        cblStartDate: firstDate,
        cblEndDate: lastDate,
        cblSlotRange: { min: 1, max: lastSession.session_number || 1 }, // Include slot number of the last CBL session
        isMockChallenge: isMockChallenge,
      });
    }

    console.log('🔍 Final CBL boundaries:', boundaries);
    return boundaries;
  }
}
