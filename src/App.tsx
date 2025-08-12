
import React from 'react';
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
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { APP_CONFIG } from "@/config/constants";
import './App.css';

import { queryClient } from '@/lib/query/queryClient';

const App = () => (
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
