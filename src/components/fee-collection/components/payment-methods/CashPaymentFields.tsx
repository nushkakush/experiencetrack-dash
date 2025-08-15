import React from 'react';
import { Label } from '@/components/ui/label';
import { FileUploadField } from '../FileUploadField';

interface CashPaymentFieldsProps {
  receiptFile: File | null;
  onReceiptFileChange: (file: File | null) => void;
}

export const CashPaymentFields: React.FC<CashPaymentFieldsProps> = ({
  receiptFile,
  onReceiptFileChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-left block">Payment Acknowledgement *</Label>
      <FileUploadField
        fieldName="receipt-upload"
        label="Payment Acknowledgement"
        description="Upload the payment acknowledgement document"
        acceptedTypes=".pdf,.jpg,.jpeg,.png"
        file={receiptFile}
        onFileChange={onReceiptFileChange}
      />
    </div>
  );
};
