import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AttendanceStatus, AbsenceType } from '@/types/attendance';
import { 
  AttendanceState, 
  AttendanceRecord, 
  AttendanceStats,
  AttendanceFilters,
  FilterValue
} from '@/types/attendance/AttendanceStoreTypes';

// Using imported AttendanceState interface from AttendanceStoreTypes

const initialState = {
  selectedDate: new Date(),
  selectedSession: 1,
  attendanceRecords: [],
  attendanceStats: null,
  isLoading: false,
  error: null,
  markingAttendance: new Set(),
  filters: {
    status: 'all' as AttendanceStatus | 'all',
    absenceType: 'all' as AbsenceType | 'all',
    dateRange: { start: null, end: null },
  },
};

export const useAttendanceStore = create<AttendanceState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Date and session actions
        setSelectedDate: (date: Date) => {
          set({ selectedDate: date });
        },

        setSelectedSession: (session: number) => {
          set({ selectedSession: session });
        },

        // Attendance data actions
        setAttendanceRecords: (records: AttendanceRecord[]) => {
          set({ attendanceRecords: records });
        },

        // Statistics actions
        setAttendanceStats: (stats: AttendanceStats) => {
          set({ attendanceStats: stats });
        },

        // Loading actions
        setIsLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Error actions
        setError: (error: string | null) => {
          set({ error });
        },

        // Marking attendance actions
        setMarkingAttendance: (studentId: string, isMarking: boolean) => {
          set((state) => {
            const newMarking = new Set(state.markingAttendance);
            if (isMarking) {
              newMarking.add(studentId);
            } else {
              newMarking.delete(studentId);
            }
            return { markingAttendance: newMarking };
          });
        },

        // Filter actions
        setFilter: (filter: keyof AttendanceFilters, value: FilterValue) => {
          set((state) => ({
            filters: {
              ...state.filters,
              [filter]: value,
            },
          }));
        },

        // Reset actions
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'attendance-store',
        partialize: (state) => ({
          selectedDate: state.selectedDate,
          selectedSession: state.selectedSession,
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'attendance-store',
    }
  )
);

// Selector hooks for better performance
export const useSelectedDate = () => useAttendanceStore((state) => state.selectedDate);
export const useSelectedSession = () => useAttendanceStore((state) => state.selectedSession);
export const useAttendanceRecords = () => useAttendanceStore((state) => state.attendanceRecords);
export const useAttendanceStats = () => useAttendanceStore((state) => state.attendanceStats);
export const useAttendanceLoading = () => useAttendanceStore((state) => state.isLoading);
export const useAttendanceError = () => useAttendanceStore((state) => state.error);
export const useMarkingAttendance = () => useAttendanceStore((state) => state.markingAttendance);
export const useAttendanceFilters = () => useAttendanceStore((state) => state.filters);
