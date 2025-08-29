import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { PaymentCallLogsService } from '@/services/paymentCallLogs.service';
import { CreatePaymentCallLogRequest } from '@/types/payments/callLogs';

interface RecordCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  semesterNumber: number;
  installmentNumber: number;
  paymentItemType: string;
  onCallRecorded?: () => void;
}

export const RecordCallDialog: React.FC<RecordCallDialogProps> = ({
  open,
  onOpenChange,
  studentId,
  semesterNumber,
  installmentNumber,
  paymentItemType,
  onCallRecorded,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<
    Omit<CreatePaymentCallLogRequest, 'recorded_by'>
  >({
    student_id: studentId,
    semester_number: semesterNumber,
    installment_number: installmentNumber,
    call_date: format(new Date(), 'yyyy-MM-dd'),
    call_time: format(new Date(), 'HH:mm'),
    call_type: 'outgoing',
    discussion_summary: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.discussion_summary.trim()) {
      toast.error('Please provide a discussion summary');
      return;
    }

    setLoading(true);
    try {
      await PaymentCallLogsService.createCallLog(formData);
      toast.success('Call recorded successfully');
      onCallRecorded?.();
      onOpenChange(false);

      // Reset form
      setFormData({
        student_id: studentId,
        semester_number: semesterNumber,
        installment_number: installmentNumber,
        call_date: format(new Date(), 'yyyy-MM-dd'),
        call_time: format(new Date(), 'HH:mm'),
        call_type: 'outgoing',
        discussion_summary: '',
      });
    } catch (error) {
      toast.error(
        `Failed to record call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentDescription = () => {
    if (paymentItemType === 'Admission Fee') {
      return 'Admission Fee';
    }
    if (paymentItemType === 'All Payments') {
      return 'General Payment Discussion';
    }
    return `${paymentItemType} - Semester ${semesterNumber}${installmentNumber > 0 ? `, Installment ${installmentNumber}` : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Phone className='h-5 w-5' />
            Record Call
          </DialogTitle>
          <DialogDescription>
            Record a call for {getInstallmentDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Call Type */}
          <div className='space-y-2'>
            <Label htmlFor='call_type'>Call Type</Label>
            <Select
              value={formData.call_type}
              onValueChange={(value: 'incoming' | 'outgoing') =>
                setFormData(prev => ({ ...prev, call_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='outgoing'>
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4' />
                    Outgoing Call
                  </div>
                </SelectItem>
                <SelectItem value='incoming'>
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4' />
                    Incoming Call
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Call Date and Time */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='call_date' className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                Call Date
              </Label>
              <Input
                id='call_date'
                type='date'
                value={formData.call_date}
                onChange={e =>
                  setFormData(prev => ({ ...prev, call_date: e.target.value }))
                }
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='call_time' className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                Call Time
              </Label>
              <Input
                id='call_time'
                type='time'
                value={formData.call_time}
                onChange={e =>
                  setFormData(prev => ({ ...prev, call_time: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Call Duration */}
          <div className='space-y-2'>
            <Label htmlFor='call_duration'>Call Duration (minutes)</Label>
            <Input
              id='call_duration'
              type='number'
              min='1'
              max='480'
              placeholder='e.g., 15'
              value={formData.call_duration_minutes || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  call_duration_minutes: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>

          {/* Discussion Summary */}
          <div className='space-y-2'>
            <Label
              htmlFor='discussion_summary'
              className='flex items-center gap-1'
            >
              <MessageSquare className='h-4 w-4' />
              Discussion Summary
            </Label>
            <Textarea
              id='discussion_summary'
              placeholder='Describe what was discussed during the call...'
              value={formData.discussion_summary}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  discussion_summary: e.target.value,
                }))
              }
              rows={4}
              required
            />
          </div>

          {/* Follow-up Section */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-4 w-4 text-orange-500' />
              <Label className='text-sm font-medium'>
                Follow-up (Optional)
              </Label>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='next_follow_up_date'>Follow-up Date</Label>
                <Input
                  id='next_follow_up_date'
                  type='date'
                  value={formData.next_follow_up_date || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      next_follow_up_date: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='next_follow_up_time'>Follow-up Time</Label>
                <Input
                  id='next_follow_up_time'
                  type='time'
                  value={formData.next_follow_up_time || ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      next_follow_up_time: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='follow_up_notes'>Follow-up Notes</Label>
              <Textarea
                id='follow_up_notes'
                placeholder='Any specific notes for the follow-up call...'
                value={formData.follow_up_notes || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    follow_up_notes: e.target.value || undefined,
                  }))
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Recording...' : 'Record Call'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
