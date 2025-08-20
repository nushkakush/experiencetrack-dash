import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardShell from '@/components/DashboardShell';
import { BarChart3, Settings, Users, FileText } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserManagementPage from '../user-management/UserManagementPage';

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserManagementClick = () => {
    navigate('/user-management');
  };

  // Check if we're on the user management route
  const isUserManagementRoute = location.pathname === '/user-management';

  return (
    <DashboardShell>
      {isUserManagementRoute ? (
        <UserManagementPage />
      ) : (
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold'>Super Admin Dashboard</h1>
            <p className='text-muted-foreground'>
              Welcome back, {profile?.first_name} {profile?.last_name}
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={handleUserManagementClick}
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  User Management
                </CardTitle>
                <CardDescription>Manage system users and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>0 active users</p>
              </CardContent>
            </Card>

            <Card className='cursor-pointer hover:shadow-md transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  System Settings
                </CardTitle>
                <CardDescription>Configure system parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  All systems operational
                </p>
              </CardContent>
            </Card>

            <Card className='cursor-pointer hover:shadow-md transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Analytics
                </CardTitle>
                <CardDescription>View system analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  No data available
                </p>
              </CardContent>
            </Card>

            <Card className='cursor-pointer hover:shadow-md transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Reports
                </CardTitle>
                <CardDescription>Generate system reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  No reports generated
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
