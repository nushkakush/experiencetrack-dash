/**
 * Payment Submission Form
 * Reusable component for payment submission across the application
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentSubmissionData } from '@/types/payments';
import { getPaymentMethodConfig } from '@/types/payments';
import { toast } from 'sonner';
import { BankSelect } from './BankSelect';

interface PaymentSubmissionFormProps {
  paymentId: string;
  amount: number;
  availableMethods: string[];
  onSubmit: (data: PaymentSubmissionData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const PaymentSubmissionForm: React.FC<PaymentSubmissionFormProps> = ({
  paymentId,
  amount,
  availableMethods,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<PaymentSubmissionData>>({
    paymentId,
    amount,
    paymentMethod: availableMethods[0] || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentTime: new Date().toTimeString().slice(0, 5), // HH:MM format
    transferDate: new Date().toISOString().split('T')[0],
    transferTime: new Date().toTimeString().slice(0, 5) // HH:MM format
  });

  const [files, setFiles] = useState<{
    receiptFile?: File;
    proofOfPaymentFile?: File;
    transactionScreenshotFile?: File;
  }>({});

  const handleInputChange = (field: keyof PaymentSubmissionData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof typeof files, file: File | undefined) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const methodConfig = getPaymentMethodConfig(formData.paymentMethod);
    
    if (methodConfig.requiresReference && !formData.referenceNumber) {
      toast.error('Reference number is required for this payment method');
      return;
    }

    if (methodConfig.requiresFile && !files.receiptFile && !files.proofOfPaymentFile) {
      toast.error('Proof of payment is required for this payment method');
      return;
    }

    try {
      await onSubmit({
        ...formData as PaymentSubmissionData,
        ...files
      });
      toast.success('Payment submitted successfully');
    } catch (error) {
      toast.error('Failed to submit payment');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map(method => {
                  const config = getPaymentMethodConfig(method);
                  return (
                    <SelectItem key={method} value={method}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Reference Number */}
          {formData.paymentMethod && getPaymentMethodConfig(formData.paymentMethod).requiresReference && (
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber || ''}
                onChange={(e) => handleInputChange('referenceNumber', e.target.value)}
                placeholder="Enter reference number"
                required
              />
            </div>
          )}

          {/* Bank Details for Bank Transfer */}
          {formData.paymentMethod === 'bank_transfer' && (
            <>
              <BankSelect
                value={formData.bankName || ''}
                onValueChange={(value) => handleInputChange('bankName', value)}
                label="Bank Name"
                placeholder="Select bank"
                required={true}
              />
              <div className="space-y-2">
                <Label htmlFor="bankBranch">Bank Branch</Label>
                <Input
                  id="bankBranch"
                  value={formData.bankBranch || ''}
                  onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                  placeholder="Enter bank branch"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transferDate">Transfer Date</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={formData.transferDate || ''}
                    onChange={(e) => handleInputChange('transferDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferTime">Transfer Time</Label>
                  <Input
                    id="transferTime"
                    type="time"
                    value={formData.transferTime || ''}
                    onChange={(e) => handleInputChange('transferTime', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* File Uploads */}
          {(formData.paymentMethod && getPaymentMethodConfig(formData.paymentMethod).requiresFile) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="receiptFile">Receipt</Label>
                <Input
                  id="receiptFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('receiptFile', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proofOfPaymentFile">Proof of Payment</Label>
                <Input
                  id="proofOfPaymentFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange('proofOfPaymentFile', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionScreenshotFile">Transaction Screenshot</Label>
                <Input
                  id="transactionScreenshotFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('transactionScreenshotFile', e.target.files?.[0])}
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Payment'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
