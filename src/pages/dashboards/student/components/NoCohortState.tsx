import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  StudentApplicationsService,
  StudentApplicationWithCohort,
} from '@/services/studentApplications.service';
import PendingInvitesPanel from './PendingInvitesPanel';

interface PendingInvite {
  id: string;
  cohort_id: string;
  cohort_name?: string;
  invitation_token: string;
  invited_at?: string;
  invitation_expires_at?: string;
  invited_by?: string | null;
}

export const NoCohortState: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [registeredApplications, setRegisteredApplications] = useState<
    StudentApplicationWithCohort[]
  >([]);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>(
    []
  );
  const [selectedInviteId, setSelectedInviteId] = React.useState<string | null>(
    null
  );

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate('/auth');
    }
  };

  // Fetch registered applications
  useEffect(() => {
    const fetchRegisteredApplications = async () => {
      if (!profile?.id) return;

      setApplicationsLoading(true);
      try {
        const result =
          await StudentApplicationsService.getRegisteredApplications(
            profile.id
          );
        if (result.success && result.data) {
          setRegisteredApplications(result.data);
        }
      } catch (error) {
        console.error('Error fetching registered applications:', error);
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchRegisteredApplications();
  }, [profile?.id]);

  // Fetch any pending invitation for the current user's email
  React.useEffect(() => {
    let cancelled = false;
    const fetchPending = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email;
        if (!email) return;

        // Use edge function to list all valid pending invites with cohort names
        // Use client-side RLS query only to avoid CORS issues
        const { data, error } = await supabase
          .from('cohort_students')
          .select(
            'id, cohort_id, invitation_token, invited_at, invitation_expires_at, invited_by, cohorts(name)'
          )
          .eq('email', email)
          .eq('invite_status', 'sent')
          .order('invited_at', { ascending: false });
        if (!error && data && !cancelled) {
          const mapped = (data as any[]).map(r => ({
            id: r.id,
            cohort_id: r.cohort_id,
            cohort_name: r.cohorts?.name ?? null,
            invitation_token: r.invitation_token,
            invited_at: r.invited_at,
            invitation_expires_at: r.invitation_expires_at,
            invited_by: r.invited_by,
          }));
          setPendingInvites(mapped as any);
          setSelectedInviteId(mapped[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPending();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAcceptFromDashboard = async (inviteId?: string) => {
    const invite =
      pendingInvites.find(i => i.id === (inviteId || selectedInviteId)) ??
      pendingInvites[0];
    if (!invite) return;
    try {
      setLoading(true);
      // Accept invite directly using the server table update
      const { error } = await supabase
        .from('cohort_students')
        .update({
          invite_status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', invite.id);
      if (error) throw error;
      toast.success('Invitation accepted. Redirecting...');
      // Small delay to allow the DB to update, then hard reload to remount dashboard data hooks
      setTimeout(() => {
        try {
          window.location.assign('/dashboard');
        } catch {
          navigate('/dashboard', { replace: true });
        }
      }, 500);
    } catch (err) {
      toast.error(
        'Failed to accept invitation. Please try again from your email link.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingInvites.length > 0) {
    return (
      <div className='py-8'>
        <PendingInvitesPanel
          invites={pendingInvites}
          loading={loading}
          onAccept={id => handleAcceptFromDashboard(id)}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  // Show registered applications if any exist
  if (registeredApplications.length > 0) {
    return (
      <div className='space-y-6'>
        <div className='text-center py-4'>
          <h2 className='text-2xl font-bold mb-2'>Your Applications</h2>
          <p className='text-muted-foreground'>
            You're not enrolled in any cohort yet, but you have applications in
            progress.
          </p>
        </div>

        <div className='grid gap-4 max-w-4xl mx-auto'>
          {applicationsLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className='p-6'>
                    <div className='space-y-3'>
                      <Skeleton className='h-6 w-3/4' />
                      <Skeleton className='h-4 w-1/2' />
                      <Skeleton className='h-8 w-32' />
                    </div>
                  </CardContent>
                </Card>
              ))
            : registeredApplications.map(application => {
                const statusDisplay =
                  StudentApplicationsService.getStatusDisplay(
                    application.status
                  );
                const nextStep = StudentApplicationsService.getNextStep(
                  application.status
                );

                return (
                  <Card
                    key={application.id}
                    className='hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='text-lg font-semibold'>
                              {application.cohort.name}
                            </h3>
                            <Badge
                              variant={
                                statusDisplay.color === 'green'
                                  ? 'default'
                                  : statusDisplay.color === 'blue'
                                    ? 'secondary'
                                    : statusDisplay.color === 'orange'
                                      ? 'outline'
                                      : 'secondary'
                              }
                              className={
                                statusDisplay.color === 'green'
                                  ? 'bg-green-100 text-green-800'
                                  : statusDisplay.color === 'blue'
                                    ? 'bg-blue-100 text-blue-800'
                                    : statusDisplay.color === 'orange'
                                      ? 'bg-orange-100 text-orange-800'
                                      : ''
                              }
                            >
                              {statusDisplay.label}
                            </Badge>
                          </div>
                          <p className='text-muted-foreground mb-3'>
                            {application.cohort.description ||
                              'No description available'}
                          </p>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground mb-4'>
                            <Clock className='h-4 w-4' />
                            <span>Next: {nextStep.description}</span>
                          </div>
                          <div className='flex gap-3'>
                            <Button
                              onClick={() => navigate(nextStep.route)}
                              className='flex items-center gap-2'
                            >
                              <FileText className='h-4 w-4' />
                              {nextStep.action}
                              <ArrowRight className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <div className='flex justify-center pt-4'>
          <Button variant='outline' onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-center py-8'>
        <Card className='w-full max-w-xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              You're not enrolled in any cohort
            </CardTitle>
            <CardDescription>
              It looks like your account isn't linked to a cohort yet. Open your
              invitation email and click the link to join. If you don't have
              one, please contact your program coordinator.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-3 items-center'>
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
            <Button variant='outline' onClick={handleSignOut}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
