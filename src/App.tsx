import React, { useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/hooks/useAuth';
import { ActiveEpicProvider } from '@/contexts/ActiveEpicContext';
import { ErrorBoundary, DashboardAccessControl } from '@/components/common';
import Index from './pages/Index';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import SelfRegistrationVerification from './pages/auth/SelfRegistrationVerification';
import ResetPassword from './pages/auth/ResetPassword';
import ApplicationComingSoon from './pages/auth/ApplicationComingSoon';
import ProfilePage from './pages/ProfilePage';
import DashboardRouter from './pages/DashboardRouter';
import CohortsPage from './pages/CohortsPage';
import CohortDetailsPage from './pages/CohortDetailsPage';
import CohortAttendancePage from './pages/CohortAttendancePage';
import CohortProgramPage from './pages/CohortProgramPage';
import CohortAttendanceDashboard from './pages/dashboards/CohortAttendanceDashboard';
import CohortApplicationsDashboard from './pages/dashboards/CohortApplicationsDashboard';
import FeePaymentDashboard from './pages/FeePaymentDashboard';
import UserManagementPage from './pages/user-management/UserManagementPage';
import EquipmentInventoryPage from './pages/EquipmentInventoryPage';
import BorrowingHistoryPage from './pages/BorrowingHistoryPage';
import { EquipmentAccessControl } from './components/equipment';
import PublicLeaderboard from './pages/PublicLeaderboard';
import PublicCombinedLeaderboard from './pages/PublicCombinedLeaderboard';
import PublicEquipmentIssuePage from './pages/public/PublicEquipmentIssuePage';
import InvitationPage from './pages/InvitationPage';
import UserInvitationPage from './pages/UserInvitationPage';
import MentorManagementPage from './pages/mentor-management/MentorManagementPage';
import ExperienceDesignerPage from './pages/ExperienceDesignerPage';
import ExperienceDesignManagementPage from './pages/ExperienceDesignManagementPage';
import EpicsManagementPage from './pages/EpicsManagementPage';
import EpicLearningPathsManagementPage from './pages/EpicLearningPathsManagementPage';

import ProtectedRoute from './components/ProtectedRoute';
import {
  FeatureProtectedRoute,
  CohortManagementProtectedRoute,
  FeeManagementProtectedRoute,
  AttendanceManagementProtectedRoute,
  ProgramFeatureGate,
} from './components/common';
import NotFound from './pages/NotFound';

import { APP_CONFIG } from '@/config/constants';
import './App.css';

import { queryClient } from '@/lib/query/queryClient';
import { appLifecycleLogger } from '@/lib/logging/AppLifecycleLogger';
import { queryLogger } from '@/lib/logging/QueryLogger';
import {
  useLifecycleLogging,
  useRouteLogging,
} from '@/hooks/useLifecycleLogging';
import '@/utils/featureFlagUtils';
import { FeatureFlagProvider } from '@/lib/feature-flags/FeatureFlagProvider';

const App = () => {
  // Initialize lifecycle logging
  useEffect(() => {
    console.log('🔄 [DEBUG] App component mounting...');
    appLifecycleLogger.initialize();
    queryLogger.initialize();

    // Add debugging for potential reload causes
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🔄 [DEBUG] Before unload event triggered', {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memory: (performance as any).memory
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              usedJSHeapSize: (performance as any).memory?.usedJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              totalJSHeapSize: (performance as any).memory?.totalJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit,
            }
          : 'Not available',
        navigationType: performance.navigation.type,
        timing: performance.timing,
        userAgent: navigator.userAgent,
      });
      appLifecycleLogger.logEvent('beforeunload', {
        message: 'Page is about to unload',
        reason: 'beforeunload event',
      });
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      console.log('🔄 [DEBUG] Page show event triggered', {
        persisted: event.persisted,
        navigationType: performance.navigation.type,
        timing: performance.timing,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        memory: (performance as any).memory
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              usedJSHeapSize: (performance as any).memory?.usedJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              totalJSHeapSize: (performance as any).memory?.totalJSHeapSize,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit,
            }
          : 'Not available',
        timestamp: Date.now(),
      });
      appLifecycleLogger.logEvent('mount', {
        message: 'Page shown',
        persisted: event.persisted,
        isReload: !event.persisted,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);

    // Add more event listeners to catch potential triggers
    const handlePageHide = (event: PageTransitionEvent) => {
      console.log('🔄 [DEBUG] Page hide event triggered', {
        persisted: event.persisted,
        timestamp: Date.now(),
      });
    };

    const handleVisibilityChange = () => {
      console.log('🔄 [DEBUG] Visibility change event triggered', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: Date.now(),
      });
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🔄 [DEBUG] App component unmounting...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Use lifecycle logging for the main App component
  useLifecycleLogging({
    componentName: 'App',
    trackMount: true,
    trackUnmount: true,
  });

  // Track route changes
  useRouteLogging();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider>
              <ActiveEpicProvider>
                <FeatureFlagProvider>
                  <Toaster />
                  <Sonner />
                  <HelmetProvider>
                    <BrowserRouter
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                      }}
                      basename='/'
                    >
                      <Routes>
                        <Route
                          path='/'
                          element={
                            <ProtectedRoute>
                              <Navigate to='/dashboard' replace />
                            </ProtectedRoute>
                          }
                        />
                        <Route path='/auth' element={<Login />} />
                        <Route path='/auth/login' element={<Login />} />
                        <Route path='/auth/register' element={<Register />} />
                        <Route
                          path='/auth/verify-email'
                          element={<VerifyEmail />}
                        />
                        <Route
                          path='/auth/self-registration-verification'
                          element={<SelfRegistrationVerification />}
                        />
                        <Route
                          path='/auth/application-coming-soon'
                          element={<ApplicationComingSoon />}
                        />
                        <Route
                          path='/reset-password'
                          element={<ResetPassword />}
                        />
                        <Route
                          path='/dashboard'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <DashboardRouter />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/mentor-management'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <MentorManagementPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/experience-design'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <ExperienceDesignerPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/epics'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <EpicsManagementPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/epic-learning-paths'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <EpicLearningPathsManagementPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/experience-design-management'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <ExperienceDesignManagementPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/user-management'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <DashboardRouter />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/dashboard/fee-payment'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <DashboardRouter />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <CohortsPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <CohortDetailsPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId/attendance'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <CohortAttendancePage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId/program'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <ProgramFeatureGate action='manage'>
                                  <CohortProgramPage />
                                </ProgramFeatureGate>
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId/attendance/dashboard'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <CohortAttendanceDashboard />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId/fee-payment'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <FeePaymentDashboard />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/cohorts/:cohortId/applications'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <CohortApplicationsDashboard />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/fee-payment'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <FeePaymentDashboard />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/user-management'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <UserManagementPage />
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/equipment-inventory'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <EquipmentAccessControl requiredPermission='equipment.inventory'>
                                  <EquipmentInventoryPage />
                                </EquipmentAccessControl>
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path='/borrowing-history'
                          element={
                            <ProtectedRoute>
                              <DashboardAccessControl>
                                <EquipmentAccessControl requiredPermission='equipment.borrowing_history'>
                                  <BorrowingHistoryPage />
                                </EquipmentAccessControl>
                              </DashboardAccessControl>
                            </ProtectedRoute>
                          }
                        />

                        <Route path='/profile' element={<ProfilePage />} />
                        <Route
                          path='/invitation/:token'
                          element={<InvitationPage />}
                        />
                        <Route
                          path='/invite/:token'
                          element={<InvitationPage />}
                        />
                        <Route
                          path='/user-invite/:token'
                          element={<UserInvitationPage />}
                        />
                        <Route
                          path='/public/leaderboard/:cohortId/:epicId'
                          element={<PublicLeaderboard />}
                        />
                        <Route
                          path='/public/leaderboards/:cohortIds'
                          element={<PublicCombinedLeaderboard />}
                        />
                        <Route
                          path='/public/equipment/issue'
                          element={<PublicEquipmentIssuePage />}
                        />

                        <Route path='*' element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </HelmetProvider>
                </FeatureFlagProvider>
              </ActiveEpicProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
