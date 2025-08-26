import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';
import { ValidationUtils } from '@/utils/validation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Home, Mail } from 'lucide-react';

interface DashboardAccessControlProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const DashboardAccessControl: React.FC<DashboardAccessControlProps> = ({
  children,
  fallback,
}) => {
  const { profile } = useAuth();
  const { isEnabled: hasDashboardAccess } = useFeatureFlag(
    'dashboard-access-control',
    {
      defaultValue: true,
    }
  );

  // Memoize the access decision to prevent flickering
  const accessDecision = useMemo(() => {
    // If no profile or email, show loading
    if (!profile || !profile.email) {
      return { type: 'loading' as const };
    }

    // Check if user has litschool.in email
    const isLitschoolEmail = ValidationUtils.isLitschoolEmail(profile.email);
    const isStudent = profile.role === 'student';

    // If user has litschool.in email, allow access
    if (isLitschoolEmail) {
      return { type: 'allowed' as const, reason: 'litschool-email' };
    }

    // If user is a student, allow access (students can use any email)
    if (isStudent) {
      return { type: 'allowed' as const, reason: 'student-role' };
    }

    // For non-student users without litschool.in email, check feature flag
    if (hasDashboardAccess === false) {
      // Feature flag is enabled and denying access
      return { type: 'denied' as const, reason: 'admin-non-litschool-email' };
    } else if (hasDashboardAccess === true) {
      // Feature flag is enabled and allowing access (shouldn't happen for non-litschool emails)
      return { type: 'allowed' as const, reason: 'feature-flag-allowed' };
    } else {
      // Feature flag is disabled or not evaluated yet
      return { type: 'allowed' as const, reason: 'feature-flag-disabled' };
    }
  }, [profile, hasDashboardAccess]);

  // Debug logging
  console.log('🔍 DashboardAccessControl Debug:', {
    profile: profile
      ? {
          email: profile.email,
          role: profile.role,
          userId: profile.user_id,
        }
      : null,
    hasDashboardAccess,
    accessDecision,
    profileExists: !!profile,
    emailExists: !!profile?.email,
    contextReady: !!(profile?.email && profile?.role),
    isLitschoolEmail: profile?.email
      ? ValidationUtils.isLitschoolEmail(profile.email)
      : null,
    isStudent: profile?.role === 'student',
  });

  // Handle different access decisions
  switch (accessDecision.type) {
    case 'loading':
      console.log('⏳ No profile or email - showing loading');
      return (
        <div className='min-h-screen flex items-center justify-center bg-background'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        </div>
      );

    case 'allowed':
      console.log(`✅ Access allowed - reason: ${accessDecision.reason}`);
      return <>{children}</>;

    case 'denied':
      console.log(`❌ Access denied - reason: ${accessDecision.reason}`);

      // If custom fallback is provided, use it
      if (fallback) {
        console.log('📋 Using custom fallback');
        return <>{fallback}</>;
      }

      // Show access denied message for non-student users without litschool.in email
      return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='flex justify-center mb-4'>
                <div className='p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full'>
                  <Shield className='h-8 w-8 text-amber-600 dark:text-amber-400' />
                </div>
              </div>
              <CardTitle className='text-xl'>Access Restricted</CardTitle>
              <CardDescription>
                Administrative access requires @litschool.in email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center space-y-2'>
                <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                  <Mail className='h-4 w-4' />
                  <span>Current email: {profile?.email}</span>
                </div>
                <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
                  <span>Role: {profile?.role}</span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  To access administrative features, please use an email address
                  ending with @litschool.in
                </p>
              </div>

              <div className='bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3'>
                <div className='flex items-start gap-2'>
                  <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0' />
                  <div className='text-sm'>
                    <p className='font-medium text-amber-800 dark:text-amber-200 mb-1'>
                      Limited Access
                    </p>
                    <p className='text-amber-700 dark:text-amber-300'>
                      Students can use any email domain, but administrative
                      roles require @litschool.in email addresses.
                    </p>
                  </div>
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
                  onClick={() => (window.location.href = '/auth')}
                >
                  <Home className='h-4 w-4 mr-2' />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
};
