import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CreditCard, 
  Building2, 
  FileText
} from 'lucide-react';
import { PaymentModeFields } from './PaymentModeFields';
import { 
  PaymentDetails,
  FormErrors
} from '@/types/components/PaymentFormTypes';

export interface PaymentModeSelectorProps {
  selectedPaymentMode: string;
  onPaymentModeChange: (mode: string) => void;
  paymentDetails: PaymentDetails;
  onPaymentDetailsChange: (details: PaymentDetails) => void;
  uploadedFiles: Record<string, File>;
  onFileUpload: (fieldName: string, file: File) => void;
  onRemoveFile: (fieldName: string) => void;
  errors: FormErrors;
}

export const PaymentModeSelector: React.FC<PaymentModeSelectorProps> = ({
  selectedPaymentMode,
  onPaymentModeChange,
  paymentDetails,
  onPaymentDetailsChange,
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
  errors
}) => {
  const handlePaymentModeChange = (mode: string) => {
    onPaymentModeChange(mode);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="paymentMode">Payment Mode</Label>
        <Select value={selectedPaymentMode} onValueChange={handlePaymentModeChange}>
          <SelectTrigger className={errors.paymentMode ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank_transfer">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bank Transfer
              </div>
            </SelectItem>
            <SelectItem value="cash">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cash
              </div>
            </SelectItem>
            <SelectItem value="cheque">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cheque
              </div>
            </SelectItem>
            <SelectItem value="scan_to_pay">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Scan to Pay (UPI)
              </div>
            </SelectItem>
            <SelectItem value="razorpay">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Online Payment (Razorpay)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.paymentMode && (
          <p className="text-sm text-red-500 mt-1">{errors.paymentMode}</p>
        )}
      </div>

      {/* Payment Mode Specific Fields */}
      {selectedPaymentMode && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium">Payment Details</h4>
          <PaymentModeFields
            paymentMode={selectedPaymentMode}
            paymentDetails={paymentDetails}
            onPaymentDetailsChange={onPaymentDetailsChange}
            uploadedFiles={uploadedFiles}
            onFileUpload={onFileUpload}
            onRemoveFile={onRemoveFile}
            errors={errors}
          />
        </div>
      )}
    </div>
  );
};
