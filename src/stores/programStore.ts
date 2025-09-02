import { create } from 'zustand';
import type { Session } from '../domains/sessions/types';
import type { CBLSession, Epic } from '../domains/programs/types';

interface ProgramState {
  // State
  currentEpic: Epic | null;
  plannedSessions: Session[];
  cblSessions: CBLSession[];
  loadingSessions: boolean;
  loadingCBLSessions: boolean;
  selectedDate: Date | null;

  // Actions
  setCurrentEpic: (epic: Epic | null) => void;
  setPlannedSessions: (sessions: Session[]) => void;
  setCBLSessions: (sessions: CBLSession[]) => void;
  addPlannedSession: (session: Session) => void;
  updatePlannedSession: (sessionId: string, updates: Partial<Session>) => void;
  removePlannedSession: (sessionId: string) => void;
  setLoadingSessions: (loading: boolean) => void;
  setLoadingCBLSessions: (loading: boolean) => void;
  setSelectedDate: (date: Date | null) => void;
  clearProgramData: () => void;
}

export const useProgramStore = create<ProgramState>((set, get) => ({
  // Initial state
  currentEpic: null,
  plannedSessions: [],
  cblSessions: [],
  loadingSessions: false,
  loadingCBLSessions: false,
  selectedDate: null,

  // Actions
  setCurrentEpic: epic => set({ currentEpic: epic }),

  setPlannedSessions: sessions => set({ plannedSessions: sessions }),

  setCBLSessions: sessions => set({ cblSessions: sessions }),

  addPlannedSession: session =>
    set(state => ({
      plannedSessions: [...state.plannedSessions, session],
    })),

  updatePlannedSession: (sessionId, updates) =>
    set(state => ({
      plannedSessions: state.plannedSessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
      ),
    })),

  removePlannedSession: sessionId =>
    set(state => ({
      plannedSessions: state.plannedSessions.filter(
        session => session.id !== sessionId
      ),
    })),

  setLoadingSessions: loading => set({ loadingSessions: loading }),

  setLoadingCBLSessions: loading => set({ loadingCBLSessions: loading }),

  setSelectedDate: date => set({ selectedDate: date }),

  clearProgramData: () =>
    set({
      currentEpic: null,
      plannedSessions: [],
      cblSessions: [],
      loadingSessions: false,
      loadingCBLSessions: false,
      selectedDate: null,
    }),
}));
