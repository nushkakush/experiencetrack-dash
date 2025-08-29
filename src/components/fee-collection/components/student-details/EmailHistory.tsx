import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Mail,
  Calendar,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { emailService } from '@/services/email.service';

interface EmailLog {
  id: string;
  type: string;
  template?: string;
  subject: string;
  content: string;
  recipient_email: string;
  recipient_name?: string;
  context?: Record<string, any>;
  sent_at: string;
  status: string;
  error_message?: string;
  ai_enhanced: boolean;
}

interface EmailHistoryProps {
  studentId: string;
  studentEmail: string;
  onEmailSent?: () => void;
}

export const EmailHistory: React.FC<EmailHistoryProps> = ({
  studentId,
  studentEmail,
  onEmailSent,
}) => {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEmail, setDeletingEmail] = useState<EmailLog | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const fetchEmailLogs = async () => {
    try {
      const result = await emailService.getEmailLogs(100); // Get last 100 emails

      if (result.success && result.data) {
        // Filter emails for this specific student AND only fee-related emails
        const studentEmails = result.data.filter(
          (email: EmailLog) =>
            email.recipient_email === studentEmail &&
            // Only show payment reminders and custom emails (fee-related)
            (email.type === 'payment_reminder' || email.type === 'custom')
        );
        setEmailLogs(studentEmails);
      } else {
        console.error('Failed to fetch emails:', result.error);
        toast.error('Failed to fetch email logs');
      }
    } catch (error) {
      console.error('Error fetching email logs:', error);
      toast.error(
        `Failed to fetch email logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [studentEmail]);

  const handleDeleteEmail = async (emailId: string) => {
    try {
      // Note: We don't have a delete method in emailService yet, so this is a placeholder
      // In a real implementation, you might want to add a soft delete or archive functionality
      toast.error('Email deletion not implemented yet');
    } catch (error) {
      toast.error(
        `Failed to delete email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const openDeleteDialog = (email: EmailLog) => {
    setDeletingEmail(email);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingEmail) return;

    await handleDeleteEmail(deletingEmail.id);
    setShowDeleteDialog(false);
    setDeletingEmail(null);
    fetchEmailLogs();
  };

  const viewEmail = (email: EmailLog) => {
    setSelectedEmail(email);
    setShowEmailDialog(true);
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'invitation':
        return <Mail className='h-4 w-4 text-blue-600' />;
      case 'user_invitation':
        return <Mail className='h-4 w-4 text-purple-600' />;
      case 'payment_reminder':
        return <Mail className='h-4 w-4 text-orange-600' />;
      case 'custom':
        return <Mail className='h-4 w-4 text-green-600' />;
      default:
        return <Mail className='h-4 w-4 text-gray-600' />;
    }
  };

  const getEmailTypeBadge = (type: string) => {
    switch (type) {
      case 'invitation':
        return (
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            Student Invitation
          </Badge>
        );
      case 'user_invitation':
        return (
          <Badge variant='secondary' className='bg-purple-100 text-purple-800'>
            User Invitation
          </Badge>
        );
      case 'payment_reminder':
        return (
          <Badge variant='secondary' className='bg-orange-100 text-orange-800'>
            Payment Reminder
          </Badge>
        );
      case 'custom':
        return (
          <Badge variant='secondary' className='bg-green-100 text-green-800'>
            Custom Email
          </Badge>
        );
      default:
        return (
          <Badge variant='secondary' className='bg-gray-100 text-gray-800'>
            {type}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'sent' ? (
      <CheckCircle className='h-4 w-4 text-green-600' />
    ) : (
      <XCircle className='h-4 w-4 text-red-600' />
    );
  };

  if (loading) {
    return (
      <div className='animate-pulse space-y-4'>
        <div className='h-4 bg-gray-200 rounded w-1/4'></div>
        <div className='space-y-2'>
          <div className='h-3 bg-gray-200 rounded'></div>
          <div className='h-3 bg-gray-200 rounded w-5/6'></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {emailLogs.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground'>
          <Mail className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p>No fee-related emails sent yet</p>
          <p className='text-sm mt-2'>
            Payment reminders and fee communications will appear here
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {emailLogs.map(email => (
            <div key={email.id} className='border rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  {getEmailTypeIcon(email.type)}
                  {getEmailTypeBadge(email.type)}
                  <span className='text-sm text-muted-foreground'>
                    {format(new Date(email.sent_at), 'MMM dd, yyyy')} at{' '}
                    {format(new Date(email.sent_at), 'hh:mm a')}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {getStatusIcon(email.status)}
                  <Badge
                    variant={
                      email.status === 'sent' ? 'default' : 'destructive'
                    }
                    className='text-xs'
                  >
                    {email.status}
                  </Badge>
                  {email.ai_enhanced && (
                    <Badge variant='outline' className='text-xs'>
                      AI Enhanced
                    </Badge>
                  )}
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => viewEmail(email)}
                  >
                    <Eye className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => openDeleteDialog(email)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium text-sm'>{email.subject}</h4>
                <p className='text-sm text-muted-foreground line-clamp-2'>
                  {email.content.replace(/\n/g, ' ').substring(0, 150)}
                  {email.content.length > 150 ? '...' : ''}
                </p>

                {email.context && (
                  <div className='mt-3 pt-3 border-t'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Calendar className='h-3 w-3' />
                      {email.context.paymentData && (
                        <span>
                          Installment{' '}
                          {email.context.paymentData.installmentNumber} - ₹
                          {email.context.paymentData.amount}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Email Dialog */}
      <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <AlertDialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Mail className='h-5 w-5' />
              Email Details
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedEmail && (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  {getEmailTypeBadge(selectedEmail.type)}
                  {getStatusIcon(selectedEmail.status)}
                  <Badge
                    variant={
                      selectedEmail.status === 'sent'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {selectedEmail.status}
                  </Badge>
                </div>
                <div className='text-sm text-muted-foreground'>
                  Sent on{' '}
                  {format(new Date(selectedEmail.sent_at), 'MMM dd, yyyy')} at{' '}
                  {format(new Date(selectedEmail.sent_at), 'hh:mm a')}
                </div>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Subject</h4>
                <p className='text-sm bg-muted p-2 rounded'>
                  {selectedEmail.subject}
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-medium'>Content</h4>
                <div className='text-sm bg-muted p-3 rounded whitespace-pre-wrap max-h-60 overflow-y-auto'>
                  {selectedEmail.content}
                </div>
              </div>

              {selectedEmail.context && (
                <div className='space-y-2'>
                  <h4 className='font-medium'>Context</h4>
                  <div className='text-sm bg-muted p-2 rounded'>
                    <pre className='text-xs overflow-x-auto'>
                      {JSON.stringify(selectedEmail.context, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedEmail.error_message && (
                <div className='space-y-2'>
                  <h4 className='font-medium text-red-600'>Error</h4>
                  <p className='text-sm text-red-600 bg-red-50 p-2 rounded'>
                    {selectedEmail.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email record? This action
              cannot be undone.
              {deletingEmail && (
                <div className='mt-2 p-2 bg-muted rounded text-sm'>
                  <p>
                    <strong>Email Details:</strong>
                  </p>
                  <p>Subject: {deletingEmail.subject}</p>
                  <p>
                    Sent:{' '}
                    {format(new Date(deletingEmail.sent_at), 'MMM dd, yyyy')} at{' '}
                    {format(new Date(deletingEmail.sent_at), 'hh:mm a')}
                  </p>
                  <p>Type: {deletingEmail.type}</p>
                  <p>Status: {deletingEmail.status}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
