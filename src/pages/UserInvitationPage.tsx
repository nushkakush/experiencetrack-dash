import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  userInvitationService,
  UserInvitation,
} from '@/services/userInvitation.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ValidationUtils } from '@/utils/validation';

export default function UserInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitation, setInvitation] = useState<UserInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingUser, setExistingUser] = useState(false);

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const result = await userInvitationService.getInvitationByToken(token!);

        if (!result.success || !result.data) {
          setError(result.error || 'Invitation not found');
          setLoading(false);
          return;
        }

        const invitationData = result.data;

        // Check if invitation has expired
        if (new Date(invitationData.invitation_expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        // Check if invitation is already accepted
        if (invitationData.invite_status === 'accepted') {
          setError('This invitation has already been accepted');
          setLoading(false);
          return;
        }

        setInvitation(invitationData);

        // Check if user already exists
        const { data: existingUserData } =
          await supabase.auth.admin.listUsers();
        const userExists = existingUserData.users.some(
          user => user.email === invitationData.email
        );
        setExistingUser(userExists);
      } catch (err) {
        setError('Failed to load invitation');
        console.error('Error loading invitation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !token) return;

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setProcessing(true);
    try {
      let userId: string;

      if (existingUser) {
        // Existing user - just sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: password,
        });

        if (error) {
          toast.error('Invalid password');
          return;
        }

        userId = data.user.id;
      } else {
        // New user - create account
        // Validate email domain before creating account
        if (!ValidationUtils.isValidSignupEmail(invitation.email)) {
          toast.error(ValidationUtils.getEmailDomainError());
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: invitation.email,
          password: password,
          options: {
            data: {
              first_name: invitation.first_name,
              last_name: invitation.last_name,
              role: invitation.role,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        userId = data.user!.id;

        // Ensure profile is created (backup in case trigger fails)
        try {
          const { error: profileError } = await supabase.rpc(
            'ensure_user_profile',
            {
              user_id: userId,
            }
          );
          if (profileError) {
            console.warn('Profile creation backup failed:', profileError);
          }
        } catch (profileErr) {
          console.warn('Profile creation backup failed:', profileErr);
        }
      }

      // Mark invitation as accepted
      await userInvitationService.markInvitationAccepted(invitation.id);

      // Clean up the invitation since user has accepted it
      try {
        const { error: cleanupError } = await supabase.rpc(
          'cleanup_accepted_invitation',
          {
            invitation_id: invitation.id,
          }
        );
        if (cleanupError) {
          console.warn('Invitation cleanup failed:', cleanupError);
        } else {
          console.log('Successfully cleaned up accepted invitation');
        }
      } catch (cleanupErr) {
        console.warn('Invitation cleanup failed:', cleanupErr);
      }

      toast.success('Account created successfully! Welcome to LIT OS.');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative'>
        {/* Theme Toggle in top-right corner */}
        <div className='absolute top-4 right-4'>
          <ThemeToggle />
        </div>

        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin' />
              <span className='ml-2'>Loading invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background relative'>
        {/* Theme Toggle in top-right corner */}
        <div className='absolute top-4 right-4'>
          <ThemeToggle />
        </div>

        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-center text-red-600'>
              <XCircle className='h-8 w-8 mr-2' />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const roleDisplayName = invitation.role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className='min-h-screen flex items-center justify-center bg-background relative'>
      {/* Theme Toggle in top-right corner */}
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>

      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>Welcome to LIT OS!</CardTitle>
          <CardDescription>
            You've been invited to join as a {roleDisplayName}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center'>
            <div className="flex justify-center mb-3">
              <UserAvatar
                avatarUrl={null}
                name={`${invitation.first_name || ''} ${invitation.last_name || ''}`.trim() || invitation.email}
                size="lg"
              />
            </div>
            <p className='text-sm text-muted-foreground'>
              Setting up account for: <strong>{invitation.email}</strong>
            </p>
            {invitation.first_name && invitation.last_name && (
              <p className='text-sm text-muted-foreground'>
                {invitation.first_name} {invitation.last_name}
              </p>
            )}
          </div>

          {existingUser && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                An account with this email already exists. Please sign in with
                your password.
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter your password'
              disabled={processing}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm Password</Label>
            <Input
              id='confirmPassword'
              type='password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder='Confirm your password'
              disabled={processing}
            />
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={processing || !password || !confirmPassword}
            className='w-full'
          >
            {processing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Setting up account...
              </>
            ) : (
              'Accept Invitation & Create Account'
            )}
          </Button>

          <p className='text-xs text-muted-foreground text-center'>
            By accepting this invitation, you agree to our terms of service and
            privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
