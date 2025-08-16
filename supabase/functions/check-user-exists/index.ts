import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prefer the direct admin API to check user existence reliably
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error) {
      const message = (error as any)?.message?.toLowerCase?.() || "";
      const code = (error as any)?.status || (error as any)?.code;

      // If user is not found, treat as non-existent
      if (
        message.includes("user not found") ||
        message.includes("no user found") ||
        code === 404 ||
        code === "user_not_found"
      ) {
        return new Response(
          JSON.stringify({ success: true, exists: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Other errors
      return new Response(
        JSON.stringify({ success: false, error: (error as any)?.message || "Unknown error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // If we got a user back, the user exists
    return new Response(
      JSON.stringify({ success: true, exists: !!data?.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});


