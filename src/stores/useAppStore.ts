/**
 * Global application state using Zustand
 * Enterprise-level state management with proper typing
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/constants';

interface AppState {
  // Theme and UI preferences
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  
  // User preferences
  preferences: {
    pageSize: number;
    language: string;
    notifications: boolean;
    emailUpdates: boolean;
  };
  
  // Global loading states
  globalLoading: boolean;
  
  // Error handling
  globalError: string | null;
  
  // Feature flags
  features: Record<string, boolean>;
}

interface AppActions {
  // Theme actions
  setTheme: (theme: AppState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Preferences actions
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Error actions
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  
  // Feature flags
  setFeature: (feature: string, enabled: boolean) => void;
  isFeatureEnabled: (feature: string) => boolean;
  
  // Reset actions
  reset: () => void;
}

type AppStore = AppState & AppActions;

const initialState: AppState = {
  theme: 'system',
  sidebarCollapsed: false,
  preferences: {
    pageSize: 25,
    language: 'en',
    notifications: true,
    emailUpdates: true,
  },
  globalLoading: false,
  globalError: null,
  features: {
    betaFeatures: false,
    advancedAnalytics: false,
    experimentalUI: false,
  },
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Theme actions
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        
        toggleSidebar: () => 
          set((state) => ({ 
            sidebarCollapsed: !state.sidebarCollapsed 
          }), false, 'toggleSidebar'),
        
        setSidebarCollapsed: (collapsed) => 
          set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),
        
        // Preferences actions
        updatePreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences }
          }), false, 'updatePreferences'),
        
        // Loading actions
        setGlobalLoading: (loading) => 
          set({ globalLoading: loading }, false, 'setGlobalLoading'),
        
        // Error actions
        setGlobalError: (error) => 
          set({ globalError: error }, false, 'setGlobalError'),
        
        clearGlobalError: () => 
          set({ globalError: null }, false, 'clearGlobalError'),
        
        // Feature flags
        setFeature: (feature, enabled) =>
          set((state) => ({
            features: { ...state.features, [feature]: enabled }
          }), false, 'setFeature'),
        
        isFeatureEnabled: (feature) => {
          const state = get();
          return state.features[feature] ?? false;
        },
        
        // Reset actions
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: STORAGE_KEYS.USER_PREFERENCES,
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          preferences: state.preferences,
          features: state.features,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// Selectors for better performance
export const useTheme = () => useAppStore((state) => state.theme);
export const useSidebarCollapsed = () => useAppStore((state) => state.sidebarCollapsed);
export const usePreferences = () => useAppStore((state) => state.preferences);
export const useGlobalLoading = () => useAppStore((state) => state.globalLoading);
export const useGlobalError = () => useAppStore((state) => state.globalError);
export const useFeatures = () => useAppStore((state) => state.features);