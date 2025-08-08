import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const PlacementCoordinatorDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Placement Coordinator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Placements</CardTitle>
              <CardDescription>Track student placements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No placements recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Relations</CardTitle>
              <CardDescription>Manage hiring partners</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No companies registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Placement Statistics</CardTitle>
              <CardDescription>View placement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No statistics available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default PlacementCoordinatorDashboard;