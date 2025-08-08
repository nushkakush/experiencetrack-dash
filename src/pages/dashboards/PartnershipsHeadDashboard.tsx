import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const PartnershipsHeadDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Partnerships Head Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Partnerships</CardTitle>
              <CardDescription>Current partnership status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active partnerships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partnership Leads</CardTitle>
              <CardDescription>Potential partnership opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No leads available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partnership Analytics</CardTitle>
              <CardDescription>Performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default PartnershipsHeadDashboard;