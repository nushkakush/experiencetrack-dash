import React from 'react';
import { Upload } from 'lucide-react';

export interface FileUploadFieldProps {
  fieldName: string;
  label: string;
  description: string;
  acceptedTypes: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  fieldName,
  label,
  description,
  acceptedTypes,
  file,
  onFileChange
}) => {
  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <input
          type="file"
          accept={acceptedTypes}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="hidden"
          id={fieldName}
        />
        <label htmlFor={fieldName} className="cursor-pointer text-primary hover:underline">
          {file ? file.name : description}
        </label>
      </div>
    </div>
  );
};
