import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { ValidationUtils } from '@/utils/validation';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { CohortStudent } from '@/types/cohort';

interface UseInvitationAcceptanceProps {
  token: string;
  student: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    cohort_id: string;
    invited_by?: string | null;
  } | null;
  cohortName: string;
  isExistingUser: boolean;
}

export const useInvitationAcceptance = ({
  token,
  student,
  cohortName,
  isExistingUser,
}: UseInvitationAcceptanceProps) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingUserMode, setExistingUserMode] =
    useState<boolean>(isExistingUser);
  const [canJoinWithoutPassword, setCanJoinWithoutPassword] =
    useState<boolean>(false);

  // If already signed in with the same email, we can skip password entry entirely
  useEffect(() => {
    let cancelled = false;
    const checkExistingSession = async () => {
      try {
        if (!student) return;
        const { data: existingSession } = await supabase.auth.getSession();
        const sessionUser = existingSession?.session?.user;
        if (
          sessionUser?.email &&
          sessionUser.email.toLowerCase() === student.email.toLowerCase()
        ) {
          if (!cancelled) setCanJoinWithoutPassword(true);
        } else {
          if (!cancelled) setCanJoinWithoutPassword(false);
        }
      } catch {
        if (!cancelled) setCanJoinWithoutPassword(false);
      }
    };
    checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [student]);

  const handleAcceptInvitation = async () => {
    if (!student || !token) return;

    const effectiveExistingUser = existingUserMode || isExistingUser;

    setProcessing(true);
    try {
      let userId: string | undefined;

      // If already signed in with the same email, skip auth and just accept
      try {
        const { data: existingSession } = await supabase.auth.getSession();
        const sessionUser = existingSession?.session?.user;
        if (
          sessionUser?.email &&
          sessionUser.email.toLowerCase() === student.email.toLowerCase()
        ) {
          userId = sessionUser.id;
        }
      } catch {
        // Ignore session errors
      }

      // If no active matching session, proceed with auth flow
      if (!userId) {
        // Validate password only when we actually need to authenticate
        if (!effectiveExistingUser && password !== confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        if (!effectiveExistingUser && password.length < 6) {
          toast.error('Password must be at least 6 characters long');
          return;
        }

        if (effectiveExistingUser) {
          // Existing user - just sign in
          const { data, error } = await supabase.auth.signInWithPassword({
            email: student.email,
            password: password,
          });

          if (error) {
            toast.error('Invalid password');
            return;
          }

          userId = data.user.id;
        } else {
          // New user - create account
          // Validate email format before creating account
          if (!ValidationUtils.isValidSignupEmail(student.email)) {
            toast.error(ValidationUtils.getEmailDomainError());
            return;
          }

          const { data, error } = await supabase.auth.signUp({
            email: student.email,
            password: password,
            options: {
              data: {
                first_name: student.first_name,
                last_name: student.last_name,
                role: 'student',
              },
              emailRedirectTo: `${window.location.origin}/dashboard`,
            },
          });

          // Since they came from an invitation link, we can trust their email
          // Let's confirm their email automatically using our Edge Function
          if (data.user && !data.user.email_confirmed_at) {
            Logger.getInstance().info('Attempting to confirm email for user', {
              userId: data.user.id,
            });
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
                    userId: data.user.id,
                  }),
                }
              );

              if (confirmResponse.ok) {
                Logger.getInstance().info('Email confirmed automatically');
              } else {
                const errorText = await confirmResponse.text();
                console.warn('Failed to auto-confirm email:', errorText);
              }
            } catch (error) {
              console.warn('Error confirming email:', error);
            }
          }

          if (error) {
            // If the user already exists, switch to existing-user mode gracefully
            const message = (error as any)?.message?.toLowerCase?.() || '';
            const status = (error as any)?.status;
            if (
              status === 422 ||
              message.includes('already registered') ||
              message.includes('already exists')
            ) {
              setExistingUserMode(true);
              setConfirmPassword('');
              toast.info(
                'This email already has an account. Please enter your existing password to join the cohort.'
              );
              return;
            }

            console.error('Signup error:', error);
            toast.error((error as any)?.message || 'Failed to create account');
            return;
          }

          Logger.getInstance().info('User created successfully', {
            userId: data.user.id,
          });
          userId = data.user!.id;
        }
      }

      // Ensure user is properly authenticated before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error('No active session found after authentication');
        toast.error('Authentication failed. Please try again.');
        return;
      }

      // Accept the invitation using Supabase client (authenticated)
      try {
        Logger.getInstance().info('Attempting to accept invitation', {
          token,
          userId,
        });

        // Use the cohortStudentsService for better error handling
        const acceptResult = await cohortStudentsService.acceptInvitation(
          token,
          userId
        );

        if (!acceptResult.success) {
          console.error('Failed to accept invitation:', acceptResult.error);
          toast.error('Failed to join cohort. Please try again.');
          return;
        }

        Logger.getInstance().info('Successfully accepted invitation', {
          result: acceptResult.data,
        });

        // Update the profiles record with the user_id
        try {
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ user_id: userId })
            .eq('email', student.email);

          if (profileUpdateError) {
            Logger.getInstance().error(
              'Failed to update profile with user_id',
              { error: profileUpdateError }
            );
          } else {
            Logger.getInstance().info(
              'Profile updated with user_id successfully'
            );
          }
        } catch (error) {
          Logger.getInstance().error('Error updating profile with user_id', {
            error,
          });
        }

        // Create a student_applications record for tracking
        try {
          const { error: applicationError } = await supabase
            .from('student_applications')
            .insert({
              cohort_id: student.cohort_id,
              student_id: acceptResult.data?.id, // cohort_students.id
              application_data: {
                registration_completed: true,
                registration_date: new Date().toISOString(),
                source: 'self_registration',
              },
              status: 'submitted',
              submitted_at: new Date().toISOString(),
            });

          if (applicationError) {
            Logger.getInstance().error(
              'Failed to create student application record',
              { error: applicationError }
            );
            // Don't fail the flow if application record creation fails
          } else {
            Logger.getInstance().info(
              'Student application record created successfully'
            );
          }
        } catch (error) {
          Logger.getInstance().error(
            'Error creating student application record',
            { error }
          );
          // Don't fail the flow if application record creation fails
        }

        toast.success(
          `Welcome to ExperienceTrack! You have successfully joined ${cohortName || 'the cohort'}.`
        );

        // Add a small delay to ensure the database update is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          // Check if student was invited by admin (has invited_by field) or self-registered
          // Admin-registered students should go to dashboard, self-registered go to coming soon
          const isAdminRegistered =
            student.invited_by && student.invited_by !== '';

          if (isAdminRegistered) {
            // Admin-registered student - redirect to dashboard
            window.location.assign('/dashboard');
          } else {
            // Self-registered student - redirect to application process page
            window.location.assign('/auth/application-process');
          }
        } catch {
          // Fallback navigation
          const isAdminRegistered =
            student.invited_by && student.invited_by !== '';
          if (isAdminRegistered) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/auth/application-process', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error accepting invitation:', error);
        toast.error('Failed to join cohort. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('An error occurred while accepting the invitation');
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    handleAcceptInvitation,
    isExistingUser: existingUserMode || isExistingUser,
    canJoinWithoutPassword,
    toggleExistingUserMode: () => setExistingUserMode(prev => !prev),
  };
};
