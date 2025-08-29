import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { PaymentCallLogsService } from '@/services/paymentCallLogs.service';
import {
  PaymentCallLog,
  UpdatePaymentCallLogRequest,
} from '@/types/payments/callLogs';

interface CallHistoryProps {
  studentId: string;
  semesterNumber: number;
  installmentNumber: number;
  paymentItemType: string;
  onCallRecorded?: () => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({
  studentId,
  semesterNumber,
  installmentNumber,
  paymentItemType,
  onCallRecorded,
}) => {
  const [callLogs, setCallLogs] = useState<PaymentCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCall, setEditingCall] = useState<PaymentCallLog | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdatePaymentCallLogRequest>(
    {}
  );
  const [deletingCall, setDeletingCall] = useState<PaymentCallLog | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchCallLogs = async () => {
    try {
      let logs;
      if (paymentItemType === 'All Payments') {
        // Fetch all call logs for the student
        logs = await PaymentCallLogsService.getCallLogs({
          student_id: studentId,
        });
      } else {
        // Fetch call logs for specific installment
        logs = await PaymentCallLogsService.getCallLogsByInstallment(
          studentId,
          semesterNumber,
          installmentNumber
        );
      }
      setCallLogs(logs);
    } catch (error) {
      toast.error(
        `Failed to fetch call logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, [studentId, semesterNumber, installmentNumber]);

  const handleEditCall = (call: PaymentCallLog) => {
    setEditingCall(call);
    setEditFormData({
      id: call.id,
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

  const handleUpdateCall = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormData.discussion_summary?.trim()) {
      toast.error('Please provide a discussion summary');
      return;
    }

    try {
      await PaymentCallLogsService.updateCallLog(editFormData);
      toast.success('Call updated successfully');
      setShowEditDialog(false);
      setEditingCall(null);
      fetchCallLogs();
      onCallRecorded?.();
    } catch (error) {
      toast.error(
        `Failed to update call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      await PaymentCallLogsService.deleteCallLog(callId);
      toast.success('Call deleted successfully');
      fetchCallLogs();
      onCallRecorded?.();
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

  const getCallTypeIcon = (callType: string) => {
    return callType === 'incoming' ? (
      <Phone className='h-4 w-4 text-green-600' />
    ) : (
      <Phone className='h-4 w-4 text-blue-600' />
    );
  };

  const getCallTypeBadge = (callType: string) => {
    return callType === 'incoming' ? (
      <Badge variant='secondary' className='bg-green-100 text-green-800'>
        Incoming
      </Badge>
    ) : (
      <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
        Outgoing
      </Badge>
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
      {callLogs.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground'>
          <Phone className='h-12 w-12 mx-auto mb-4 opacity-50' />
          <p>No calls recorded yet</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {callLogs.map(call => (
            <div key={call.id} className='border rounded-lg p-4'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  {getCallTypeIcon(call.call_type)}
                  {getCallTypeBadge(call.call_type)}
                  <span className='text-sm text-muted-foreground'>
                    {format(new Date(call.call_date), 'MMM dd, yyyy')} at{' '}
                    {format(
                      new Date(`2000-01-01T${call.call_time}`),
                      'hh:mm a'
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  {call.call_duration_minutes && (
                    <Badge variant='outline' className='text-xs'>
                      {call.call_duration_minutes} min
                    </Badge>
                  )}
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => handleEditCall(call)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => openDeleteDialog(call)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                {paymentItemType === 'All Payments' && (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground mb-2'>
                    <span>Semester {call.semester_number}</span>
                    {call.installment_number > 0 && (
                      <span>• Installment {call.installment_number}</span>
                    )}
                  </div>
                )}
                <p className='text-sm'>{call.discussion_summary}</p>

                {(call.next_follow_up_date || call.follow_up_notes) && (
                  <div className='mt-3 pt-3 border-t'>
                    {call.next_follow_up_date && (
                      <div className='flex items-center gap-2 text-sm text-muted-foreground mb-1'>
                        <Calendar className='h-3 w-3' />
                        Follow-up:{' '}
                        {format(
                          new Date(call.next_follow_up_date),
                          'MMM dd, yyyy'
                        )}
                        {call.next_follow_up_time && (
                          <>
                            {' '}
                            at{' '}
                            {format(
                              new Date(
                                `2000-01-01T${call.next_follow_up_time}`
                              ),
                              'hh:mm a'
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {call.follow_up_notes && (
                      <p className='text-sm text-muted-foreground'>
                        {call.follow_up_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Call Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Edit className='h-5 w-5' />
              Edit Call
            </DialogTitle>
            <DialogDescription>
              Update call details for {paymentItemType}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCall} className='space-y-4'>
            {/* Call Type */}
            <div className='space-y-2'>
              <Label htmlFor='edit_call_type'>Call Type</Label>
              <Select
                value={editFormData.call_type || 'outgoing'}
                onValueChange={(value: 'incoming' | 'outgoing') =>
                  setEditFormData(prev => ({ ...prev, call_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='outgoing'>Outgoing Call</SelectItem>
                  <SelectItem value='incoming'>Incoming Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Call Date and Time */}
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

            {/* Call Duration */}
            <div className='space-y-2'>
              <Label htmlFor='edit_call_duration'>
                Call Duration (minutes)
              </Label>
              <Input
                id='edit_call_duration'
                type='number'
                min='1'
                max='480'
                value={editFormData.call_duration_minutes || ''}
                onChange={e =>
                  setEditFormData(prev => ({
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
              <Label htmlFor='edit_discussion_summary'>
                Discussion Summary
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
                rows={4}
                required
              />
            </div>

            {/* Follow-up Section */}
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>
                Follow-up (Optional)
              </Label>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit_next_follow_up_date'>
                    Follow-up Date
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
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='edit_next_follow_up_time'>
                    Follow-up Time
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
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type='submit'>Update Call</Button>
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
