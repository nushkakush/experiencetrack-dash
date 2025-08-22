/**
 * Payment Summary Component
 * Shows payment summary and confirmation details
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  FileText,
  User,
  DollarSign,
  Hash
} from 'lucide-react';
import { PaymentRecordingData } from './PaymentRecordingForm';
import { PAYMENT_METHODS } from './PaymentMethodSelector';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PaymentSummaryProps {
  studentName: string;
  paymentData: PaymentRecordingData;
  onConfirm: () => void;
  onEdit: () => void;
  loading?: boolean;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = React.memo(({
  studentName,
  paymentData,
  onConfirm,
  onEdit,
  loading = false,
}) => {
  const paymentMethod = PAYMENT_METHODS.find(method => method.id === paymentData.paymentMethod);
  const IconComponent = paymentMethod?.icon || CreditCard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Payment Summary</h3>
        <p className="text-sm text-muted-foreground">
          Please review the payment details before confirming
        </p>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Student
            </div>
            <div className="font-medium">{studentName}</div>
          </div>

          <Separator />

          {/* Amount */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Payment Amount</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(paymentData.amount)}
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconComponent className="h-4 w-4" />
              Payment Method
            </div>
            <div className="font-medium">{paymentMethod?.label}</div>
          </div>

          {/* Payment Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Payment Date
            </div>
            <div className="font-medium">{formatDate(paymentData.paymentDate)}</div>
          </div>

          {/* Transaction ID */}
          {paymentData.transactionId && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Transaction ID
              </div>
              <div className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {paymentData.transactionId}
              </div>
            </div>
          )}

          {/* Notes */}
          {paymentData.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
                <div className="text-sm bg-muted p-3 rounded">
                  {paymentData.notes}
                </div>
              </div>
            </>
          )}

          {/* Receipt */}
          {paymentData.receipt && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Receipt Attached
                </div>
                <Badge variant="outline" className="text-xs">
                  {paymentData.receipt.name}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="text-sm text-orange-800">
            <strong>Important:</strong> Once confirmed, this payment will be recorded in the system 
            and cannot be easily undone. Please ensure all details are correct.
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Edit Details
        </button>
        
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Recording...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Confirm Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
});

PaymentSummary.displayName = 'PaymentSummary';
