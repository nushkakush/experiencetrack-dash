import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SEO, PageSEO } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { RegistrationService } from '@/services/registration.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    'verifying' | 'success' | 'error'
  >('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const cohortId = searchParams.get('cohort_id');

  useEffect(() => {
    const completeRegistration = async () => {
      if (!user || !cohortId) {
        setVerificationStatus('error');
        setErrorMessage('Invalid verification link');
        return;
      }

      try {
        const result = await RegistrationService.completeRegistration(
          user.id,
          cohortId
        );

        if (result.success) {
          setVerificationStatus('success');
          toast.success(
            'Email verified successfully! You can now access your dashboard.'
          );
        } else {
          setVerificationStatus('error');
          setErrorMessage(result.error || 'Failed to complete registration');
        }
      } catch (error) {
        console.error('Registration completion error:', error);
        setVerificationStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    if (!authLoading && user) {
      completeRegistration();
    } else if (!authLoading && !user) {
      setVerificationStatus('error');
      setErrorMessage('Please log in to verify your email');
    }
  }, [user, authLoading, cohortId]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoToLogin = () => {
    navigate('/auth/login');
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...PageSEO.verifyEmail} />
      <div className='absolute top-4 right-4 z-10'>
        <ThemeToggle />
      </div>
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4'>
              {verificationStatus === 'verifying' && (
                <Loader2 className='h-16 w-16 text-blue-600 animate-spin' />
              )}
              {verificationStatus === 'success' && (
                <CheckCircle className='h-16 w-16 text-green-600' />
              )}
              {verificationStatus === 'error' && (
                <XCircle className='h-16 w-16 text-red-600' />
              )}
            </div>
            <CardTitle className='text-2xl'>
              {verificationStatus === 'verifying' && 'Verifying Your Email...'}
              {verificationStatus === 'success' &&
                'Email Verified Successfully!'}
              {verificationStatus === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {verificationStatus === 'verifying' &&
                'Please wait while we verify your email and complete your registration.'}
              {verificationStatus === 'success' &&
                'Your account has been successfully verified and you have been enrolled in your selected cohort.'}
              {verificationStatus === 'error' && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            {verificationStatus === 'success' && (
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  You can now access your dashboard and begin your learning
                  journey.
                </p>
                <Button onClick={handleGoToDashboard} className='w-full'>
                  Go to Dashboard
                </Button>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className='space-y-4'>
                <Button onClick={handleGoToLogin} className='w-full'>
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default VerifyEmail;
