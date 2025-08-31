import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Users, BookOpen, MessageSquare, TrendingUp } from 'lucide-react';

const MentorManagerDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Mentor Manager Dashboard</h1>
          <p className='text-muted-foreground'>
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Mentor Management
              </CardTitle>
              <CardDescription>Manage mentors and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Mentorship Programs
              </CardTitle>
              <CardDescription>
                View and manage mentorship programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MessageSquare className='h-5 w-5' />
                Communication
              </CardTitle>
              <CardDescription>
                Manage mentor-student communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Analytics
              </CardTitle>
              <CardDescription>
                View mentorship analytics and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>
        </div>

        <div className='mt-8'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest mentorship activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                No recent activity to display.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default MentorManagerDashboard;
