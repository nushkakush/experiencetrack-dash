import React from 'react';
import { Button } from '@/components/ui/button';
import { PaymentMethod, PaymentSubmission } from '@/types/payments/StudentPaymentDetailsTypes';

interface PaymentFormProps {
  paymentId: string;
  paymentSubmissions: Map<string, PaymentSubmission>;
  submittingPayments: Set<string>;
  paymentMethods: PaymentMethod[];
  onPaymentMethodChange: (paymentId: string, method: string) => void;
  onAmountChange: (paymentId: string, amount: number) => void;
  onReceiptUpload: (paymentId: string, file: File) => void;
  onNotesChange: (paymentId: string, notes: string) => void;
  onSubmitPayment: (paymentId: string) => void;
  canSubmitPayment: (paymentId: string) => boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentId,
  paymentSubmissions,
  submittingPayments,
  paymentMethods,
  onPaymentMethodChange,
  onAmountChange,
  onReceiptUpload,
  onNotesChange,
  onSubmitPayment,
  canSubmitPayment
}) => {
  const submission = paymentSubmissions.get(paymentId);

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h4 className="font-semibold text-lg">Submit Payment</h4>
      
      {/* Payment Method Selection */}
      <div>
        <label className="text-sm font-medium">Select Your Payment Method *</label>
        <select 
          className="w-full mt-2 p-3 border rounded-lg bg-background"
          value={submission?.paymentMethod || ''}
          onChange={(e) => onPaymentMethodChange(paymentId, e.target.value)}
        >
          <option value="">Choose payment method</option>
          {paymentMethods.map((method, idx) => (
            <option key={idx} value={method.name}>
              {method.name} - {method.description}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Input */}
      <div>
        <label className="text-sm font-medium">Amount Paid (₹) *</label>
        <div className="relative mt-2">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            ₹
          </span>
          <input
            type="number"
            className="w-full pl-8 pr-3 py-3 border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter amount paid"
            value={submission?.amount || ''}
            onChange={(e) => onAmountChange(paymentId, parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Receipt Upload */}
      <div>
        <label className="text-sm font-medium">Upload Receipt (Optional)</label>
        <input
          type="file"
          className="w-full mt-2 p-3 border rounded-lg bg-background"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReceiptUpload(paymentId, file);
          }}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium">Notes (Optional)</label>
        <textarea
          className="w-full mt-2 p-3 border rounded-lg bg-background resize-none"
          rows={3}
          placeholder="Add any additional notes"
          value={submission?.notes || ''}
          onChange={(e) => onNotesChange(paymentId, e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <Button
        className="w-full"
        disabled={!canSubmitPayment(paymentId) || submittingPayments.has(paymentId)}
        onClick={() => onSubmitPayment(paymentId)}
      >
        {submittingPayments.has(paymentId) ? 'Submitting...' : 'Submit Payment'}
      </Button>
    </div>
  );
};
