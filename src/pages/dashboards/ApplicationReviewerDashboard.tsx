import { useAuth } from '@/hooks/useAuth';
import DashboardShell from '@/components/DashboardShell';

const ApplicationReviewerDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Application Reviewer Dashboard</h1>
          <p className='text-muted-foreground'>
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ApplicationReviewerDashboard;
