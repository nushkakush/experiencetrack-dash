import React from 'react';
import { Label } from '@/components/ui/label';
import { QrCode } from 'lucide-react';
import { FileUploadField } from '../FileUploadField';

interface ScanToPayFieldsProps {
  transactionScreenshotFile: File | null;
  onTransactionScreenshotFileChange: (file: File | null) => void;
}

export const ScanToPayFields: React.FC<ScanToPayFieldsProps> = ({
  transactionScreenshotFile,
  onTransactionScreenshotFileChange
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50">
        <h4 className="font-semibold mb-2">QR Code Payment Details</h4>
        <div className="space-y-2 text-sm">
          <p><strong>UPI ID:</strong> lit.school@hdfc</p>
          <p><strong>Bank:</strong> HDFC Bank</p>
          <p><strong>Account:</strong> LIT School</p>
        </div>
        <div className="mt-4 p-4 bg-white rounded-lg border text-center">
          <div className="w-32 h-32 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
            <QrCode className="h-16 w-16 text-gray-400" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">QR Code will be displayed here</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-left block">Upload Transaction Screenshot *</Label>
        <FileUploadField
          fieldName="screenshot-upload"
          label="Transaction Screenshot"
          description="Upload screenshot of your UPI payment"
          acceptedTypes=".jpg,.jpeg,.png"
          file={transactionScreenshotFile}
          onFileChange={onTransactionScreenshotFileChange}
        />
      </div>
    </div>
  );
};
