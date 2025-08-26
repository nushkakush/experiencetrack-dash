import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';
import { paymentInvoiceService } from '@/services/paymentInvoice.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InvoiceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentTransactionId: string;
  studentId: string;
  cohortId: string;
  onInvoiceUploaded: () => void;
}

export const InvoiceUploadDialog: React.FC<InvoiceUploadDialogProps> = ({
  open,
  onOpenChange,
  paymentTransactionId,
  studentId,
  cohortId,
  onInvoiceUploaded,
}) => {
  const { profile } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  // Check if invoice exists when dialog opens
  React.useEffect(() => {
    if (open && paymentTransactionId) {
      const checkExistingInvoice = async () => {
        try {
          const existingInvoice =
            await paymentInvoiceService.getByTransactionId(
              paymentTransactionId
            );
          setIsReplacing(existingInvoice.success && !!existingInvoice.data);
        } catch (error) {
          console.error('Error checking existing invoice:', error);
          setIsReplacing(false);
        }
      };
      checkExistingInvoice();
    }
  }, [open, paymentTransactionId]);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a PDF, JPEG, or PNG file');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.user_id) {
      toast.error('Please select a file to upload');
      return;
    }

    // Debug logging
    console.log('🔍 [InvoiceUploadDialog] Upload Debug:', {
      selectedFile: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileType: selectedFile?.type,
      paymentTransactionId,
      studentId,
      cohortId,
      uploadedBy: profile?.user_id,
      isReplacing,
    });

    setUploading(true);
    try {
      let result;
      if (isReplacing) {
        // Invoice exists, use replace method
        console.log('🔍 [InvoiceUploadDialog] Replacing existing invoice...');
        result = await paymentInvoiceService.replaceInvoice(
          selectedFile,
          paymentTransactionId,
          studentId,
          cohortId,
          profile.user_id
        );
      } else {
        // No existing invoice, use regular upload method
        console.log('🔍 [InvoiceUploadDialog] Creating new invoice...');
        result = await paymentInvoiceService.uploadInvoice(
          selectedFile,
          paymentTransactionId,
          studentId,
          cohortId,
          profile.user_id
        );
      }

      if (result.success) {
        const message = isReplacing
          ? 'Invoice replaced successfully'
          : 'Invoice uploaded successfully';
        toast.success(message);
        console.log(
          '🔍 [InvoiceUploadDialog] Upload completed successfully:',
          result.data
        );
        setSelectedFile(null);
        onOpenChange(false);
        onInvoiceUploaded();
      } else {
        console.error('Upload failed:', result.error);
        toast.error(result.error || 'Failed to upload invoice');
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to upload invoice: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isReplacing ? 'Replace Invoice' : 'Upload Invoice'}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {isReplacing && (
            <div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded-md'>
              An invoice already exists for this payment. Uploading a new file
              will replace the existing one.
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className='space-y-2'>
                <FileText className='mx-auto h-8 w-8 text-primary' />
                <div className='text-sm font-medium'>{selectedFile.name}</div>
                <div className='text-xs text-muted-foreground'>
                  {formatFileSize(selectedFile.size)}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRemoveFile}
                  className='mt-2'
                >
                  <X className='h-4 w-4 mr-1' />
                  Remove
                </Button>
              </div>
            ) : (
              <div className='space-y-2'>
                <Upload className='mx-auto h-8 w-8 text-muted-foreground' />
                <div className='text-sm font-medium'>
                  Drop your invoice file here, or click to browse
                </div>
                <div className='text-xs text-muted-foreground'>
                  PDF, JPEG, or PNG files up to 10MB
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => document.getElementById('file-input')?.click()}
                  className='mt-2'
                >
                  <Upload className='h-4 w-4 mr-1' />
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <Input
            id='file-input'
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            onChange={handleFileInputChange}
            className='hidden'
          />

          <div className='flex justify-end space-x-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className='min-w-[100px]'
            >
              {uploading
                ? isReplacing
                  ? 'Replacing...'
                  : 'Uploading...'
                : isReplacing
                  ? 'Replace'
                  : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
