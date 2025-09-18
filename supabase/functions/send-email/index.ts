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
    | 'verification'
    | 'custom'
    | 'payment_reminder'
    | 'notification'
    | 'payment_submitted'
    | 'payment_approved'
    | 'payment_partially_approved'
    | 'payment_rejected'
    | 'partial_payment_submitted'
    | 'all_payments_completed'
    | 'receipt_generated'
    | 'payment_submission_failed';
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

  // Verification email fields
  verificationToken?: string;
  cohortId?: string;
  origin?: string;
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

    // Helper function to determine if email is payment-related
    const isPaymentEmail = (emailType: string, context?: any): boolean => {
      const paymentTypes = [
        'payment_submitted',
        'payment_approved',
        'payment_rejected',
        'payment_partially_approved',
        'partial_payment_submitted',
        'all_payments_completed',
        'payment_submission_failed',
        'payment_reminder',
        'automated_payment_reminder',
      ];

      // Check if it's a custom email with payment context
      if (emailType === 'custom' && context?.paymentData) {
        return true;
      }

      return paymentTypes.includes(emailType);
    };

    // Helper function to get email sender configuration
    const getEmailSender = (emailType: string, context?: any) => {
      if (isPaymentEmail(emailType, context)) {
        return {
          email: Deno.env.get('PAYMENT_FROM_EMAIL') || 'payments@litschool.in',
          name: 'LIT School Payments',
        };
      }
      return {
        email: Deno.env.get('FROM_EMAIL') || 'noreply@litschool.in',
        name: 'LIT OS',
      };
    };

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
      if (invitationType === 'user') {
        // User invitation - fetch from user_invitations table
        const { data: invitation, error: invitationError } = await supabase
          .from('user_invitations')
          .select('invitation_expires_at, invitation_token')
          .eq('id', studentId)
          .single();

        if (invitationError || !invitation) {
          throw new Error('Invitation not found');
        }

        invitationExpiresAt = invitation.invitation_expires_at;
        invitationToken = invitation.invitation_token;

        // Check if invitation has expired
        if (new Date(invitationExpiresAt) < new Date()) {
          throw new Error('Invitation has expired');
        }

        // Generate user invitation URL using the invitation token
        const baseUrl =
          req.headers.get('origin') ||
          req.headers.get('referer')?.replace(/\/.*$/, '') ||
          Deno.env.get('FRONTEND_URL') ||
          'http://localhost:3000';
        const origin = baseUrl.startsWith('http')
          ? baseUrl
          : `https://${baseUrl}`;
        invitationUrl = `${origin}/user-invite/${invitationToken}`;

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
            <p>Click this link to set up your account:</p>
            <p><a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Set Up Account</a></p>
            <p>This invitation link will expire in 7 days. If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>LIT OS Team</p>
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
            <p>Click this link to set up your account and join the cohort:</p>
            <p><a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Join Cohort</a></p>
            <p>This invitation link will expire in 7 days. If you have any questions, please contact your program coordinator.</p>
            <p>Best regards,<br>LIT OS Team</p>
          </div>
        `;
      }

      // Check if invitation has expired
      if (new Date(invitationExpiresAt) < new Date()) {
        throw new Error('Invitation has expired');
      }
    } else if (requestData.type === 'verification') {
      // Handle verification emails for self-registration
      const { firstName, lastName, verificationToken, cohortId } = requestData;

      email = requestData.recipient?.email || requestData.email;
      recipientName = requestData.recipient?.name || `${firstName} ${lastName}`;

      if (
        !email ||
        !firstName ||
        !lastName ||
        !verificationToken ||
        !cohortId
      ) {
        throw new Error('Missing required verification fields');
      }

      // Get cohort name
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('name')
        .eq('id', cohortId)
        .single();

      if (cohortError || !cohort) {
        throw new Error('Cohort not found');
      }

      const cohortName = cohort.name;

      // Generate verification URL
      const baseUrl =
        requestData.origin ||
        req.headers.get('origin') ||
        req.headers.get('referer')?.replace(/\/.*$/, '') ||
        Deno.env.get('FRONTEND_URL') ||
        'http://localhost:3000';

      invitationUrl = `${baseUrl}/auth/self-registration-verification?token=${verificationToken}&cohort=${cohortId}`;

      // Set email content for verification
      emailSubject = `Complete Your Registration - ${cohortName}`;
      emailContent = `Dear ${firstName} ${lastName},

Welcome to LIT School! You've successfully registered for ${cohortName}.

To complete your registration and set up your account, please click the link below:

${invitationUrl}

This verification link will expire in 7 days. If you have any questions, please contact our support team.

Best regards,
LIT OS Team`;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Complete Your Registration - ${cohortName}</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Welcome to LIT School! You've successfully registered for <strong>${cohortName}</strong>.</p>
          <p>To complete your registration and set up your account, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          <p>This verification link will expire in 7 days. If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>LIT OS Team</p>
        </div>
      `;
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
            Sent from LIT School
          </p>
        </div>
      `;
    }

    // SendGrid configuration - try multiple possible environment variable names
    const sendgridApiKey =
      Deno.env.get('SENDGRID_API_KEY') ||
      Deno.env.get('SENDGRID_KEY') ||
      Deno.env.get('SENDGRID_TOKEN');
    const emailSender = getEmailSender(requestData.type, requestData.context);

    console.log('SendGrid API Key check:', {
      hasKey: !!sendgridApiKey,
      keyLength: sendgridApiKey?.length || 0,
      keyPrefix: sendgridApiKey?.substring(0, 10) || 'not found',
    });

    if (!sendgridApiKey) {
      console.error(
        'SendGrid API key not configured. Checked: SENDGRID_API_KEY, SENDGRID_KEY, SENDGRID_TOKEN'
      );

      // Log the failed email attempt
      try {
        await supabase.from('email_logs').insert({
          type: requestData.type,
          template: requestData.template,
          subject: emailSubject,
          content: emailContent,
          recipient_email: email,
          recipient_name: recipientName,
          context: requestData.context,
          status: 'failed',
          error_message: 'SendGrid API key not found in environment variables',
          ai_enhanced: requestData.enhanceWithAI || false,
        });
      } catch (logError) {
        console.error('Failed to log email failure:', logError);
      }

      // Always throw an error for missing SendGrid configuration to ensure we know when emails aren't being sent
      throw new Error(
        'SendGrid API key not configured. Please add SENDGRID_API_KEY to environment variables.'
      );
    }

    // Debug logging
    console.log('Email variables:', {
      email,
      recipientName,
      emailSubject,
      sender: emailSender,
    });

    // Prepare email content
    const emailData = {
      personalizations: [
        {
          to: [{ email: email, name: recipientName }],
          subject: emailSubject,
        },
      ],
      from: { email: emailSender.email, name: emailSender.name },
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
      console.error('SendGrid error details:', {
        status: sendgridResponse.status,
        statusText: sendgridResponse.statusText,
        error: errorText,
        recipient: email,
        subject: emailSubject,
      });
      console.error(
        'Email data sent to SendGrid:',
        JSON.stringify(emailData, null, 2)
      );

      // Log the failed email attempt
      try {
        await supabase.from('email_logs').insert({
          type: requestData.type,
          template: requestData.template,
          subject: emailSubject,
          content: emailContent,
          recipient_email: email,
          recipient_name: recipientName,
          context: requestData.context,
          status: 'failed',
          error_message: `SendGrid error: ${sendgridResponse.status} - ${errorText}`,
          ai_enhanced: requestData.enhanceWithAI || false,
        });
      } catch (logError) {
        console.error('Failed to log email failure:', logError);
      }

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
