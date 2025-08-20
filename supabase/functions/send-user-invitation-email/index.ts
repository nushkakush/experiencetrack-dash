import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invitationId, email, firstName, lastName, role } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('invitation_token, invitation_expires_at')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      throw new Error('User invitation not found');
    }

    if (new Date(invitation.invitation_expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }

    const baseUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/user-invite/${invitation.invitation_token}`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation prepared successfully',
        invitationUrl,
        emailSent: false,
        note: 'Email sending not configured yet',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing user invitation:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
