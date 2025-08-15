import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { FileUploadField } from '@/components/common/payments/FileUploadField';
import { BankSelect } from '@/components/common/payments/BankSelect';

interface BankTransferFieldsProps {
  paymentDate: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  transactionId: string;
  proofOfPaymentFile: File | null;
  onPaymentDateChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onBankBranchChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onTransactionIdChange: (value: string) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
}

export const BankTransferFields: React.FC<BankTransferFieldsProps> = ({
  paymentDate,
  bankName,
  bankBranch,
  accountNumber,
  transactionId,
  proofOfPaymentFile,
  onPaymentDateChange,
  onBankNameChange,
  onBankBranchChange,
  onAccountNumberChange,
  onTransactionIdChange,
  onProofOfPaymentFileChange
}) => {
  return (
    <div className="space-y-6">
      {/* LIT School Bank Details */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5" />
            LIT School Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Account Holder</p>
            <p className="font-medium text-foreground">Disruptive Edu Private Limited</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bank Name</p>
            <p className="font-medium text-foreground">HDFC Bank Limited</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Account Number</p>
            <p className="font-medium text-foreground">50200082405270</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Branch & IFSC</p>
            <p className="font-medium text-foreground">Sadashivanagar & HDFC0001079</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-date" className="text-left block">Payment Date *</Label>
          <Input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => onPaymentDateChange(e.target.value)}
          />
        </div>

        <BankSelect
          value={bankName}
          onValueChange={onBankNameChange}
          label="Select Bank"
          placeholder="Select bank"
          required={true}
        />

        <div className="space-y-2">
          <Label htmlFor="bank-branch" className="text-left block">Branch Name *</Label>
          <Input
            id="bank-branch"
            value={bankBranch}
            onChange={(e) => onBankBranchChange(e.target.value)}
            placeholder="Enter branch name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-number" className="text-left block">Account Number *</Label>
          <Input
            id="account-number"
            value={accountNumber}
            onChange={(e) => onAccountNumberChange(e.target.value)}
            placeholder="Enter account number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="utr-number" className="text-left block">UTR Number *</Label>
          <Input
            id="utr-number"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value)}
            placeholder="Enter UTR number"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-left block">Bank Transfer Screenshot/Acknowledgement Receipt *</Label>
          <FileUploadField
            fieldName="proof-of-payment"
            label="Bank Transfer Screenshot/Acknowledgement Receipt"
            description="Upload screenshot or acknowledgement receipt of your bank transfer"
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
            file={proofOfPaymentFile}
            onFileChange={onProofOfPaymentFileChange}
          />
        </div>
      </div>
    </div>
  );
};
