import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const StudentDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Programs</CardTitle>
              <CardDescription>View your enrolled programs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No programs enrolled yet.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Upcoming assignments and submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No assignments due.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Track your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">0% complete</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentDashboard;