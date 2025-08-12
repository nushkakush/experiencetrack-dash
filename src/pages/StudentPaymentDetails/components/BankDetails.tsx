/**
 * Bank Details Component
 * Extracted from StudentPaymentDetails.tsx to improve maintainability
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, QrCode } from 'lucide-react';

export const BankDetails: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bank Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Bank Name:</strong> HDFC Bank</p>
            <p><strong>Account Name:</strong> LIT School</p>
            <p><strong>Account Number:</strong> 1234567890</p>
            <p><strong>IFSC Code:</strong> HDFC0001234</p>
            <p><strong>Branch:</strong> Main Branch</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Payment System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>UPI ID:</strong> litschool@hdfc</p>
            <p><strong>QR Code:</strong> Available at office</p>
            <p><strong>Payment Gateway:</strong> Razorpay</p>
            <p><strong>Support:</strong> +91 98765 43210</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
