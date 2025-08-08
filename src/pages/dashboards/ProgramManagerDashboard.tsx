import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ProgramManagerDashboard = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Program Manager Dashboard</h1>
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
              <CardTitle>Program Overview</CardTitle>
              <CardDescription>Manage active programs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active programs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment</CardTitle>
              <CardDescription>Monitor student participation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">0 students enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Management</CardTitle>
              <CardDescription>Organize program schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No scheduled events</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgramManagerDashboard;