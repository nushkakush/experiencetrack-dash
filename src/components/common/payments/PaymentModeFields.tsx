import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CreditCard } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { BankSelect } from './BankSelect';
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

  const handleFileUpload = (fieldName: string, file: File | null) => {
    if (file) {
      onFileUpload(fieldName, file);
    } else {
      onRemoveFile(fieldName);
    }
  };

  switch (paymentMode) {
    case 'bank_transfer':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={String(paymentDetails.paymentDate ?? '')}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
            />
          </div>
          <BankSelect
            value={String(paymentDetails.bankName ?? '')}
            onValueChange={(value) => handleFieldChange('bankName', value)}
            label="Select Bank"
            placeholder="Select bank"
          />
          <div>
            <Label htmlFor="bankBranch">Branch Name *</Label>
            <Input
              id="bankBranch"
              placeholder="Enter branch name"
              value={String(paymentDetails.bankBranch ?? '')}
              onChange={(e) => handleFieldChange('bankBranch', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={String(paymentDetails.accountNumber ?? '')}
              onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="transactionId">UTR Number *</Label>
            <Input
              id="transactionId"
              placeholder="Enter UTR number"
              value={String(paymentDetails.transactionId ?? '')}
              onChange={(e) => handleFieldChange('transactionId', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="bankTransferScreenshot"
              label="Bank Transfer Screenshot/Acknowledgement Receipt"
              description="Upload screenshot or acknowledgement receipt of your bank transfer"
              acceptedTypes="image/*,.pdf"
              value={uploadedFiles['bankTransferScreenshot'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'cash':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={String(paymentDetails.paymentDate ?? '')}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="cashAcknowledgment"
              label="Payment Acknowledgement"
              description="Upload the payment acknowledgement document"
              acceptedTypes="image/*,.pdf"
              value={uploadedFiles['cashAcknowledgment'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'cheque':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={String(paymentDetails.paymentDate ?? '')}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
            />
          </div>
          <BankSelect
            value={String(paymentDetails.bankName ?? '')}
            onValueChange={(value) => handleFieldChange('bankName', value)}
            label="Select Bank"
            placeholder="Select bank"
          />
          <div>
            <Label htmlFor="bankBranch">Branch Name *</Label>
            <Input
              id="bankBranch"
              placeholder="Enter branch name"
              value={String(paymentDetails.bankBranch ?? '')}
              onChange={(e) => handleFieldChange('bankBranch', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={String(paymentDetails.accountNumber ?? '')}
              onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="chequeNumber">Cheque Number *</Label>
            <Input
              id="chequeNumber"
              placeholder="Enter cheque number"
              value={String(paymentDetails.chequeNumber ?? '')}
              onChange={(e) => handleFieldChange('chequeNumber', e.target.value)}
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
              value={uploadedFiles['chequeImage'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
            <FileUploadField
              fieldName="chequeAcknowledgment"
              label="Cheque Acknowledgment"
              description="Upload bank acknowledgment for cheque deposit"
              acceptedTypes="image/*,.pdf"
              value={uploadedFiles['chequeAcknowledgment'] ?? null}
              onChange={handleFileUpload}
              required={true}
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
        </div>
      );

    case 'scan_to_pay':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="qrCode">UPI QR Code *</Label>
            <Input
              id="qrCode"
              placeholder="Enter UPI QR Code"
              value={String(paymentDetails.qrCode ?? '')}
              onChange={(e) => handleFieldChange('qrCode', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={String(paymentDetails.paymentDate ?? '')}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="payerUpiId">Payer UPI ID *</Label>
            <Input
              id="payerUpiId"
              placeholder="Enter payer UPI ID"
              value={String(paymentDetails.payerUpiId ?? '')}
              onChange={(e) => handleFieldChange('payerUpiId', e.target.value)}
            />
          </div>
          
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Proof of Payment</h4>
            <FileUploadField
              fieldName="scanToPayScreenshot"
              label="UPI Payment Screenshot"
              description="Upload screenshot of your UPI payment"
              acceptedTypes="image/*"
              value={uploadedFiles['scanToPayScreenshot'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
};
