import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { 
  PaymentDetails,
  FormErrors
} from '@/types/components/PaymentFormTypes';

export interface PaymentModeFieldsProps {
  paymentMode: string;
  paymentDetails: PaymentDetails;
  onPaymentDetailsChange: (details: PaymentDetails) => void;
  uploadedFiles: Record<string, File>;
  onFileUpload: (fieldName: string, file: File) => void;
  onRemoveFile: (fieldName: string) => void;
  errors: FormErrors;
}

export const PaymentModeFields: React.FC<PaymentModeFieldsProps> = ({
  paymentMode,
  paymentDetails,
  onPaymentDetailsChange,
  uploadedFiles,
  onFileUpload,
  onRemoveFile,
  errors
}) => {
  const handleFieldChange = (fieldName: string, value: string) => {
    onPaymentDetailsChange({
      ...paymentDetails,
      [fieldName]: value
    });
  };

  switch (paymentMode) {
    case 'bank_transfer':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
            <Input
              id="transactionId"
              placeholder="Enter transaction ID"
              value={paymentDetails.transactionId || ''}
              onChange={(e) => handleFieldChange('transactionId', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="Enter bank name"
              value={paymentDetails.bankName || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transferDate">Transfer Date</Label>
            <Input
              id="transferDate"
              type="date"
              value={paymentDetails.transferDate || ''}
              onChange={(e) => handleFieldChange('transferDate', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="bankTransferScreenshot"
              label="Bank Transfer Screenshot/Receipt"
              description="Upload screenshot or receipt of your bank transfer"
              acceptedTypes="image/*,.pdf"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
            <FileUploadField
              fieldName="bankTransferAcknowledgment"
              label="Transfer Acknowledgment"
              description="Upload bank acknowledgment or confirmation"
              acceptedTypes="image/*,.pdf"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
          </div>
        </div>
      );

    case 'cash':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <Input
              id="receiptNumber"
              placeholder="Enter receipt number"
              value={paymentDetails.receiptNumber || ''}
              onChange={(e) => handleFieldChange('receiptNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDetails.paymentDate || ''}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="cashReceipt"
              label="Cash Payment Receipt"
              description="Upload the original cash payment receipt"
              acceptedTypes="image/*,.pdf"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
            <FileUploadField
              fieldName="cashAcknowledgment"
              label="Payment Acknowledgment"
              description="Upload any acknowledgment document"
              acceptedTypes="image/*,.pdf"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
          </div>
        </div>
      );

    case 'cheque':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="chequeNumber">Cheque Number</Label>
            <Input
              id="chequeNumber"
              placeholder="Enter cheque number"
              value={paymentDetails.chequeNumber || ''}
              onChange={(e) => handleFieldChange('chequeNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="Enter bank name"
              value={paymentDetails.bankName || ''}
              onChange={(e) => handleFieldChange('bankName', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="chequeDate">Cheque Date</Label>
            <Input
              id="chequeDate"
              type="date"
              value={paymentDetails.chequeDate || ''}
              onChange={(e) => handleFieldChange('chequeDate', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="chequeImage"
              label="Cheque Image"
              description="Upload front and back images of the cheque"
              acceptedTypes="image/*"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
            <FileUploadField
              fieldName="chequeAcknowledgment"
              label="Cheque Acknowledgment"
              description="Upload bank acknowledgment for cheque deposit"
              acceptedTypes="image/*,.pdf"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
          </div>
        </div>
      );

    case 'razorpay':
      return (
        <div className="space-y-4">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              You will be redirected to Razorpay for secure online payment processing.
            </AlertDescription>
          </Alert>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Payment Confirmation (Optional)</h4>
            <FileUploadField
              fieldName="razorpayReceipt"
              label="Payment Receipt"
              description="Upload Razorpay payment receipt (optional)"
              acceptedTypes="image/*,.pdf"
              required={false}
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
          </div>
        </div>
      );

    case 'scan_to_pay':
      return (
        <div className="space-y-4">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Scan the QR code below with your UPI application to make the payment.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium text-sm">UPI QR Code</h4>
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500">QR Code Placeholder</p>
                  <p className="text-xs text-gray-400">UPI: 9632121920@ibl</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
            </p>
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="scanToPayScreenshot"
              label="UPI Payment Screenshot"
              description="Upload screenshot of your UPI payment confirmation"
              acceptedTypes="image/*"
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
            <FileUploadField
              fieldName="scanToPayReceipt"
              label="Payment Receipt"
              description="Upload UPI payment receipt (optional)"
              acceptedTypes="image/*,.pdf"
              required={false}
              uploadedFiles={uploadedFiles}
              onFileUpload={onFileUpload}
              onRemoveFile={onRemoveFile}
              errors={errors}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
};
