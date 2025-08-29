import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Send, Eye } from 'lucide-react';
import { emailService } from '@/services/email.service';
import { toast } from 'sonner';

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    email: string;
    name: string;
  };
  context?: {
    type: 'payment_reminder' | 'custom';
    paymentData?: {
      amount: number;
      dueDate: string;
      installmentNumber: number;
      studentName: string;
    };
  };
}

export const EmailComposerDialog: React.FC<EmailComposerDialogProps> = ({
  open,
  onOpenChange,
  recipient,
  context,
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [template, setTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize with payment reminder template if context is payment
  React.useEffect(() => {
    if (context?.type === 'payment_reminder' && context.paymentData) {
      const { paymentData } = context;
      setSubject(
        `Payment Reminder - ${paymentData.installmentNumber} Installment`
      );
      setContent(`Dear ${paymentData.studentName},

This is a friendly reminder that your ${paymentData.installmentNumber} installment payment of ${paymentData.amount} is due on ${paymentData.dueDate}.

Please ensure timely payment to avoid any late fees or complications with your program.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
LIT OS Team`);
    }
  }, [context]);

  const handleEnhanceWithAI = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content to enhance');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhancedContent = await emailService.enhanceWithAI(
        content,
        context?.type === 'payment_reminder'
          ? 'payment reminder email'
          : 'general communication',
        'professional'
      );
      setContent(enhancedContent);
      toast.success('Content enhanced with AI!');
    } catch (error) {
      toast.error('Failed to enhance content with AI');
      console.error('AI enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Please fill in both subject and content');
      return;
    }

    setIsLoading(true);
    try {
      let result;

      if (context?.type === 'payment_reminder' && context.paymentData) {
        result = await emailService.sendPaymentReminder(
          recipient,
          context.paymentData,
          content
        );
      } else {
        result = await emailService.sendCustomEmail(
          recipient,
          subject,
          content
        );
      }

      if (result.success) {
        toast.success('Email sent successfully!');
        onOpenChange(false);
        // Reset form
        setSubject('');
        setContent('');
        setTemplate('');
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send email');
      console.error('Send email error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (value: string) => {
    setTemplate(value);

    // Apply template content
    switch (value) {
      case 'payment_reminder':
        if (context?.paymentData) {
          const { paymentData } = context;
          setSubject(
            `Payment Reminder - ${paymentData.installmentNumber} Installment`
          );
          setContent(`Dear ${paymentData.studentName},

This is a friendly reminder that your ${paymentData.installmentNumber} installment payment of ${paymentData.amount} is due on ${paymentData.dueDate}.

Please ensure timely payment to avoid any late fees or complications with your program.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
LIT OS Team`);
        }
        break;
      case 'general_reminder':
        setSubject('Important Reminder');
        setContent(`Dear ${recipient.name},

I hope this message finds you well. I wanted to reach out regarding an important matter that requires your attention.

Please review the details and take the necessary action as soon as possible.

If you have any questions or need clarification, please don't hesitate to contact me.

Best regards,
LIT OS Team`);
        break;
      case 'custom':
        setSubject('');
        setContent('');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose and send an email to {recipient.name} ({recipient.email})
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Template Selection */}
          <div className='space-y-2'>
            <Label htmlFor='template'>Email Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder='Select a template or write custom' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='payment_reminder'>
                  Payment Reminder
                </SelectItem>
                <SelectItem value='general_reminder'>
                  General Reminder
                </SelectItem>
                <SelectItem value='custom'>Custom Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className='space-y-2'>
            <Label htmlFor='subject'>Subject</Label>
            <Input
              id='subject'
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder='Enter email subject...'
            />
          </div>

          {/* Content */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='content'>Message</Label>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing || !content.trim()}
                >
                  {isEnhancing ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Sparkles className='h-4 w-4' />
                  )}
                  Magic Write
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className='h-4 w-4' />
                  Preview
                </Button>
              </div>
            </div>
            <Textarea
              id='content'
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder='Enter your message...'
              rows={8}
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className='space-y-2'>
              <Label>Preview</Label>
              <div className='border rounded-md p-4 bg-muted/50'>
                <div className='space-y-2'>
                  <div>
                    <strong>To:</strong> {recipient.name} ({recipient.email})
                  </div>
                  <div>
                    <strong>Subject:</strong> {subject}
                  </div>
                  <div>
                    <strong>Message:</strong>
                    <div className='mt-2 whitespace-pre-wrap text-sm'>
                      {content}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Context Badge */}
          {context?.type === 'payment_reminder' && (
            <div className='flex items-center gap-2'>
              <Badge variant='secondary'>Payment Reminder</Badge>
              {context.paymentData && (
                <span className='text-sm text-muted-foreground'>
                  Installment {context.paymentData.installmentNumber} - ₹
                  {context.paymentData.amount}
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isLoading || !subject.trim() || !content.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Sending...
              </>
            ) : (
              <>
                <Send className='h-4 w-4 mr-2' />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
