import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FeeCollectorDashboard = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Fee Collector Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.first_name} {profile?.last_name}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Overview</CardTitle>
              <CardDescription>Track payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No payments recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees</CardTitle>
              <CardDescription>Monitor pending payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">₹0 outstanding</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee Reports</CardTitle>
              <CardDescription>Generate financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No reports available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeeCollectorDashboard;