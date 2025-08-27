import React from 'react';
import { useEquipmentPermission } from '@/domains/equipment/hooks/useEquipmentPermissions';
import { FeatureKey } from '@/types/features';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Home } from 'lucide-react';

interface EquipmentAccessControlProps {
  children: React.ReactNode;
  requiredPermission: FeatureKey;
  fallback?: React.ReactNode;
}

export const EquipmentAccessControl: React.FC<EquipmentAccessControlProps> = ({
  children,
  requiredPermission,
  fallback,
}) => {
  const { hasPermission, isLoading } =
    useEquipmentPermission(requiredPermission);

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading permissions...</p>
        </div>
      </div>
    );
  }

  // If user has permission, show the content
  if (hasPermission) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied message
  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full'>
              <Shield className='h-8 w-8 text-amber-600 dark:text-amber-400' />
            </div>
          </div>
          <CardTitle className='text-xl'>Equipment Access Restricted</CardTitle>
          <CardDescription>
            You don't have permission to access this equipment feature
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Required permission:{' '}
              <code className='bg-muted px-2 py-1 rounded text-xs'>
                {requiredPermission}
              </code>
            </p>
            <p className='text-sm text-muted-foreground'>
              Please contact your administrator if you believe you should have
              access to this feature.
            </p>
          </div>

          <div className='bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
            <div className='text-sm'>
              <p className='font-medium text-amber-800 dark:text-amber-200 mb-1'>
                Access Required
              </p>
              <p className='text-amber-700 dark:text-amber-300'>
                Equipment management features require specific permissions based
                on your role.
              </p>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button
              className='flex-1'
              onClick={() => (window.location.href = '/')}
            >
              <Home className='h-4 w-4 mr-2' />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
