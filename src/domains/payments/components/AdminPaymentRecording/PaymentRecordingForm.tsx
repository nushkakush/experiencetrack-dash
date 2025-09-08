/**
 * Payment Recording Form Component
 * Handles payment data input and validation
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  AlertTriangle,
  Upload,
  X,
} from 'lucide-react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { FileUploadField } from '@/components/common/payments/FileUploadField';
import { BankSelect } from '@/components/common/payments/BankSelect';
import { formatCurrency } from '@/utils/formatCurrency';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface PaymentRecordingData {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  paymentTime: string; // New field for payment time
  transactionId?: string;
  notes?: string;
  receipt?: File;
  // DD-specific fields
  ddNumber?: string;
  ddBankName?: string;
  ddBranch?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
}

interface PaymentRecordingFormProps {
  studentId: string;
  studentName: string;
  outstandingAmount: number;
  onSubmit: (data: PaymentRecordingData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PaymentRecordingForm: React.FC<PaymentRecordingFormProps> =
  React.memo(
    ({
      studentId,
      studentName,
      outstandingAmount,
      onSubmit,
      onCancel,
      loading = false,
      disabled = false,
    }) => {
      const [formData, setFormData] = useState<PaymentRecordingData>({
        amount: 0,
        paymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentTime: new Date().toTimeString().slice(0, 5), // Default to current time (HH:MM)
        transactionId: '',
        notes: '',
        // DD-specific fields
        ddNumber: '',
        ddBankName: '',
        ddBranch: '',
      });

      const [errors, setErrors] = useState<Record<string, string>>({});
      const [receipt, setReceipt] = useState<File | null>(null);

      const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        // Amount validation
        if (!formData.amount || formData.amount <= 0) {
          newErrors.amount = 'Amount must be greater than 0';
        } else if (formData.amount > outstandingAmount) {
          newErrors.amount = `Amount cannot exceed outstanding amount of ${formatCurrency(outstandingAmount)}`;
        }

        // Payment method validation
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Payment method is required';
        }

        // Payment proof validation - only required field for admin
        if (!receipt) {
          newErrors.receipt = 'Payment proof is required';
        }

        // Optional validations - only validate if fields are provided
        if (formData.paymentDate) {
          const paymentDate = new Date(formData.paymentDate);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          if (paymentDate > today) {
            newErrors.paymentDate = 'Payment date cannot be in the future';
          }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }, [formData, outstandingAmount, receipt]);

      const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
          e.preventDefault();

          if (!validateForm()) {
            return;
          }

          await onSubmit({
            ...formData,
            receipt: receipt || undefined,
          });
        },
        [formData, receipt, validateForm, onSubmit]
      );

      const updateFormData = useCallback(
        (updates: Partial<PaymentRecordingData>) => {
          setFormData(prev => ({ ...prev, ...updates }));

          // Clear related errors when field is updated
          const newErrors = { ...errors };
          Object.keys(updates).forEach(key => {
            if (newErrors[key]) {
              delete newErrors[key];
            }
          });
          setErrors(newErrors);
        },
        [errors]
      );

      const handleReceiptUpload = useCallback((file: File | null) => {
        setReceipt(file);
      }, []);

      const isFormValid =
        Object.keys(errors).length === 0 &&
        formData.amount > 0 &&
        formData.paymentMethod &&
        receipt;

      return (
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Student Info */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex items-center gap-2'>
                <DollarSign className='h-5 w-5' />
                Record Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <Label className='text-muted-foreground'>Student</Label>
                  <div className='flex items-center gap-2 font-medium'>
                    <UserAvatar
                      avatarUrl={null}
                      name={studentName}
                      size='sm'
                      userId={studentId}
                    />
                    {studentName}
                  </div>
                </div>
                <div>
                  <Label className='text-muted-foreground'>
                    Outstanding Amount
                  </Label>
                  <div className='font-medium text-red-600'>
                    {formatCurrency(outstandingAmount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Amount */}
              <div className='space-y-2'>
                <Label htmlFor='amount'>
                  Payment Amount <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  placeholder='Enter payment amount'
                  value={formData.amount || ''}
                  onChange={e =>
                    updateFormData({ amount: parseFloat(e.target.value) || 0 })
                  }
                  disabled={disabled}
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <div className='text-sm text-red-600 flex items-center gap-1'>
                    <AlertTriangle className='h-3 w-3' />
                    {errors.amount}
                  </div>
                )}
                {formData.amount > 0 &&
                  formData.amount <= outstandingAmount && (
                    <div className='text-sm text-green-600'>
                      Remaining after payment:{' '}
                      {formatCurrency(outstandingAmount - formData.amount)}
                    </div>
                  )}
              </div>

              {/* Payment Method */}
              <div className='space-y-2'>
                <Label>
                  Payment Method <span className='text-red-500'>*</span>
                </Label>
                <PaymentMethodSelector
                  value={formData.paymentMethod}
                  onChange={method => updateFormData({ paymentMethod: method })}
                  disabled={disabled}
                  error={errors.paymentMethod}
                />
              </div>

              {/* Payment Date and Time */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='paymentDate'>Payment Date (Optional)</Label>
                  <Input
                    id='paymentDate'
                    type='date'
                    value={formData.paymentDate}
                    onChange={e =>
                      updateFormData({ paymentDate: e.target.value })
                    }
                    disabled={disabled}
                    max={new Date().toISOString().split('T')[0]}
                    className={errors.paymentDate ? 'border-red-500' : ''}
                  />
                  {errors.paymentDate && (
                    <div className='text-sm text-red-600 flex items-center gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      {errors.paymentDate}
                    </div>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='paymentTime'>Payment Time (Optional)</Label>
                  <Input
                    id='paymentTime'
                    type='time'
                    value={formData.paymentTime}
                    onChange={e =>
                      updateFormData({ paymentTime: e.target.value })
                    }
                    disabled={disabled}
                    className={errors.paymentTime ? 'border-red-500' : ''}
                  />
                  {errors.paymentTime && (
                    <div className='text-sm text-red-600 flex items-center gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      {errors.paymentTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction ID (conditional) */}
              {['bank_transfer', 'upi', 'card', 'razorpay'].includes(
                formData.paymentMethod
              ) && (
                <div className='space-y-2'>
                  <Label htmlFor='transactionId'>
                    UTR/Transaction ID (Optional)
                  </Label>
                  <Input
                    id='transactionId'
                    type='text'
                    placeholder='Enter UTR/Transaction ID'
                    value={formData.transactionId || ''}
                    onChange={e =>
                      updateFormData({ transactionId: e.target.value })
                    }
                    disabled={disabled}
                    className={errors.transactionId ? 'border-red-500' : ''}
                  />
                  {errors.transactionId && (
                    <div className='text-sm text-red-600 flex items-center gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      {errors.transactionId}
                    </div>
                  )}
                </div>
              )}

              {/* DD-specific fields (conditional) */}
              {formData.paymentMethod === 'dd' && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='ddNumber'>DD Number (Optional)</Label>
                    <Input
                      id='ddNumber'
                      type='text'
                      placeholder='Enter DD number'
                      value={formData.ddNumber || ''}
                      onChange={e =>
                        updateFormData({ ddNumber: e.target.value })
                      }
                      disabled={disabled}
                      className={errors.ddNumber ? 'border-red-500' : ''}
                    />
                    {errors.ddNumber && (
                      <div className='text-sm text-red-600 flex items-center gap-1'>
                        <AlertTriangle className='h-3 w-3' />
                        {errors.ddNumber}
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <BankSelect
                      value={formData.ddBankName || ''}
                      onValueChange={value =>
                        updateFormData({ ddBankName: value })
                      }
                      label='Issuing Bank (Optional)'
                      placeholder='Select issuing bank'
                      required={false}
                      error={errors.ddBankName}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='ddBranch'>Issuing Branch (Optional)</Label>
                    <Input
                      id='ddBranch'
                      type='text'
                      placeholder='Enter issuing branch'
                      value={formData.ddBranch || ''}
                      onChange={e =>
                        updateFormData({ ddBranch: e.target.value })
                      }
                      disabled={disabled}
                      className={errors.ddBranch ? 'border-red-500' : ''}
                    />
                    {errors.ddBranch && (
                      <div className='text-sm text-red-600 flex items-center gap-1'>
                        <AlertTriangle className='h-3 w-3' />
                        {errors.ddBranch}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes (Optional)</Label>
                <Textarea
                  id='notes'
                  placeholder='Add any additional notes about this payment'
                  value={formData.notes || ''}
                  onChange={e => updateFormData({ notes: e.target.value })}
                  disabled={disabled}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                Payment Proof <span className='text-red-500'>*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadField
                fieldName='receipt'
                label='Payment Proof'
                description='Upload payment receipt or proof of payment'
                acceptedTypes='image/*,.pdf'
                required={true}
                value={receipt}
                onChange={(fieldName, file) => handleReceiptUpload(file)}
              />
              {errors.receipt && (
                <div className='text-sm text-red-600 flex items-center gap-1 mt-2'>
                  <AlertTriangle className='h-3 w-3' />
                  {errors.receipt}
                </div>
              )}
              {receipt && (
                <div className='mt-2 flex items-center gap-2 text-sm'>
                  <FileText className='h-4 w-4' />
                  <span>{receipt.name}</span>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => handleReceiptUpload(null)}
                    disabled={disabled}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className='flex justify-between pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={!isFormValid || loading || disabled}
              className='min-w-32'
            >
              {loading ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2' />
                  Recording...
                </>
              ) : (
                <>
                  <CreditCard className='h-4 w-4 mr-2' />
                  Record Payment
                </>
              )}
            </Button>
          </div>

          {/* Form Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Please fix the following errors before submitting:
                <ul className='mt-2 list-disc list-inside'>
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </form>
      );
    }
  );

PaymentRecordingForm.displayName = 'PaymentRecordingForm';
