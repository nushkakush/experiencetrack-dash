import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export interface PendingInviteItem {
  id: string;
  cohort_id: string;
  cohort_name?: string | null;
  invitation_token: string;
  invited_at?: string;
  invitation_expires_at?: string;
}

interface PendingInvitesPanelProps {
  invites: PendingInviteItem[];
  loading: boolean;
  onAccept: (inviteId: string) => Promise<void> | void;
  onSignOut: () => Promise<void> | void;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

const getExpiryBadge = (expiresAt?: string) => {
  if (!expiresAt) return <Badge variant="secondary">No expiry</Badge>;
  const now = new Date();
  const exp = new Date(expiresAt);
  const ms = exp.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (ms <= 0) return <Badge variant="destructive">Expired</Badge>;
  if (days <= 3) return <Badge variant="destructive">Expires in {days} day{days === 1 ? '' : 's'}</Badge>;
  if (days <= 7) return <Badge variant="default">Expires in {days} days</Badge>;
  return <Badge variant="secondary">Expires {formatDate(expiresAt)}</Badge>;
};

export const PendingInvitesPanel: React.FC<PendingInvitesPanelProps> = ({ invites, loading, onAccept, onSignOut }) => {
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>You're invited to join a cohort</CardTitle>
          <CardDescription>
            Choose an invitation below to join immediately. You’re signed in, so no need to open your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-medium truncate max-w-[16rem]">{inv.cohort_name ?? 'Cohort'}</span>
                  {getExpiryBadge(inv.invitation_expires_at)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Invited: {formatDate(inv.invited_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onAccept(inv.id)} disabled={loading}>Join</Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onSignOut}>Use a different account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingInvitesPanel;


