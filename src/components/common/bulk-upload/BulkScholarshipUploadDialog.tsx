import React from 'react';
import { Button } from '@/components/ui/button';
import { Award, Upload } from 'lucide-react';
import BulkUploadDialog from './BulkUploadDialog';
import { BulkUploadConfig } from './types';
import { BulkScholarshipUpload } from '@/types/payments/BulkUploadTypes';
import { BulkScholarshipUploadService } from '@/services/bulkUpload/bulkScholarshipUpload.service';
import { toast } from 'sonner';

interface BulkScholarshipUploadDialogProps {
  cohortId: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export default function BulkScholarshipUploadDialog({ 
  cohortId, 
  onSuccess,
  children 
}: BulkScholarshipUploadDialogProps) {
  
  const validateScholarshipRow = (data: Record<string, string>, row: number): string[] => {
    return BulkScholarshipUploadService.validateScholarshipRow(data, row);
  };

  const checkDuplicateScholarships = async (data: BulkScholarshipUpload[]) => {
    return await BulkScholarshipUploadService.checkDuplicateScholarships(data, cohortId);
  };

  const processValidScholarships = async (
    data: BulkScholarshipUpload[], 
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await BulkScholarshipUploadService.processScholarshipUpload(
        data,
        {
          cohortId,
          allowOverwrite: duplicateHandling === 'overwrite',
          sendNotifications: true
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to process scholarships';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const bulkUploadConfig: BulkUploadConfig<BulkScholarshipUpload> = {
    requiredHeaders: ['student_email', 'scholarship_name'],
    optionalHeaders: ['additional_discount_percentage', 'description'],
    validateRow: validateScholarshipRow,
    processValidData: processValidScholarships,
    checkDuplicates: checkDuplicateScholarships,
    templateData: BulkScholarshipUploadService.generateTemplateData(),
    dialogTitle: "Bulk Import Scholarships",
    dialogDescription: "Upload a CSV file to assign scholarships to multiple students at once. Download the template below for the correct format.",
    fileType: "CSV",
    fileExtension: ".csv"
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Award className="w-4 h-4" />
      Bulk Import Scholarships
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
