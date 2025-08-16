import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PendingInvitesPanel from './PendingInvitesPanel';

interface PendingInvite {
  id: string;
  cohort_id: string;
  cohort_name?: string;
  invitation_token: string;
  invited_at?: string;
  invitation_expires_at?: string;
}

export const NoCohortState: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([]);
  const [selectedInviteId, setSelectedInviteId] = React.useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate('/auth');
    }
  };

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
          .select('id, cohort_id, invitation_token, invited_at, invitation_expires_at, cohorts(name)')
          .eq('email', email)
          .eq('invite_status', 'sent')
          .order('invited_at', { ascending: false });
        if (!error && data && !cancelled) {
          const mapped = (data as any[]).map((r) => ({
            id: r.id,
            cohort_id: r.cohort_id,
            cohort_name: r.cohorts?.name ?? null,
            invitation_token: r.invitation_token,
            invited_at: r.invited_at,
            invitation_expires_at: r.invitation_expires_at,
          }));
          setPendingInvites(mapped as any);
          setSelectedInviteId(mapped[0]?.id ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPending();
    return () => { cancelled = true; };
  }, []);

  const handleAcceptFromDashboard = async (inviteId?: string) => {
    const invite = pendingInvites.find(i => i.id === (inviteId || selectedInviteId)) ?? pendingInvites[0];
    if (!invite) return;
    try {
      setLoading(true);
      // Accept invite directly using the server table update
      const { error } = await supabase
        .from('cohort_students')
        .update({ invite_status: 'accepted', accepted_at: new Date().toISOString(), user_id: (await supabase.auth.getUser()).data.user?.id })
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
      toast.error('Failed to accept invitation. Please try again from your email link.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingInvites.length > 0) {
    return (
      <div className="py-8">
        <PendingInvitesPanel
          invites={pendingInvites}
          loading={loading}
          onAccept={(id) => handleAcceptFromDashboard(id)}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center py-8">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              You're not registered to any cohort
            </CardTitle>
            <CardDescription>
              It looks like your account isn’t linked to a cohort yet. Open your invitation email and click the link to join. If you don’t have one, please contact your program coordinator.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center">
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


