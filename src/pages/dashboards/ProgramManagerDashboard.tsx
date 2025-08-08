import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';

const ProgramManagerDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Program Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Overview</CardTitle>
              <CardDescription>Manage your programs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No programs available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment</CardTitle>
              <CardDescription>Track student enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">0 students enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule Management</CardTitle>
              <CardDescription>Manage class schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No scheduled classes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProgramManagerDashboard;