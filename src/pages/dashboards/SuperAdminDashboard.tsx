import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const SuperAdminDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">0 active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>View system analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate system reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No reports generated</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SuperAdminDashboard;