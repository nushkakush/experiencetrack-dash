import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const FeeCollectorDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fee Collector Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Track payment collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">₹0 collected today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees</CardTitle>
              <CardDescription>Pending fee collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No outstanding fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Reports</CardTitle>
              <CardDescription>Generate fee collection reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No reports available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default FeeCollectorDashboard;