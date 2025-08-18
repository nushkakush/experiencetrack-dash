import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, DollarSign, FileText, CreditCard, QrCode } from 'lucide-react';

export interface PaymentModeSelectorProps {
  selectedPaymentMode: string;
  onPaymentModeChange: (mode: string) => void;
  paymentDetails: Record<string, any>;
  onPaymentDetailsChange: (details: Record<string, any>) => void;
  uploadedFiles: Record<string, File>;
  onFileUpload: (fieldName: string, file: File | null) => void;
  onRemoveFile: (fieldName: string) => void;
  errors: Record<string, string>;
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
    console.log('🔍 [DEBUG] PaymentModeSelector - handlePaymentModeChange called with mode:', mode);
    console.log('🔍 [DEBUG] PaymentModeSelector - current selectedPaymentMode:', selectedPaymentMode);
    onPaymentModeChange(mode);
    console.log('🔍 [DEBUG] PaymentModeSelector - onPaymentModeChange called');
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
                <QrCode className="h-4 w-4" />
                Scan to Pay (UPI)
              </div>
            </SelectItem>
            <SelectItem value="razorpay">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Online Payment
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.paymentMode && (
          <p className="text-sm text-red-500 mt-1">
            {errors.paymentMode}
          </p>
        )}
      </div>
    </div>
  );
};
