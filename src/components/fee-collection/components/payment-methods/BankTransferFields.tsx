import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { FileUploadField } from '@/components/common/payments/FileUploadField';
import { INDIAN_BANKS } from '@/components/fee-collection/constants';

interface BankTransferFieldsProps {
  paymentReferenceType: string;
  paymentReferenceNumber: string;
  transferDate: string;
  bankName: string;
  bankBranch: string;
  proofOfPaymentFile: File | null;
  onPaymentReferenceTypeChange: (value: string) => void;
  onPaymentReferenceNumberChange: (value: string) => void;
  onTransferDateChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onBankBranchChange: (value: string) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
}

export const BankTransferFields: React.FC<BankTransferFieldsProps> = ({
  paymentReferenceType,
  paymentReferenceNumber,
  transferDate,
  bankName,
  bankBranch,
  proofOfPaymentFile,
  onPaymentReferenceTypeChange,
  onPaymentReferenceNumberChange,
  onTransferDateChange,
  onBankNameChange,
  onBankBranchChange,
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
          <Label htmlFor="payment-reference-type" className="text-left block">Payment Reference Type *</Label>
          <Select value={paymentReferenceType} onValueChange={onPaymentReferenceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select reference type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transaction_id">Transaction ID</SelectItem>
              <SelectItem value="reference_number">Reference Number</SelectItem>
              <SelectItem value="utr_number">UTR Number</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-reference-number" className="text-left block">Payment Reference Number *</Label>
          <Input
            id="payment-reference-number"
            value={paymentReferenceNumber}
            onChange={(e) => onPaymentReferenceNumberChange(e.target.value)}
            placeholder="Enter reference number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transfer-date" className="text-left block">Transfer Date *</Label>
          <Input
            id="transfer-date"
            type="date"
            value={transferDate}
            onChange={(e) => onTransferDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-name" className="text-left block">Bank Name *</Label>
          <Select value={bankName} onValueChange={onBankNameChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_BANKS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bank-branch" className="text-left block">Bank Branch *</Label>
          <Input
            id="bank-branch"
            value={bankBranch}
            onChange={(e) => onBankBranchChange(e.target.value)}
            placeholder="Enter bank branch"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-left block">Upload Proof of Payment *</Label>
          <FileUploadField
            fieldName="proof-upload"
            label="Proof of Payment"
            description="Upload proof of payment document"
            acceptedTypes=".pdf,.jpg,.jpeg,.png"
            file={proofOfPaymentFile}
            onFileChange={onProofOfPaymentFileChange}
          />
        </div>
      </div>
    </div>
  );
};
