import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PaymentCallLogsService } from '@/services/paymentCallLogs.service';
import {
  PaymentCallLog,
  CreatePaymentCallLogRequest,
  UpdatePaymentCallLogRequest,
} from '@/types/payments/callLogs';

interface CallManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  semesterNumber: number;
  installmentNumber: number;
  paymentItemType: string;
  onCallRecorded?: () => void;
}

export const CallManagementDialog: React.FC<CallManagementDialogProps> = ({
  open,
  onOpenChange,
  studentId,
  semesterNumber,
  installmentNumber,
  paymentItemType,
  onCallRecorded,
}) => {
  const [activeTab, setActiveTab] = useState('record');
  const [loading, setLoading] = useState(false);
  const [callLogs, setCallLogs] = useState<PaymentCallLog[]>([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [editingCall, setEditingCall] = useState<PaymentCallLog | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdatePaymentCallLogRequest>(
    {}
  );
  const [deletingCall, setDeletingCall] = useState<PaymentCallLog | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const getInstallmentDescription = () => {
    if (paymentItemType === 'Admission Fee') {
      return 'Admission Fee';
    }
    if (paymentItemType === 'All Payments') {
      return 'General Payment Discussion';
    }
    return `${paymentItemType} - Semester ${semesterNumber}${installmentNumber > 0 ? `, Installment ${installmentNumber}` : ''}`;
  };

  const fetchCallLogs = async () => {
    setCallLogsLoading(true);
    try {
      const logs = await PaymentCallLogsService.getCallLogsByInstallment(
        studentId,
        semesterNumber,
        installmentNumber
      );
      setCallLogs(logs);
    } catch (error) {
      toast.error(
        `Failed to fetch call logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setCallLogsLoading(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === 'history') {
      fetchCallLogs();
    }
  }, [open, activeTab, studentId, semesterNumber, installmentNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await PaymentCallLogsService.createCallLog(formData);
      toast.success('Call recorded successfully');

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

      // Refresh call logs if on history tab
      if (activeTab === 'history') {
        await fetchCallLogs();
      }

      onCallRecorded?.();
    } catch (error) {
      toast.error(
        `Failed to record call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCall) return;

    setLoading(true);
    try {
      await PaymentCallLogsService.updateCallLog(editingCall.id, editFormData);
      toast.success('Call updated successfully');
      setShowEditDialog(false);
      setEditingCall(null);
      setEditFormData({});
      await fetchCallLogs();
    } catch (error) {
      toast.error(
        `Failed to update call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      await PaymentCallLogsService.deleteCallLog(callId);
      toast.success('Call deleted successfully');
      await fetchCallLogs();
    } catch (error) {
      toast.error(
        `Failed to delete call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const openDeleteDialog = (call: PaymentCallLog) => {
    setDeletingCall(call);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingCall) return;

    await handleDeleteCall(deletingCall.id);
    setShowDeleteDialog(false);
    setDeletingCall(null);
  };

  const openEditDialog = (call: PaymentCallLog) => {
    setEditingCall(call);
    setEditFormData({
      call_date: call.call_date,
      call_time: call.call_time,
      call_duration_minutes: call.call_duration_minutes,
      call_type: call.call_type,
      discussion_summary: call.discussion_summary,
      next_follow_up_date: call.next_follow_up_date,
      next_follow_up_time: call.next_follow_up_time,
      follow_up_notes: call.follow_up_notes,
    });
    setShowEditDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Phone className='h-5 w-5' />
              Call Management - {getInstallmentDescription()}
            </DialogTitle>
            <DialogDescription>
              Record new calls or view call history for this installment
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='record' className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Record Call
              </TabsTrigger>
              <TabsTrigger value='history' className='flex items-center gap-2'>
                <MessageSquare className='h-4 w-4' />
                Call History
                {callLogs.length > 0 && (
                  <Badge variant='secondary' className='ml-1'>
                    {callLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value='record' className='space-y-4'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
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
                        <SelectItem value='incoming'>Incoming</SelectItem>
                        <SelectItem value='outgoing'>Outgoing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='call_duration'>Duration (minutes)</Label>
                    <Input
                      id='call_duration'
                      type='number'
                      min='1'
                      value={formData.call_duration_minutes || ''}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          call_duration_minutes: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        }))
                      }
                      placeholder='Optional'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='call_date'>Call Date</Label>
                    <Input
                      id='call_date'
                      type='date'
                      value={formData.call_date}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          call_date: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='call_time'>Call Time</Label>
                    <Input
                      id='call_time'
                      type='time'
                      value={formData.call_time}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          call_time: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='discussion_summary'>
                    Discussion Summary *
                  </Label>
                  <Textarea
                    id='discussion_summary'
                    value={formData.discussion_summary}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        discussion_summary: e.target.value,
                      }))
                    }
                    placeholder='What was discussed during the call?'
                    required
                    rows={3}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='next_follow_up_date'>
                      Next Follow-up Date
                    </Label>
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
                      placeholder='Optional'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='next_follow_up_time'>
                      Next Follow-up Time
                    </Label>
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
                      placeholder='Optional'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='follow_up_notes'>Follow-up Notes</Label>
                  <Textarea
                    id='follow_up_notes'
                    value={formData.follow_up_notes || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        follow_up_notes: e.target.value || undefined,
                      }))
                    }
                    placeholder='Any additional notes for follow-up'
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={loading}>
                    {loading ? 'Recording...' : 'Record Call'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent
              value='history'
              className='space-y-4 max-h-[400px] overflow-y-auto'
            >
              {callLogsLoading ? (
                <div className='animate-pulse space-y-4'>
                  <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                  <div className='space-y-2'>
                    <div className='h-3 bg-gray-200 rounded'></div>
                    <div className='h-3 bg-gray-200 rounded w-5/6'></div>
                  </div>
                </div>
              ) : callLogs.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Phone className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>No call records found for this installment</p>
                  <p className='text-sm'>
                    Record your first call to see it here
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {callLogs.map(call => (
                    <div
                      key={call.id}
                      className='border rounded-lg p-4 space-y-3'
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={
                              call.call_type === 'incoming'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {call.call_type}
                          </Badge>
                          <span className='text-sm text-muted-foreground'>
                            {format(new Date(call.call_date), 'MMM dd, yyyy')}{' '}
                            at {call.call_time}
                          </span>
                          {call.call_duration_minutes && (
                            <span className='text-sm text-muted-foreground'>
                              • {call.call_duration_minutes} min
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => openEditDialog(call)}
                            className='h-6 w-6 p-0'
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => openDeleteDialog(call)}
                            className='h-6 w-6 p-0 text-destructive hover:text-destructive'
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <p className='text-sm'>{call.discussion_summary}</p>
                      </div>

                      {(call.next_follow_up_date || call.follow_up_notes) && (
                        <div className='pt-2 border-t'>
                          {call.next_follow_up_date && (
                            <div className='flex items-center gap-2 text-xs text-muted-foreground mb-1'>
                              <Calendar className='h-3 w-3' />
                              <span>
                                Next follow-up:{' '}
                                {format(
                                  new Date(call.next_follow_up_date),
                                  'MMM dd, yyyy'
                                )}
                                {call.next_follow_up_time &&
                                  ` at ${call.next_follow_up_time}`}
                              </span>
                            </div>
                          )}
                          {call.follow_up_notes && (
                            <p className='text-xs text-muted-foreground'>
                              {call.follow_up_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Call Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Call Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCall} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit_call_type'>Call Type</Label>
                <Select
                  value={editFormData.call_type || editingCall?.call_type}
                  onValueChange={(value: 'incoming' | 'outgoing') =>
                    setEditFormData(prev => ({ ...prev, call_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='incoming'>Incoming</SelectItem>
                    <SelectItem value='outgoing'>Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit_call_duration'>Duration (minutes)</Label>
                <Input
                  id='edit_call_duration'
                  type='number'
                  min='1'
                  value={editFormData.call_duration_minutes || ''}
                  onChange={e =>
                    setEditFormData(prev => ({
                      ...prev,
                      call_duration_minutes: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder='Optional'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit_call_date'>Call Date</Label>
                <Input
                  id='edit_call_date'
                  type='date'
                  value={editFormData.call_date || ''}
                  onChange={e =>
                    setEditFormData(prev => ({
                      ...prev,
                      call_date: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit_call_time'>Call Time</Label>
                <Input
                  id='edit_call_time'
                  type='time'
                  value={editFormData.call_time || ''}
                  onChange={e =>
                    setEditFormData(prev => ({
                      ...prev,
                      call_time: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_discussion_summary'>
                Discussion Summary *
              </Label>
              <Textarea
                id='edit_discussion_summary'
                value={editFormData.discussion_summary || ''}
                onChange={e =>
                  setEditFormData(prev => ({
                    ...prev,
                    discussion_summary: e.target.value,
                  }))
                }
                placeholder='What was discussed during the call?'
                required
                rows={3}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit_next_follow_up_date'>
                  Next Follow-up Date
                </Label>
                <Input
                  id='edit_next_follow_up_date'
                  type='date'
                  value={editFormData.next_follow_up_date || ''}
                  onChange={e =>
                    setEditFormData(prev => ({
                      ...prev,
                      next_follow_up_date: e.target.value || undefined,
                    }))
                  }
                  placeholder='Optional'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit_next_follow_up_time'>
                  Next Follow-up Time
                </Label>
                <Input
                  id='edit_next_follow_up_time'
                  type='time'
                  value={editFormData.next_follow_up_time || ''}
                  onChange={e =>
                    setEditFormData(prev => ({
                      ...prev,
                      next_follow_up_time: e.target.value || undefined,
                    }))
                  }
                  placeholder='Optional'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit_follow_up_notes'>Follow-up Notes</Label>
              <Textarea
                id='edit_follow_up_notes'
                value={editFormData.follow_up_notes || ''}
                onChange={e =>
                  setEditFormData(prev => ({
                    ...prev,
                    follow_up_notes: e.target.value || undefined,
                  }))
                }
                placeholder='Any additional notes for follow-up'
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Updating...' : 'Update Call'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call record? This action
              cannot be undone.
              {deletingCall && (
                <div className='mt-2 p-2 bg-muted rounded text-sm'>
                  <p>
                    <strong>Call Details:</strong>
                  </p>
                  <p>
                    Date:{' '}
                    {format(new Date(deletingCall.call_date), 'MMM dd, yyyy')}{' '}
                    at {deletingCall.call_time}
                  </p>
                  <p>Type: {deletingCall.call_type}</p>
                  <p>
                    Summary: {deletingCall.discussion_summary.substring(0, 100)}
                    {deletingCall.discussion_summary.length > 100 ? '...' : ''}
                  </p>
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
