# Student Invitation System

## Overview

This document describes the custom student invitation system implemented in ExperienceTrack, which replaces the previous magic link flow with a more robust invitation system using SendGrid for email delivery.

## System Architecture

### Database Schema

The `cohort_students` table has been extended with the following fields:

- `invitation_token` (UUID): Unique token for invitation links
- `invitation_expires_at` (timestamptz): Expiration timestamp (7 days from creation)
- `invited_by` (UUID): User ID of the person who sent the invitation
- `invite_status` (text): Status of the invitation ('not_sent', 'sent', 'accepted')
- `invited_at` (timestamptz): When the invitation was sent
- `accepted_at` (timestamptz): When the invitation was accepted

### Email Integration

The system uses SendGrid for sending invitation emails:

- **Sender Email**: `programs@litschool.in` (verified in SendGrid)
- **API Key**: Configured as a Supabase secret
- **Edge Function**: `send-invitation-email` handles email delivery
- **Email Content**: Both HTML and plain text versions with invitation link

## User Flow

### 1. Adding Individual Students

When adding a student through the `AddStudentDialog`:

1. User fills in student details
2. User can choose whether to send an invitation email (checkbox)
3. If invitation is selected:
   - System generates a unique invitation token
   - Sets expiration to 7 days from now
   - Records the invitation in the database
   - Sends email via SendGrid with invitation link
4. If no invitation is selected:
   - Student is added with `invite_status: 'not_sent'`

### 2. Bulk Upload

When uploading students via CSV:

1. CSV can include an optional `invite` column with values 'YES' or 'NO'
2. If `invite` is 'YES' or blank (defaults to 'YES'):
   - Invitation process is triggered for each student
3. If `invite` is 'NO':
   - Students are added without sending invitations

### 3. Manual Invitation

Users can send/resend invitations from the student table:

1. Click "Send/Resend Invitation" button
2. System generates new invitation token and expiration
3. Email is sent via SendGrid
4. UI updates to show invitation status

### 4. Student Acceptance

When a student clicks the invitation link:

1. They land on `/invite/:token` page
2. System validates the token and checks expiration
3. Student enters password (new users) or existing password (existing users)
4. System links the user account to the cohort
5. Student is redirected to dashboard

## Technical Implementation

### Frontend Components

- `AddStudentDialog`: Individual student addition with invitation option
- `CohortStudentsTable`: Student list with invitation management
- `InvitationPage`: Public page for accepting invitations
- `BulkUploadDialog`: CSV upload with invitation preferences

### Backend Services

- `cohortStudentsService.sendCustomInvitation()`: Generates invitation tokens
- `cohortStudentsService.sendInvitationEmail()`: Triggers email sending
- `cohortStudentsService.getStudentByInvitationToken()`: Validates tokens
- `cohortStudentsService.acceptInvitation()`: Links user to cohort

### Edge Function

The `send-invitation-email` Edge Function:

- Receives student details and cohort information
- Fetches invitation token from database
- Validates invitation expiration
- Sends formatted email via SendGrid API
- Returns success/failure status

## Configuration

### Environment Variables

The following secrets are configured in Supabase:

- `SENDGRID_API_KEY`: SendGrid API key for email sending
- `FROM_EMAIL`: Verified sender email (`programs@litschool.in`)
- `FRONTEND_URL`: Base URL for invitation links

### SendGrid Setup

- Sender identity verified: `programs@litschool.in`
- API key configured and tested
- Email templates include both HTML and plain text versions
- Invitation links include proper styling and branding

## Benefits Over Magic Links

1. **Password Control**: Students set their own passwords during acceptance
2. **Better UX**: Clear invitation flow with proper email formatting
3. **Flexibility**: Optional invitations for both individual and bulk additions
4. **Tracking**: Complete audit trail of invitation status
5. **Security**: Time-limited tokens with proper expiration handling
6. **Integration**: Seamless integration with existing user management

## Testing

The system has been tested with:

- Individual student invitations
- Bulk upload with invitation preferences
- Email delivery via SendGrid
- Invitation acceptance flow
- Token validation and expiration
- Error handling for invalid/expired tokens

## Performance Optimizations

- Avatar updates are handled locally without page reloads
- Invitation status updates use optimistic UI updates
- Bulk operations are processed efficiently with proper error handling
