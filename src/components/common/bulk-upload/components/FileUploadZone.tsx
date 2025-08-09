import { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  isDragOver: boolean;
  onDragOver: (isDragOver: boolean) => void;
  onFileSelect: (file: File) => void;
  fileType: string;
  fileExtension: string;
  isProcessing: boolean;
}

export const FileUploadZone = ({
  isDragOver,
  onDragOver,
  onFileSelect,
  fileType,
  fileExtension,
  isProcessing,
}: FileUploadZoneProps) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onDragOver, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(true);
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragOver(false);
    }
  }, [onDragOver]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-gray-300",
        isProcessing && "pointer-events-none opacity-50"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-gray-100">
        {isProcessing ? (
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        ) : (
          <FileSpreadsheet className="w-6 h-6 text-gray-600" />
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isProcessing ? 'Processing file...' : `Drop your ${fileType} file here`}
        </p>
        <p className="text-xs text-gray-500">or</p>
        
        <div className="flex items-center justify-center">
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              disabled={isProcessing}
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                Choose File
              </span>
            </Button>
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept={fileExtension}
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />
        </div>
        
        <p className="text-xs text-gray-500">
          Supports {fileType} files ({fileExtension})
        </p>
      </div>
    </div>
  );
};
