import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Deleting user: ${userId}`);

    // First, check if user exists and get their details
    const { data: user, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError) {
      throw new Error(`Failed to get user: ${userError.message}`);
    }

    if (!user.user) {
      throw new Error('User not found');
    }

    // Delete the user from auth.users (this will cascade to profiles due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted user: ${user.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User deleted successfully',
        deletedUser: {
          id: userId,
          email: user.user.email,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);

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
