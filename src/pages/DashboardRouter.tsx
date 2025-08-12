import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import StudentDashboard from './dashboards/StudentDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import ProgramManagerDashboard from './dashboards/ProgramManagerDashboard';
import FeeCollectorDashboard from './dashboards/FeeCollectorDashboard';
import PartnershipsHeadDashboard from './dashboards/PartnershipsHeadDashboard';
import PlacementCoordinatorDashboard from './dashboards/PlacementCoordinatorDashboard';

const DashboardRouter = () => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated first, then check profile
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated but profile is still loading, show loading
  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  switch (profile.role) {
    case 'student':
      return <StudentDashboard currentRoute={location.pathname} />;
    case 'super_admin':
      return <SuperAdminDashboard />;
    case 'program_manager':
      return <ProgramManagerDashboard />;
    case 'fee_collector':
      return <FeeCollectorDashboard />;
    case 'partnerships_head':
      return <PartnershipsHeadDashboard />;
    case 'placement_coordinator':
      return <PlacementCoordinatorDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Role</h1>
            <p className="text-muted-foreground">Your account role is not recognized.</p>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;