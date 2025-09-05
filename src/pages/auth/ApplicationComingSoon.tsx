import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Clock, CheckCircle, LogOut } from 'lucide-react';
import { SEO, PageSEO } from '@/components/common';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ApplicationComingSoon = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        toast.error('Failed to logout. Please try again.');
        return;
      }

      // Clear any additional stored data
      localStorage.clear();
      sessionStorage.clear();

      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred during logout. Please try again.');
    }
  };

  return (
    <>
      <SEO {...PageSEO.applicationComingSoon} />
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-2xl mx-auto'>
          <CardHeader className='text-center'>
            <div className='flex justify-center mb-6'>
              <Logo size='lg' showText={false} />
            </div>
            <div className='flex justify-center mb-4'>
              <CheckCircle className='h-12 w-12 text-green-500' />
            </div>
            <CardTitle className='text-2xl font-semibold text-foreground'>
              Registration Successful!
            </CardTitle>
            <CardDescription className='text-muted-foreground mt-2'>
              Your account has been created and you're ready to begin your
              journey.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Status Cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border'>
                <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />
                <div>
                  <p className='font-medium text-foreground'>Account Created</p>
                  <p className='text-sm text-muted-foreground'>
                    Email verified & password set
                  </p>
                </div>
              </div>

              <div className='flex items-center space-x-3 p-4 bg-muted/50 rounded-lg border'>
                <Clock className='h-5 w-5 text-muted-foreground flex-shrink-0' />
                <div>
                  <p className='font-medium text-foreground'>
                    Application Process
                  </p>
                  <p className='text-sm text-muted-foreground'>Coming soon</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className='text-center space-y-4'>
              <h3 className='text-xl font-semibold'>What's Next?</h3>
              <p className='text-muted-foreground'>
                We're currently preparing the application process for your
                selected cohort. You'll receive an email notification as soon as
                applications open.
              </p>

              <div className='bg-muted/50 border rounded-lg p-4'>
                <p className='text-foreground font-medium'>
                  📧 Keep an eye on your email
                </p>
                <p className='text-sm text-muted-foreground mt-1'>
                  We'll notify you when the application process begins
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                onClick={handleLogout}
                variant='outline'
                className='flex items-center space-x-2'
              >
                <LogOut className='h-4 w-4' />
                <span>Logout</span>
              </Button>
            </div>

            {/* Additional Info */}
            <div className='text-center text-sm text-muted-foreground'>
              <p>
                Questions? Contact us at{' '}
                <a
                  href='mailto:support@example.com'
                  className='text-primary hover:underline'
                >
                  support@example.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ApplicationComingSoon;
