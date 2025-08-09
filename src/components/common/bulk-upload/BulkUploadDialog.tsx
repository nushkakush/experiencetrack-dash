import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkUploadConfig } from './types';
import { useBulkUpload } from './hooks/useBulkUpload';
import { FileUploadZone } from './components/FileUploadZone';
import { ValidationResults } from './components/ValidationResults';
import { DuplicateHandling } from './components/DuplicateHandling';

interface BulkUploadDialogProps<T> {
  config: BulkUploadConfig<T>;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export default function BulkUploadDialog<T>({ 
  config, 
  trigger, 
  onSuccess 
}: BulkUploadDialogProps<T>) {
  const {
    state,
    actions,
    handleFileUpload,
    handleConfirmUpload,
    downloadTemplate,
  } = useBulkUpload(config, onSuccess);

  const canProceed = state.validationResult?.valid.length > 0;
  const hasDuplicates = (state.validationResult?.duplicates?.length ?? 0) > 0;

  return (
    <Dialog open={state.isOpen} onOpenChange={actions.setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.dialogTitle}</DialogTitle>
          <DialogDescription>{config.dialogDescription}</DialogDescription>
        </DialogHeader>

        <Tabs value={state.currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={state.isProcessing}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={!state.validationResult}>
              Validate
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled={!canProceed}>
              Confirm
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Step 1: Upload File</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
              
              <FileUploadZone
                isDragOver={state.isDragOver}
                onDragOver={actions.setDragOver}
                onFileSelect={handleFileUpload}
                fileType={config.fileType}
                fileExtension={config.fileExtension}
                isProcessing={state.isProcessing}
              />
            </div>
          </TabsContent>

          <TabsContent value="validate" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Step 2: Review Results</h4>
              
              {state.validationResult && (
                <ValidationResults validationResult={state.validationResult} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="confirm" className="space-y-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Step 3: Confirm Import</h4>
              
              {hasDuplicates && (
                <DuplicateHandling
                  value={state.duplicateHandling}
                  onChange={actions.setDuplicateHandling}
                  duplicateCount={state.validationResult?.duplicates?.length ?? 0}
                />
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  Ready to import <strong>{state.validationResult?.valid.length}</strong> records.
                  {hasDuplicates && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {state.duplicateHandling === 'ignore' ? 'Duplicates will be skipped.' : 'Duplicates will be overwritten.'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              actions.setOpen(false);
              actions.reset();
            }}
            disabled={state.isUploading}
          >
            Cancel
          </Button>
          
          {state.currentStep === 'validate' && canProceed && (
            <Button onClick={() => actions.setStep('confirm')}>
              Continue
            </Button>
          )}
          
          {state.currentStep === 'confirm' && (
            <Button
              onClick={handleConfirmUpload}
              disabled={!canProceed || state.isUploading}
            >
              {state.isUploading ? 'Importing...' : 'Import Data'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
