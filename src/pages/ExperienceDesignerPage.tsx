import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { Palette, Sparkles, Target, Users } from 'lucide-react';

const ExperienceDesignerPage = () => {
  const { profile } = useAuth();

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Experience Design</h1>
          <p className='text-muted-foreground'>
            Design and optimize user experiences across the platform
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Palette className='h-5 w-5' />
                Design System
              </CardTitle>
              <CardDescription>Manage design components and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                User Journey Mapping
              </CardTitle>
              <CardDescription>Map and optimize user journeys</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>Coming soon</p>
            </CardContent>
          </Card>

          <Card className='cursor-pointer hover:shadow-md transition-shadow'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                User Research
              </CardTitle>
              <CardDescription>Conduct user research and testing</CardDescription>
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

export default ExperienceDesignerPage;
