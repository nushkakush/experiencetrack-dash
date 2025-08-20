import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Upload } from 'lucide-react';
import BulkUploadDialog from './BulkUploadDialog';
import { BulkUploadConfig } from './types';
import { BulkPaymentPlanUpload } from '@/types/payments/BulkUploadTypes';
import { BulkPaymentPlanUploadService } from '@/services/bulkUpload/bulkPaymentPlanUpload.service';
import { toast } from 'sonner';

interface BulkPaymentPlanUploadDialogProps {
  cohortId: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
  enableCustomDates?: boolean;
}

export default function BulkPaymentPlanUploadDialog({ 
  cohortId, 
  onSuccess,
  children,
  enableCustomDates = false
}: BulkPaymentPlanUploadDialogProps) {
  
  const validatePaymentPlanRow = (data: Record<string, string>, row: number): string[] => {
    return BulkPaymentPlanUploadService.validatePaymentPlanRow(data, row);
  };

  const checkDuplicatePaymentPlans = async (data: BulkPaymentPlanUpload[]) => {
    return await BulkPaymentPlanUploadService.checkDuplicatePaymentPlans(data, cohortId);
  };

  const processValidPaymentPlans = async (
    data: BulkPaymentPlanUpload[], 
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await BulkPaymentPlanUploadService.processPaymentPlanUpload(
        data,
        {
          cohortId,
          allowOverwrite: duplicateHandling === 'overwrite',
          sendNotifications: true,
          customDateValidation: enableCustomDates
        },
        duplicateHandling
      );

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      return { success: result.success, message: result.message };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment plans';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const getOptionalHeaders = () => {
    const headers: string[] = [];
    if (enableCustomDates) {
      headers.push('custom_dates');
    }
    return headers;
  };

  const bulkUploadConfig: BulkUploadConfig<BulkPaymentPlanUpload> = {
    requiredHeaders: ['student_email', 'payment_plan'],
    optionalHeaders: getOptionalHeaders(),
    validateRow: validatePaymentPlanRow,
    processValidData: processValidPaymentPlans,
    checkDuplicates: checkDuplicatePaymentPlans,
    templateData: BulkPaymentPlanUploadService.generateTemplateData(),
    dialogTitle: "Bulk Import Payment Plans",
    dialogDescription: `Upload a CSV file to assign payment plans to multiple students at once. ${enableCustomDates ? 'Custom payment dates are supported.' : ''} Download the template below for the correct format.`,
    fileType: "CSV",
    fileExtension: ".csv"
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <CreditCard className="w-4 h-4" />
      Bulk Import Payment Plans
    </Button>
  );

  return (
    <BulkUploadDialog
      config={bulkUploadConfig}
      trigger={children || defaultTrigger}
      onSuccess={onSuccess}
    />
  );
}
