import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import { FileUploadField } from '@/components/common/payments/FileUploadField';
import { BankSelect } from '@/components/common/payments/BankSelect';

interface DDFieldsProps {
  paymentDate: string;
  paymentTime: string;
  ddNumber: string;
  ddBankName: string;
  ddBranch: string;
  proofOfPaymentFile: File | null;
  onPaymentDateChange: (value: string) => void;
  onPaymentTimeChange: (value: string) => void;
  onDDNumberChange: (value: string) => void;
  onDDBankNameChange: (value: string) => void;
  onDDBranchChange: (value: string) => void;
  onProofOfPaymentFileChange: (file: File | null) => void;
}

export const DDFields: React.FC<DDFieldsProps> = ({
  paymentDate,
  paymentTime,
  ddNumber,
  ddBankName,
  ddBranch,
  proofOfPaymentFile,
  onPaymentDateChange,
  onPaymentTimeChange,
  onDDNumberChange,
  onDDBankNameChange,
  onDDBranchChange,
  onProofOfPaymentFileChange,
}) => {
  console.log('🔍 [DDFields] Component rendered with:', {
    ddBankName,
    ddNumber,
    ddBranch,
  });

  return (
    <div className='space-y-6'>
      {/* LIT School Bank Details */}
      <Card className='border-border bg-card'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-foreground'>
            <Building2 className='h-5 w-5' />
            LIT School Bank Details (For DD)
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div>
            <p className='text-sm text-muted-foreground'>Account Holder</p>
            <p className='font-medium text-foreground'>
              Disruptive Edu Private Limited
            </p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Bank Name</p>
            <p className='font-medium text-foreground'>HDFC Bank Limited</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Account Number</p>
            <p className='font-medium text-foreground'>50200082405270</p>
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Branch & IFSC</p>
            <p className='font-medium text-foreground'>
              Sadashivanagar & HDFC0001079
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DD Form Fields */}
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='payment-date' className='text-left block'>
              DD Issue Date *
            </Label>
            <Input
              id='payment-date'
              type='date'
              value={paymentDate}
              onChange={e => onPaymentDateChange(e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='payment-time' className='text-left block'>
              DD Issue Time
            </Label>
            <Input
              id='payment-time'
              type='time'
              value={paymentTime}
              onChange={e => onPaymentTimeChange(e.target.value)}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='dd-number' className='text-left block'>
            DD Number *
          </Label>
          <Input
            id='dd-number'
            type='text'
            placeholder='Enter DD number'
            value={ddNumber}
            onChange={e => onDDNumberChange(e.target.value)}
          />
        </div>

        <BankSelect
          value={ddBankName}
          onValueChange={onDDBankNameChange}
          label='Issuing Bank *'
          placeholder='Select issuing bank'
        />
        {console.log(
          '🔍 [DDFields] BankSelect rendered with value:',
          ddBankName
        )}

        <div className='space-y-2'>
          <Label htmlFor='dd-branch' className='text-left block'>
            Issuing Branch *
          </Label>
          <Input
            id='dd-branch'
            type='text'
            placeholder='Enter issuing branch'
            value={ddBranch}
            onChange={e => onDDBranchChange(e.target.value)}
          />
        </div>

        <FileUploadField
          label='DD Receipt *'
          description='Upload the DD receipt/proof'
          file={proofOfPaymentFile}
          onFileChange={onProofOfPaymentFileChange}
          accept='.pdf,.jpg,.jpeg,.png'
        />
      </div>
    </div>
  );
};
