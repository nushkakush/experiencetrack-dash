import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Palette, Sparkles } from 'lucide-react';

const ExperienceDesignerDashboard = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Experience Designer Dashboard</h1>
          <p className='text-muted-foreground'>
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Palette className='h-5 w-5' />
                Experience Design
              </CardTitle>
              <CardDescription>Design and manage user experiences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5' />
                Experience Analytics
              </CardTitle>
              <CardDescription>Analyze user experience metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ExperienceDesignerDashboard;
