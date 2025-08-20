import { useCallback } from 'react';
import { toast } from 'sonner';
import { BulkUploadConfig, ValidationResult } from '../types';
import { CsvParser } from '../utils/csvParser';
import { useBulkUploadState } from './useBulkUploadState';

export const useBulkUpload = <T>(
  config: BulkUploadConfig<T>,
  onSuccess?: () => void
) => {
  const { state, actions } = useBulkUploadState();

  const parseFile = useCallback(
    async (file: File): Promise<ValidationResult<T>> => {
      const result = await CsvParser.parseFile<T>(
        file,
        {
          requiredHeaders: config.requiredHeaders,
          optionalHeaders: config.optionalHeaders,
        },
        config.validateRow
      );

      // Check for duplicates if function is provided
      if (config.checkDuplicates && result.valid.length > 0) {
        try {
          const duplicates = await config.checkDuplicates(result.valid);
          result.duplicates = duplicates;
        } catch (error) {
          console.error('Error checking duplicates:', error);
          // Continue without duplicate checking if it fails
        }
      }

      return result;
    },
    [config]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(config.fileExtension)) {
        toast.error(`Please upload a ${config.fileType} file`);
        return;
      }

      actions.setProcessing(true);
      actions.setFile(file);

      try {
        const result = await parseFile(file);
        actions.setValidationResult(result);
        actions.setStep('validate');

        if (result.valid.length === 0) {
          toast.error('No valid records found in the file');
        } else {
          toast.success(`Found ${result.valid.length} valid records`);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to parse file'
        );
        actions.reset();
      } finally {
        actions.setProcessing(false);
      }
    },
    [config, parseFile, actions]
  );

  const handleConfirmUpload = useCallback(async () => {
    if (!state.validationResult?.valid.length) {
      toast.error('No valid data to upload');
      return;
    }

    actions.setUploading(true);
    try {
      await config.processValidData(
        state.validationResult.valid,
        state.duplicateHandling
      );
      toast.success(
        `Successfully imported ${state.validationResult.valid.length} records`
      );
      actions.setOpen(false);
      actions.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading data:', error);
      toast.error('Failed to import data');
    } finally {
      actions.setUploading(false);
    }
  }, [
    state.validationResult,
    state.duplicateHandling,
    config,
    actions,
    onSuccess,
  ]);

  const downloadTemplate = useCallback(async () => {
    let templateData = config.templateData;

    // If templateData is a function, call it to get the data
    if (typeof config.templateData === 'function') {
      try {
        templateData = await config.templateData();
      } catch (error) {
        console.error('Error generating template data:', error);
        toast.error('Failed to generate template');
        return;
      }
    }

    CsvParser.downloadTemplate(
      {
        requiredHeaders: config.requiredHeaders,
        optionalHeaders: config.optionalHeaders,
      },
      `${config.dialogTitle.toLowerCase().replace(/\s+/g, '_')}_template${config.fileExtension}`,
      templateData
    );
  }, [config]);

  return {
    state,
    actions,
    handleFileUpload,
    handleConfirmUpload,
    downloadTemplate,
  };
};
