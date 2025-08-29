import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  type:
    | 'invitation'
    | 'user_invitation'
    | 'custom'
    | 'payment_reminder'
    | 'notification';
  template?: string;
  subject?: string;
  content?: string;
  recipient?: {
    email: string;
    name: string;
  };
  context?: Record<string, any>;
  enhanceWithAI?: boolean;

  // Legacy invitation fields for backward compatibility
  studentId?: string;
  firstName?: string;
  lastName?: string;
  cohortName?: string;
  invitationType?: string;
  email?: string; // Legacy email field
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: EmailRequest = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let emailSubject: string;
    let emailContent: string;
    let htmlContent: string;
    let invitationUrl: string | undefined;
    let email: string;
    let recipientName: string;

    // Handle different email types
    if (
      requestData.type === 'invitation' ||
      requestData.type === 'user_invitation'
    ) {
      // Handle invitation emails (existing functionality)
      const { studentId, firstName, lastName, cohortName, invitationType } =
        requestData;

      // Extract email from recipient object or legacy field
      email = requestData.recipient?.email || requestData.email;
      recipientName = requestData.recipient?.name || `${firstName} ${lastName}`;

      if (!email) {
        throw new Error('Email is required');
      }

      if (!studentId || !email || !firstName || !lastName) {
        throw new Error('Missing required invitation fields');
      }

      let invitationToken: string;
      let invitationExpiresAt: string;

      // Determine invitation type and fetch appropriate data
      if (invitationType === 'user' || cohortName?.includes('Team')) {
        // User invitation - fetch from user_invitations table
        const { data: userInvitation, error: userInvitationError } =
          await supabase
            .from('user_invitations')
            .select('invitation_token, invitation_expires_at')
            .eq('id', studentId)
            .single();

        if (userInvitationError || !userInvitation) {
          throw new Error('User invitation not found');
        }

        invitationToken = userInvitation.invitation_token;
        invitationExpiresAt = userInvitation.invitation_expires_at;

        // Generate user invitation URL - dynamically detect domain from request
        const origin =
          req.headers.get('origin') ||
          req.headers.get('referer')?.replace(/\/.*$/, '') ||
          Deno.env.get('FRONTEND_URL') ||
          'http://localhost:3000';
        const baseUrl = origin.startsWith('http')
          ? origin
          : `https://${origin}`;
        invitationUrl = `${baseUrl}/user-invite/${invitationToken}`;

        // User invitation email content
        const roleDisplayName =
          cohortName?.replace('LIT OS ', '').replace(' Team', '') ||
          'Team Member';
        emailSubject = `You've been invited to join LIT OS as ${roleDisplayName}!`;
        emailContent = `Hello ${firstName} ${lastName},\n\nYou have been invited to join LIT OS as a ${roleDisplayName}.\n\nClick this link to set up your account:\n${invitationUrl}\n\nThis invitation link will expire in 7 days. If you have any questions, please contact your administrator.\n\nBest regards,\nLIT OS Team`;

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to LIT OS!</h2>
            <p>Hello ${firstName} ${lastName},</p>
            <p>You have been invited to join LIT OS as a <strong>${roleDisplayName}</strong>.</p>
            <p>Click the button below to set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation link will expire in 7 days. If you have any questions, please contact your administrator.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              If you're having trouble with the button above, copy and paste this link into your browser:<br>
              <a href="${invitationUrl}">${invitationUrl}</a>
            </p>
          </div>
        `;
      } else {
        // Student invitation - fetch from cohort_students table (original logic)
        const { data: student, error: studentError } = await supabase
          .from('cohort_students')
          .select('invitation_token, invitation_expires_at')
          .eq('id', studentId)
          .single();

        if (studentError || !student) {
          throw new Error('Student not found');
        }

        invitationToken = student.invitation_token;
        invitationExpiresAt = student.invitation_expires_at;

        // Generate student invitation URL - dynamically detect domain from request
        const origin =
          req.headers.get('origin') ||
          req.headers.get('referer')?.replace(/\/.*$/, '') ||
          Deno.env.get('FRONTEND_URL') ||
          'http://localhost:3000';
        const baseUrl = origin.startsWith('http')
          ? origin
          : `https://${origin}`;
        invitationUrl = `${baseUrl}/invite/${invitationToken}`;

        // Student invitation email content (original content)
        emailSubject = `You've been invited to join ${cohortName}!`;
        emailContent = `Hello ${firstName} ${lastName},\n\nYou have been invited to join the ${cohortName} cohort on LIT OS.\n\nClick this link to set up your account and join the cohort:\n${invitationUrl}\n\nThis invitation link will expire in 7 days. If you have any questions, please contact your program coordinator.\n\nBest regards,\nLIT OS Team`;

        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to LIT OS!</h2>
            <p>Hello ${firstName} ${lastName},</p>
            <p>You have been invited to join the <strong>${cohortName}</strong> cohort on LIT OS.</p>
            <p>Click the button below to set up your account and join the cohort:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This invitation link will expire in 7 days. If you have any questions, please contact your program coordinator.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              If you're having trouble with the button above, copy and paste this link into your browser:<br>
              <a href="${invitationUrl}">${invitationUrl}</a>
            </p>
          </div>
        `;
      }

      // Check if invitation has expired
      if (new Date(invitationExpiresAt) < new Date()) {
        throw new Error('Invitation has expired');
      }
    } else {
      // Handle custom emails (new functionality)
      if (
        !requestData.subject ||
        !requestData.content ||
        !requestData.recipient
      ) {
        throw new Error(
          'Subject, content, and recipient are required for custom emails'
        );
      }

      email = requestData.recipient.email;
      recipientName = requestData.recipient.name;
      emailSubject = requestData.subject;
      emailContent = requestData.content;

      // Convert plain text to basic HTML if no HTML provided
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="white-space: pre-wrap;">${requestData.content.replace(/\n/g, '<br>')}</div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            Sent from LIT OS
          </p>
        </div>
      `;
    }

    // SendGrid configuration
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@litos.com';

    if (!sendgridApiKey) {
      // If SendGrid is not configured, just return the invitation URL for invitations
      if (
        requestData.type === 'invitation' ||
        requestData.type === 'user_invitation'
      ) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Invitation prepared successfully',
            invitationUrl,
            emailSent: false,
            note: 'SendGrid not configured - email not sent',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        throw new Error('SendGrid not configured - cannot send custom emails');
      }
    }

    // Debug logging
    console.log('Email variables:', { email, recipientName, emailSubject });

    // Prepare email content
    const emailData = {
      personalizations: [
        {
          to: [{ email: email, name: recipientName }],
          subject: emailSubject,
        },
      ],
      from: { email: fromEmail, name: 'LIT OS' },
      content: [
        {
          type: 'text/plain',
          value: emailContent,
        },
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
      tracking_settings: {
        click_tracking: {
          enable: false,
          enable_text: false,
        },
        open_tracking: {
          enable: false,
        },
      },
    };

    // Send email via SendGrid
    const sendgridResponse = await fetch(
      'https://api.sendgrid.com/v3/mail/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      }
    );

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error('SendGrid error:', errorText);
      console.error('SendGrid status:', sendgridResponse.status);
      console.error('Email data:', JSON.stringify(emailData, null, 2));
      throw new Error(
        `Failed to send email: ${sendgridResponse.status} - ${errorText}`
      );
    }

    // Log email for tracking
    try {
      await supabase.from('email_logs').insert({
        type: requestData.type,
        template: requestData.template,
        subject: emailSubject,
        content: emailContent,
        recipient_email: email,
        recipient_name: recipientName,
        context: requestData.context,
        status: 'sent',
        ai_enhanced: requestData.enhanceWithAI || false,
      });
    } catch (logError) {
      console.error('Failed to log email:', logError);
      // Don't fail the email send if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        invitationUrl,
        emailSent: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
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
