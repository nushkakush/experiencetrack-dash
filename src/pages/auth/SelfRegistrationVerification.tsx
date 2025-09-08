import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SEO, PageSEO } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { ValidationUtils } from '@/utils/validation';

interface VerificationData {
  applicationId: string;
  profileId: string;
  cohortId: string;
  firstName: string;
  lastName: string;
  email: string;
  cohortName: string;
  cohortDescription?: string;
  cohortStartDate?: string;
  cohortEndDate?: string;
  isValid: boolean;
  isExpired: boolean;
}

const SelfRegistrationVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] =
    useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const cohortId = searchParams.get('cohort');

  useEffect(() => {
    if (!token || !cohortId) {
      setError(
        'Invalid verification link. Please check your email and try again.'
      );
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token, cohortId]);

  const verifyToken = async () => {
    try {
      // Find the application record with the verification token
      const { data: application, error: applicationError } = await supabase
        .from('student_applications')
        .select(
          `
          id,
          cohort_id,
          profile_id,
          invitation_token,
          invitation_expires_at,
          status,
          created_at
        `
        )
        .eq('cohort_id', cohortId)
        .eq('invitation_token', token)
        .single();

      if (applicationError || !application) {
        Logger.getInstance().error('Application not found', {
          error: applicationError,
        });
        setError(
          'Invalid verification link. Please check your email and try again.'
        );
        setLoading(false);
        return;
      }

      // Check if token is expired
      const expiresAt = new Date(application.invitation_expires_at);
      const isExpired = new Date() > expiresAt;

      if (isExpired) {
        setError('This verification link has expired. Please register again.');
        setLoading(false);
        return;
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', application.profile_id)
        .single();

      if (profileError || !profile) {
        Logger.getInstance().error('Profile not found', {
          error: profileError,
        });
        setError('Profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      // Get cohort details
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('name, description, start_date, end_date')
        .eq('id', cohortId)
        .single();

      if (cohortError) {
        Logger.getInstance().error('Cohort not found', { error: cohortError });
        setError('Cohort not found. Please contact support.');
        setLoading(false);
        return;
      }

      setVerificationData({
        applicationId: application.id,
        profileId: application.profile_id,
        cohortId: application.cohort_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        cohortName: cohort.name,
        cohortDescription: cohort.description,
        cohortStartDate: cohort.start_date,
        cohortEndDate: cohort.end_date,
        isValid: true,
        isExpired: false,
      });
    } catch (error) {
      Logger.getInstance().error('Token verification error', { error });
      setError(
        'An error occurred while verifying your link. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationData) return;

    // Validate passwords
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!ValidationUtils.isValidSignupEmail(verificationData.email)) {
      toast.error(ValidationUtils.getEmailDomainError());
      return;
    }

    setProcessing(true);

    try {
      let authData;
      let authError;

      // Check if user is already signed in
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser && currentUser.email === verificationData.email) {
        // User is already signed in with the correct email
        authData = { user: currentUser };
        authError = null;
      } else {
        // First, try to sign in with the email and password
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: verificationData.email,
            password: password,
          });

        if (signInError) {
          // If sign in fails, try to create a new account
          if (
            signInError.message.includes('Invalid login credentials') ||
            signInError.message.includes('Email not confirmed')
          ) {
            const { data: signUpData, error: signUpError } =
              await supabase.auth.signUp({
                email: verificationData.email,
                password: password,
                options: {
                  data: {
                    first_name: verificationData.firstName,
                    last_name: verificationData.lastName,
                    role: 'student',
                  },
                  emailRedirectTo: `${window.location.origin}/auth/application-coming-soon`,
                },
              });

            authData = signUpData;
            authError = signUpError;
          } else {
            // Other sign in errors should be handled
            authData = signInData;
            authError = signInError;
          }
        } else {
          // Sign in successful
          authData = signInData;
          authError = null;
        }
      }

      if (authError) {
        console.error('Auth error:', authError);
        if (authError.message.includes('User already registered')) {
          toast.error(
            'This email is already registered. Please try signing in instead.'
          );
        } else {
          toast.error('Failed to create account. Please try again.');
        }
        return;
      }

      if (!authData.user) {
        toast.error('Failed to create account. Please try again.');
        return;
      }

      // Auto-confirm email using Edge Function
      if (!authData.user.email_confirmed_at) {
        try {
          const confirmResponse = await fetch(
            `https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/confirm-user-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
              },
              body: JSON.stringify({
                userId: authData.user.id,
              }),
            }
          );

          if (confirmResponse.ok) {
            Logger.getInstance().info('Email confirmed automatically');
          } else {
            console.warn('Failed to auto-confirm email');
          }
        } catch (error) {
          console.warn('Error confirming email:', error);
        }
      }

      // Check if there's already a profile with this user_id (created by database trigger)
      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

      if (existingProfileError && existingProfileError.code !== 'PGRST116') {
        Logger.getInstance().error('Failed to check for existing profile', {
          error: existingProfileError,
        });
        toast.error('Failed to complete registration. Please contact support.');
        return;
      }

      if (existingProfile) {
        // Delete the empty profile created by database trigger
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', existingProfile.id);

        if (deleteError) {
          Logger.getInstance().error('Failed to delete empty profile', {
            error: deleteError,
          });
        } else {
          Logger.getInstance().info(
            'Deleted empty profile created by trigger',
            {
              deletedProfileId: existingProfile.id,
            }
          );
        }
      }

      // Update the existing profile (created during registration) with the user_id
      // This preserves all the registration data (phone, qualification, date_of_birth)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ user_id: authData.user.id })
        .eq('id', verificationData.profileId);

      if (profileUpdateError) {
        Logger.getInstance().error('Failed to update profile with user_id', {
          error: profileUpdateError,
        });
        toast.error('Failed to complete registration. Please contact support.');
        return;
      }

      Logger.getInstance().info('Successfully updated profile with user_id', {
        profileId: verificationData.profileId,
        userId: authData.user.id,
      });

      // Update student_applications record status
      const { error: applicationError } = await supabase
        .from('student_applications')
        .update({
          status: 'registration_complete', // Password set up and logged in
          registration_completed: true,
        })
        .eq('profile_id', verificationData.profileId);

      if (applicationError) {
        Logger.getInstance().error('Failed to update application', {
          error: applicationError,
        });
      }

      toast.success(
        'Account created successfully! Welcome to ExperienceTrack!'
      );

      // Navigate to application process page
      setTimeout(() => {
        navigate('/auth/application-process', { replace: true });
      }, 1000);
    } catch (error) {
      Logger.getInstance().error('Password setup error', { error });
      toast.error(
        'An error occurred while setting up your account. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO {...PageSEO.verifyEmail} />
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <Card className='w-full max-w-lg mx-auto'>
            <CardContent className='pt-8 pb-8'>
              <div className='text-center'>
                <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground' />
                <p className='text-muted-foreground'>
                  Verifying your registration...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO {...PageSEO.verifyEmail} />
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <Card className='w-full max-w-lg mx-auto'>
            <CardHeader className='text-center'>
              <div className='flex justify-center mb-4'>
                <AlertCircle className='h-12 w-12 text-destructive' />
              </div>
              <CardTitle className='text-xl font-semibold text-foreground'>
                Verification Failed
              </CardTitle>
              <CardDescription className='text-muted-foreground'>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/auth/register')}
                className='w-full h-10'
                variant='outline'
              >
                Register Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!verificationData) {
    return null;
  }

  return (
    <>
      <SEO {...PageSEO.verifyEmail} />
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <Card className='w-full max-w-lg mx-auto'>
          <CardHeader className='text-center'>
            <div className='flex justify-center mb-6'>
              <Logo size='lg' showText={false} />
            </div>
            <CardTitle className='text-2xl font-semibold text-foreground mb-2'>
              Complete Your Registration
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              Welcome {verificationData.firstName}! Please set up your password
              to complete your registration.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Registration Information */}
            <div className='bg-muted/50 rounded-lg p-4 border'>
              <h3 className='font-medium text-foreground mb-3'>
                Registration Details
              </h3>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Name:</span>
                  <span className='text-foreground font-medium'>
                    {verificationData.firstName} {verificationData.lastName}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Email:</span>
                  <span className='text-foreground'>
                    {verificationData.email}
                  </span>
                </div>
                <div className='border-t pt-2 mt-2'>
                  <div className='flex justify-between mb-1'>
                    <span className='text-muted-foreground'>Cohort:</span>
                    <span className='text-foreground font-medium'>
                      {verificationData.cohortName}
                    </span>
                  </div>
                  {verificationData.cohortDescription && (
                    <div className='text-muted-foreground text-xs mt-1'>
                      {verificationData.cohortDescription}
                    </div>
                  )}
                  {(verificationData.cohortStartDate ||
                    verificationData.cohortEndDate) && (
                    <div className='flex justify-between text-xs text-muted-foreground mt-2'>
                      {verificationData.cohortStartDate && (
                        <span>
                          Start:{' '}
                          {new Date(
                            verificationData.cohortStartDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {verificationData.cohortEndDate && (
                        <span>
                          End:{' '}
                          {new Date(
                            verificationData.cohortEndDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Setup Form */}
            <form onSubmit={handlePasswordSetup} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-sm font-medium'>
                  Password
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  required
                  className='h-10'
                />
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='confirmPassword'
                  className='text-sm font-medium'
                >
                  Confirm Password
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder='Confirm your password'
                  required
                  className='h-10'
                />
              </div>

              <Button
                type='submit'
                className='w-full h-10'
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SelfRegistrationVerification;
