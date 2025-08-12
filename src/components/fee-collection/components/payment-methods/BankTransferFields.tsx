import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploadField } from '../FileUploadField';
import { INDIAN_BANKS } from '../../constants';

interface BankTransferFieldsProps {
  paymentReferenceType: 'cheque_no' | 'utr_no';
  paymentReferenceNumber: string;
  transferDate: string;
  bankName: string;
  bankBranch: string;
  proofOfPaymentFile: File | null;
  onPaymentReferenceTypeChange: (type: 'cheque_no' | 'utr_no') => void;
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-left block">Payment Reference Type *</Label>
        <RadioGroup 
          value={paymentReferenceType} 
          onValueChange={(value: 'cheque_no' | 'utr_no') => onPaymentReferenceTypeChange(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="utr_no" id="utr_no" />
            <Label htmlFor="utr_no">UTR Number</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cheque_no" id="cheque_no" />
            <Label htmlFor="cheque_no">Cheque Number</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference-number" className="text-left block">
          {paymentReferenceType === 'utr_no' ? 'UTR Number' : 'Cheque Number'} *
        </Label>
        <Input
          id="reference-number"
          value={paymentReferenceNumber}
          onChange={(e) => onPaymentReferenceNumberChange(e.target.value)}
          placeholder={`Enter ${paymentReferenceType === 'utr_no' ? 'UTR' : 'Cheque'} number`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-date" className="text-left block">Date of Transfer *</Label>
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
  );
};
