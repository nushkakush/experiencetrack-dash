import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CohortStudent } from '@/types/cohort';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MarkDroppedOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: CohortStudent | null;
  onMarkedAsDroppedOut: () => void;
  onReverted: () => void;
}

const DROPOUT_REASONS = [
  'Academic difficulties',
  'Financial constraints',
  'Personal reasons',
  'Health issues',
  'Family circumstances',
  'Career change',
  'Relocation',
  'Other'
];

export default function MarkDroppedOutDialog({
  open,
  onOpenChange,
  student,
  onMarkedAsDroppedOut,
  onReverted,
}: MarkDroppedOutDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [showRefundOption, setShowRefundOption] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{ amount: number; date: string } | null>(null);

  const isDroppedOut = student?.dropped_out_status === 'dropped_out';

  // Fetch refund information when viewing dropped out student details
  useEffect(() => {
    if (isDroppedOut && student) {
      fetchRefundInfo();
    }
  }, [isDroppedOut, student]);

  const fetchRefundInfo = async () => {
    if (!student) return;

    try {
      // Get the student's payment record
      const { data: payments } = await supabase
        .from('student_payments')
        .select('id')
        .eq('student_id', student.id)
        .limit(1);

      if (payments && payments.length > 0) {
        // Get refund transactions for this student
        const { data: refunds } = await supabase
          .from('payment_transactions')
          .select('amount, created_at')
          .eq('payment_id', payments[0].id)
          .eq('transaction_type', 'refund')
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(1);

        if (refunds && refunds.length > 0) {
          setRefundInfo({
            amount: parseFloat(refunds[0].amount.toString()),
            date: new Date(refunds[0].created_at).toLocaleDateString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching refund info:', error);
    }
  };

  const handleSubmit = async () => {
    if (!student) return;

    if (isDroppedOut) {
      // Reverting dropout status
      setIsSubmitting(true);
      try {
        const result = await cohortStudentsService.revertDroppedOutStatus(student.id);
        
        if (result.success) {
          toast.success(`${student.first_name} ${student.last_name} has been reactivated`);
          onReverted();
          onOpenChange(false);
          resetForm();
        } else {
          throw new Error(result.error || 'Failed to revert dropout status');
        }
      } catch (error) {
        console.error('Error reverting dropout status:', error);
        toast.error('Failed to revert dropout status');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Marking as dropped out
      const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
      
      if (!finalReason.trim()) {
        toast.error('Please provide a reason for dropping out');
        return;
      }

      setIsSubmitting(true);
      try {
        // First mark as dropped out
        const result = await cohortStudentsService.markAsDroppedOut(student.id, finalReason);
        
        if (result.success) {
          // If refund is requested, process it
          if (showRefundOption && refundAmount.trim()) {
            const amount = parseFloat(refundAmount);
            if (!isNaN(amount) && amount > 0) {
              try {
                const refundResult = await cohortStudentsService.issueRefund(student.id, amount);
                if (refundResult.success) {
                  toast.success(`${student.first_name} ${student.last_name} has been marked as dropped out with refund of ₹${amount}`);
                } else {
                  toast.success(`${student.first_name} ${student.last_name} has been marked as dropped out, but refund failed`);
                }
              } catch (refundError) {
                toast.success(`${student.first_name} ${student.last_name} has been marked as dropped out, but refund failed`);
                console.error('Refund error:', refundError);
              }
            } else {
              toast.success(`${student.first_name} ${student.last_name} has been marked as dropped out`);
            }
          } else {
            toast.success(`${student.first_name} ${student.last_name} has been marked as dropped out`);
          }
          
          onMarkedAsDroppedOut();
          onOpenChange(false);
          resetForm();
        } else {
          throw new Error(result.error || 'Failed to mark student as dropped out');
        }
      } catch (error) {
        console.error('Error marking student as dropped out:', error);
        toast.error('Failed to mark student as dropped out');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setCustomReason('');
    setRefundAmount('');
    setShowRefundOption(false);
    setRefundInfo(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isDroppedOut ? 'Student Dropout Details' : 'Mark Student as Dropped Out'}
          </DialogTitle>
          <DialogDescription>
            {isDroppedOut ? (
              <>
                {student.first_name} {student.last_name} was marked as dropped out on{' '}
                {new Date(student.dropped_out_at!).toLocaleDateString()}.
                {student.dropped_out_reason && (
                  <div className="mt-2 p-2 bg-muted rounded border">
                    <strong>Reason:</strong> {student.dropped_out_reason}
                  </div>
                )}
                {refundInfo && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <strong>Refund Issued:</strong> ₹{refundInfo.amount} on {refundInfo.date}
                  </div>
                )}
              </>
            ) : (
              `Mark ${student.first_name} ${student.last_name} as dropped out from the cohort. 
              This will remove them from fee collection and attendance dashboards.`
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!isDroppedOut && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for dropping out</Label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {DROPOUT_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedReason === 'Other' && (
                <div className="grid gap-2">
                  <Label htmlFor="custom-reason">Please specify the reason</Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Enter the specific reason for dropping out..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-refund"
                  checked={showRefundOption}
                  onChange={(e) => setShowRefundOption(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="show-refund">Issue refund (optional)</Label>
              </div>

              {showRefundOption && (
                <div className="grid gap-2">
                  <Label htmlFor="refund-amount">Refund amount (₹)</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    placeholder="Enter refund amount"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount must be less than or equal to the total amount paid by the student.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          {isDroppedOut ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Reactivating...' : 'Reactivate Student'}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!selectedReason || (selectedReason === 'Other' && !customReason.trim()))}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Marking...' : 'Mark as Dropped Out'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
