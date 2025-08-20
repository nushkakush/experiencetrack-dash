import React from 'react';
import { Upload, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BulkUploadConfig } from './types';
import { BulkAttendanceUpload, BulkAttendanceConfig } from './types/attendance';
import { BulkAttendanceService } from './services/attendanceService';
import BulkUploadDialog from './BulkUploadDialog';

interface BulkAttendanceUploadDialogProps {
  config: BulkAttendanceConfig;
  onSuccess?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function BulkAttendanceUploadDialog({
  config,
  onSuccess,
  children,
  disabled = false,
}: BulkAttendanceUploadDialogProps) {
  const validateAttendanceRow = (
    data: Record<string, unknown>,
    row: number
  ): string[] => {
    return BulkAttendanceService.validateAttendanceRow(data, row);
  };

  const processValidAttendance = async (
    data: BulkAttendanceUpload[],
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string }> => {
    return BulkAttendanceService.processValidAttendance(
      data,
      config,
      duplicateHandling
    );
  };

  const checkDuplicateAttendance = async (
    data: BulkAttendanceUpload[]
  ): Promise<
    Array<{
      data: BulkAttendanceUpload;
      row: number;
      existingData?: Record<string, unknown>;
    }>
  > => {
    return BulkAttendanceService.checkDuplicateAttendance(data, config);
  };

  const bulkUploadConfig: BulkUploadConfig<BulkAttendanceUpload> = {
    requiredHeaders: [
      'student_email',
      'session_date',
      'session_number',
      'status',
    ],
    optionalHeaders: ['reason', 'absence_type'],
    validateRow: validateAttendanceRow,
    processValidData: processValidAttendance,
    checkDuplicates: checkDuplicateAttendance,
    templateData: () => BulkAttendanceService.generateTemplateData(config),
    dialogTitle: 'Bulk Import Epic Attendance',
    dialogDescription: `Upload a CSV file to mark attendance for the entire epic from ${new Date(config.startDate).toLocaleDateString()} to ${new Date(config.endDate).toLocaleDateString()}. Download the template below for the correct format.`,
    fileType: 'CSV',
    fileExtension: '.csv',
  };

  const defaultTrigger = (
    <Button variant='outline' className='gap-2' disabled={disabled}>
      <Upload className='w-4 h-4' />
      Bulk Import Attendance
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
