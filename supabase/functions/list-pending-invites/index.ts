import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending invites for the email (not expired)
    const { data: invites, error: invitesError } = await supabase
      .from('cohort_students')
      .select(
        'id, cohort_id, invitation_token, invited_at, invitation_expires_at'
      )
      .eq('email', email)
      .eq('invite_status', 'sent')
      .order('invited_at', { ascending: false });

    if (invitesError) {
      return new Response(
        JSON.stringify({ success: false, error: invitesError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const now = new Date();
    const validInvites = (invites ?? []).filter(
      (inv: { invitation_expires_at?: string | null }) => {
        if (!inv.invitation_expires_at) return true;
        return new Date(inv.invitation_expires_at) > now;
      }
    );

    // Fetch cohort names for the unique cohort_ids
    const cohortIds = Array.from(
      new Set(validInvites.map((i: { cohort_id: string }) => i.cohort_id))
    );
    const idToName = new Map<string, string>();
    if (cohortIds.length > 0) {
      const { data: cohorts, error: cohortsError } = await supabase
        .from('cohorts')
        .select('id, name')
        .in('id', cohortIds);
      if (!cohortsError && Array.isArray(cohorts)) {
        cohorts.forEach((c: { id: string; name: string }) =>
          idToName.set(c.id, c.name)
        );
      }
    }

    const result = validInvites.map(
      (inv: {
        id: string;
        cohort_id: string;
        invitation_token: string;
        invited_at: string;
        invitation_expires_at: string | null;
      }) => ({
        id: inv.id,
        cohort_id: inv.cohort_id,
        cohort_name: idToName.get(inv.cohort_id) ?? null,
        invitation_token: inv.invitation_token,
        invited_at: inv.invited_at,
        invitation_expires_at: inv.invitation_expires_at,
      })
    );

    return new Response(JSON.stringify({ success: true, invites: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
