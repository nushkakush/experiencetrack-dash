import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/**
 * Validates email domain for signup
 * Allows any valid email domain
 */
function isValidSignupEmail(email: string): boolean {
  const trimmedEmail = email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail);
}

/**
 * Checks if email is from litschool.in domain
 */
function isLitschoolEmail(email: string): boolean {
  const trimmedEmail = email.trim().toLowerCase();
  return trimmedEmail.endsWith('@litschool.in');
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
          isValid: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const isValid = isValidSignupEmail(email);
    const isLitschool = isLitschoolEmail(email);

    return new Response(
      JSON.stringify({
        success: true,
        isValid,
        isLitschool,
        message: isValid
          ? 'Email is valid'
          : 'Please enter a valid email address',
        accessLevel: isLitschool ? 'full' : 'limited',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: (err as Error).message,
        isValid: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
