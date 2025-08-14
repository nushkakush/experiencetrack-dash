
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import ProfilePage from "./pages/ProfilePage";
import DashboardRouter from "./pages/DashboardRouter";
import CohortsPage from "./pages/CohortsPage";
import CohortDetailsPage from "./pages/CohortDetailsPage";
import CohortAttendancePage from "./pages/CohortAttendancePage";
import CohortAttendanceDashboard from "./pages/dashboards/CohortAttendanceDashboard";
import FeePaymentDashboard from "./pages/FeePaymentDashboard";
import PublicLeaderboard from "./pages/PublicLeaderboard";
import PublicCombinedLeaderboard from "./pages/PublicCombinedLeaderboard";
import InvitationPage from "./pages/InvitationPage";
import TestLoggingPage from "./pages/TestLoggingPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { APP_CONFIG } from "@/config/constants";
import './App.css';

import { queryClient } from '@/lib/query/queryClient';
import { appLifecycleLogger } from '@/lib/logging/AppLifecycleLogger';
import { queryLogger } from '@/lib/logging/QueryLogger';
import { useLifecycleLogging, useRouteLogging } from '@/hooks/useLifecycleLogging';
import { FloatingDebugButton } from '@/components/debug/DebugButton';

const App = () => {
  // Initialize lifecycle logging
  useEffect(() => {
    console.log('🔄 [DEBUG] App component mounting...');
    appLifecycleLogger.initialize();
    queryLogger.initialize();
    
    // Add debugging for potential reload causes
                 const handleBeforeUnload = (event: BeforeUnloadEvent) => {
               console.log('🔄 [DEBUG] Before unload event triggered', {
                 memory: performance.memory ? {
                   usedJSHeapSize: performance.memory.usedJSHeapSize,
                   totalJSHeapSize: performance.memory.totalJSHeapSize,
                   jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                 } : 'Not available',
                 navigationType: performance.navigation.type,
                 timing: performance.timing,
                 userAgent: navigator.userAgent
               });
               appLifecycleLogger.logEvent('beforeunload', {
                 message: 'Page is about to unload',
                 reason: 'beforeunload event'
               });
             };

                 const handlePageShow = (event: PageTransitionEvent) => {
               console.log('🔄 [DEBUG] Page show event triggered', { 
                 persisted: event.persisted,
                 navigationType: performance.navigation.type,
                 timing: performance.timing,
                 memory: performance.memory ? {
                   usedJSHeapSize: performance.memory.usedJSHeapSize,
                   totalJSHeapSize: performance.memory.totalJSHeapSize,
                   jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                 } : 'Not available',
                 timestamp: Date.now()
               });
               appLifecycleLogger.logEvent('mount', {
                 message: 'Page shown',
                 persisted: event.persisted,
                 isReload: !event.persisted
               });
             };

                 window.addEventListener('beforeunload', handleBeforeUnload);
             window.addEventListener('pageshow', handlePageShow);
             
             // Add more event listeners to catch potential triggers
             const handlePageHide = (event: PageTransitionEvent) => {
               console.log('🔄 [DEBUG] Page hide event triggered', {
                 persisted: event.persisted,
                 timestamp: Date.now()
               });
             };
             
             const handleVisibilityChange = () => {
               console.log('🔄 [DEBUG] Visibility change event triggered', {
                 hidden: document.hidden,
                 visibilityState: document.visibilityState,
                 timestamp: Date.now()
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
    trackUnmount: true
  });

  // Track route changes
  useRouteLogging();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
                basename="/"
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/auth" replace />} />
                  <Route path="/auth" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard/fee-payment" 
                    element={
                      <ProtectedRoute>
                        <DashboardRouter />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cohorts" 
                    element={
                      <ProtectedRoute>
                        <CohortsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cohorts/:cohortId" 
                    element={
                      <ProtectedRoute>
                        <CohortDetailsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cohorts/:cohortId/attendance" 
                    element={
                      <ProtectedRoute>
                        <CohortAttendancePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cohorts/:cohortId/fee-payment" 
                    element={
                      <ProtectedRoute>
                        <FeePaymentDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/program-manager/cohorts/:cohortId/attendance" 
                    element={
                      <ProtectedRoute>
                        <CohortAttendanceDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Public routes (no authentication required) */}
                  <Route path="/invite/:token" element={<InvitationPage />} />
                  <Route path="/public/leaderboard/:cohortId/:epicId" element={<PublicLeaderboard />} />
                  <Route path="/public/combined-leaderboard/:cohortIds" element={<PublicCombinedLeaderboard />} />
                  
                  {/* Debug routes - only in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <Route path="/test-logging" element={<TestLoggingPage />} />
                  )}
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              
              {/* Debug button - only show in development */}
              {process.env.NODE_ENV === 'development' && <FloatingDebugButton />}
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
