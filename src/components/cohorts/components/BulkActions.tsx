import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MoreHorizontal,
  GraduationCap,
  CreditCard,
  Trash2,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { Scholarship, PaymentPlan } from '@/types/fee';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedStudents: CohortStudent[];
  scholarships: Scholarship[];
  onAssignScholarship: (
    studentIds: string[],
    scholarshipId: string
  ) => Promise<void>;
  onAssignPaymentPlan: (
    studentIds: string[],
    paymentPlan: PaymentPlan
  ) => Promise<void>;
  onDeleteStudents: (studentIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export default function BulkActions({
  selectedStudents,
  scholarships,
  onAssignScholarship,
  onAssignPaymentPlan,
  onDeleteStudents,
  disabled = false,
}: BulkActionsProps) {
  const [scholarshipDialogOpen, setScholarshipDialogOpen] = useState(false);
  const [paymentPlanDialogOpen, setPaymentPlanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<string>('');
  const [selectedPaymentPlan, setSelectedPaymentPlan] =
    useState<PaymentPlan>('not_selected');
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedStudents.length;
  const studentIds = selectedStudents.map(s => s.id);

  const handleAssignScholarship = async () => {
    if (!selectedScholarship) {
      toast.error('Please select a scholarship');
      return;
    }

    setIsProcessing(true);
    try {
      await onAssignScholarship(studentIds, selectedScholarship);
      setScholarshipDialogOpen(false);
      setSelectedScholarship('');
      toast.success(
        `Scholarship assigned to ${selectedCount} student${selectedCount > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Error assigning scholarship:', error);
      toast.error('Failed to assign scholarship');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignPaymentPlan = async () => {
    if (selectedPaymentPlan === 'not_selected') {
      toast.error('Please select a payment plan');
      return;
    }

    setIsProcessing(true);
    try {
      await onAssignPaymentPlan(studentIds, selectedPaymentPlan);
      setPaymentPlanDialogOpen(false);
      setSelectedPaymentPlan('not_selected');
      toast.success(
        `Payment plan assigned to ${selectedCount} student${selectedCount > 1 ? 's' : ''}`
      );
    } catch (error) {
      console.error('Error assigning payment plan:', error);
      toast.error('Failed to assign payment plan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteStudents = async () => {
    setIsProcessing(true);
    try {
      await onDeleteStudents(studentIds);
      setDeleteDialogOpen(false);
      toast.success(
        `${selectedCount} student${selectedCount > 1 ? 's' : ''} removed from cohort`
      );
    } catch (error) {
      console.error('Error deleting students:', error);
      toast.error('Failed to remove students');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className='flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg'>
        <Badge variant='secondary' className='bg-primary/10 text-primary'>
          <Users className='w-3 h-3 mr-1' />
          {selectedCount} selected
        </Badge>

        <Separator orientation='vertical' className='h-4' />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' disabled={disabled}>
              <MoreHorizontal className='w-4 h-4 mr-2' />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => setScholarshipDialogOpen(true)}>
              <GraduationCap className='w-4 h-4 mr-2' />
              Assign Scholarship
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentPlanDialogOpen(true)}>
              <CreditCard className='w-4 h-4 mr-2' />
              Assign Payment Plan
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Remove Students
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scholarship Assignment Dialog */}
      <Dialog
        open={scholarshipDialogOpen}
        onOpenChange={setScholarshipDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Scholarship</DialogTitle>
            <DialogDescription>
              Select a scholarship to assign to {selectedCount} selected student
              {selectedCount > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='scholarship'>Scholarship</Label>
              <Select
                value={selectedScholarship}
                onValueChange={setSelectedScholarship}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a scholarship' />
                </SelectTrigger>
                <SelectContent>
                  {scholarships.map(scholarship => (
                    <SelectItem key={scholarship.id} value={scholarship.id}>
                      {scholarship.name} ({scholarship.amount_percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='bg-muted p-3 rounded-lg'>
              <h4 className='font-medium text-sm mb-2'>Selected Students:</h4>
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {selectedStudents.map(student => (
                  <div
                    key={student.id}
                    className='text-sm text-muted-foreground'
                  >
                    {student.first_name} {student.last_name} ({student.email})
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setScholarshipDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignScholarship}
              disabled={isProcessing || !selectedScholarship}
            >
              {isProcessing ? 'Assigning...' : 'Assign Scholarship'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Plan Assignment Dialog */}
      <Dialog
        open={paymentPlanDialogOpen}
        onOpenChange={setPaymentPlanDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Payment Plan</DialogTitle>
            <DialogDescription>
              Select a payment plan to assign to {selectedCount} selected
              student{selectedCount > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='payment-plan'>Payment Plan</Label>
              <Select
                value={selectedPaymentPlan}
                onValueChange={(value: PaymentPlan) =>
                  setSelectedPaymentPlan(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a payment plan' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='one_shot'>One Shot Payment</SelectItem>
                  <SelectItem value='sem_wise'>
                    Semester-wise Payment
                  </SelectItem>
                  <SelectItem value='instalment_wise'>
                    Installment-wise Payment
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='bg-muted p-3 rounded-lg'>
              <h4 className='font-medium text-sm mb-2'>Selected Students:</h4>
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {selectedStudents.map(student => (
                  <div
                    key={student.id}
                    className='text-sm text-muted-foreground'
                  >
                    {student.first_name} {student.last_name} ({student.email})
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setPaymentPlanDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignPaymentPlan}
              disabled={isProcessing || selectedPaymentPlan === 'not_selected'}
            >
              {isProcessing ? 'Assigning...' : 'Assign Payment Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='w-5 h-5' />
              Remove Students
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedCount} student
              {selectedCount > 1 ? 's' : ''} from this cohort? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className='bg-destructive/10 p-3 rounded-lg border border-destructive/20'>
            <h4 className='font-medium text-sm mb-2 text-destructive'>
              Students to be removed:
            </h4>
            <div className='space-y-1 max-h-32 overflow-y-auto'>
              {selectedStudents.map(student => (
                <div key={student.id} className='text-sm text-destructive/80'>
                  {student.first_name} {student.last_name} ({student.email})
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteStudents}
              disabled={isProcessing}
            >
              {isProcessing ? 'Removing...' : 'Remove Students'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
