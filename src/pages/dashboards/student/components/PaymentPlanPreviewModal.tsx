import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Building2,
  FileText,
  CreditCard,
  ArrowRight,
  X,
} from 'lucide-react';
import { PaymentPlan, StudentScholarshipWithDetails } from '@/types/fee';
import { FeeStructure } from '@/types/fee';
import { CohortStudent, Cohort } from '@/types/cohort';
import AdminLikePlanPreview from './AdminLikePlanPreview';
import { getPaymentPlanDescription, getPaymentPlanTitle } from '@/utils/paymentPlanDescriptions';

interface PaymentPlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPlan: PaymentPlan | null;
  feeStructure?: FeeStructure;
  studentData?: CohortStudent;
  cohortData?: Cohort;
  studentScholarship?: StudentScholarshipWithDetails; // Add student scholarship data
  isSubmitting?: boolean;
}

export const PaymentPlanPreviewModal: React.FC<
  PaymentPlanPreviewModalProps
> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPlan,
  feeStructure,
  studentData,
  cohortData,
  studentScholarship,
  isSubmitting = false,
}) => {
  if (!selectedPlan) return null;

  const getPlanIcon = (plan: PaymentPlan) => {
    switch (plan) {
      case 'one_shot':
        return <DollarSign className='h-6 w-6 text-green-600' />;
      case 'sem_wise':
        return <Building2 className='h-6 w-6 text-blue-600' />;
      case 'instalment_wise':
        return <FileText className='h-6 w-6 text-purple-600' />;
      default:
        return <CreditCard className='h-6 w-6 text-gray-600' />;
    }
  };



  if (!feeStructure) {
    return (
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              Payment Plan Preview
            </DialogTitle>
            <DialogDescription>
              Unable to generate preview. Fee structure information is not
              available.
            </DialogDescription>
          </DialogHeader>
          <div className='text-center py-8'>
            <div className='text-muted-foreground'>
              Please contact the administration to set up your fee structure.
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            {getPlanIcon(selectedPlan)}
            <div>
              <DialogTitle className='text-2xl font-bold'>
                {getPaymentPlanTitle(selectedPlan)} - Preview
              </DialogTitle>
              <DialogDescription className='text-base'>
                {getPaymentPlanDescription(selectedPlan)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-6'>
          <AdminLikePlanPreview
            selectedPlan={selectedPlan}
            feeStructure={feeStructure}
            cohortStartDate={cohortData?.start_date || new Date().toISOString().split('T')[0]}
            cohortId={cohortData?.id || ''}
            selectedScholarshipId={studentScholarship?.scholarship_id || 'no_scholarship'}
            studentId={studentData?.id}
            studentScholarship={studentScholarship}
          />
        </div>

        <DialogFooter className='flex gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isSubmitting}>
            <X className='h-4 w-4 mr-2' />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || !selectedPlan || !feeStructure}
            className='min-w-[140px]'
          >
            {isSubmitting ? (
              'Confirming...'
            ) : (
              <>
                Select Payment Plan
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
