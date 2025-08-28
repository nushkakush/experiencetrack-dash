import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Building2 } from 'lucide-react';
import { FileUploadField } from './FileUploadField';
import { BankSelect } from './BankSelect';
import {
  PaymentDetails,
  FormErrors,
} from '@/types/components/PaymentFormTypes';
import { logger } from '@/lib/logging/Logger';

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
  errors,
}) => {
  const [scanQrError, setScanQrError] = React.useState(false);
  const SCAN_QR_IMAGE_URL =
    'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/payment-modes/qr%20code.jpeg';

  // Log component mount and payment mode changes
  React.useEffect(() => {
    console.info('[PaymentModeFields] Component mounted/updated', {
      paymentMode,
    });
    logger.info('PaymentModeFields component rendered', { paymentMode });
  });

  const handleFieldChange = (fieldName: string, value: string) => {
    onPaymentDetailsChange({
      ...paymentDetails,
      [fieldName]: value,
    });
  };

  React.useEffect(() => {
    if (paymentMode === 'scan_to_pay') {
      logger.info('Scan to Pay selected UI rendering', {
        component: 'PaymentModeFields',
        timestamp: new Date().toISOString(),
      });
      // Also emit a console for quick visibility
      console.info('[ScanToPay] Selected - rendering QR section');
    }
  }, [paymentMode]);

  const handleFileUpload = (fieldName: string, file: File | null) => {
    if (file) {
      onFileUpload(fieldName, file);
    } else {
      onRemoveFile(fieldName);
    }
  };

  console.info(
    '[PaymentModeFields] About to render payment mode:',
    paymentMode
  );
  logger.info('PaymentModeFields rendering payment mode', { paymentMode });

  switch (paymentMode) {
    case 'bank_transfer':
      return (
        <div className='space-y-4'>
          {/* Bank Account Details Card */}
          <Card className='border-border bg-card'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-foreground'>
                <Building2 className='h-5 w-5' />
                Bank Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Account Holder
                  </p>
                  <p className='font-medium text-foreground'>
                    DISRUPTIVE EDU PRIVATE LIMITED
                  </p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Account Number
                  </p>
                  <p className='font-medium text-foreground'>50200082405270</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>IFSC Code</p>
                  <p className='font-medium text-foreground'>HDFC0001079</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Branch</p>
                  <p className='font-medium text-foreground'>SADASHIVANAGAR</p>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Account Type</p>
                  <p className='font-medium text-foreground'>CURRENT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='paymentDate'>Payment Date *</Label>
              <Input
                id='paymentDate'
                type='date'
                value={String(paymentDetails.paymentDate ?? '')}
                onChange={e => handleFieldChange('paymentDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='paymentTime'>Payment Time *</Label>
              <Input
                id='paymentTime'
                type='time'
                value={String(paymentDetails.paymentTime ?? '')}
                onChange={e => handleFieldChange('paymentTime', e.target.value)}
              />
            </div>
          </div>
          <BankSelect
            value={String(paymentDetails.bankName ?? '')}
            onValueChange={value => handleFieldChange('bankName', value)}
            label='Select Bank'
            placeholder='Select bank'
          />
          <div>
            <Label htmlFor='bankBranch'>Branch Name *</Label>
            <Input
              id='bankBranch'
              placeholder='Enter branch name'
              value={String(paymentDetails.bankBranch ?? '')}
              onChange={e => handleFieldChange('bankBranch', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='accountNumber'>Account Number *</Label>
            <Input
              id='accountNumber'
              placeholder='Enter account number'
              value={String(paymentDetails.accountNumber ?? '')}
              onChange={e => handleFieldChange('accountNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='transactionId'>UTR Number *</Label>
            <Input
              id='transactionId'
              placeholder='Enter UTR number'
              value={String(paymentDetails.transactionId ?? '')}
              onChange={e => handleFieldChange('transactionId', e.target.value)}
            />
          </div>

          <Separator />
          <div className='space-y-4'>
            <h4 className='font-medium text-sm'>Proof of Payment</h4>
            <FileUploadField
              fieldName='bankTransferScreenshot'
              label='Bank Transfer Screenshot/Acknowledgement Receipt'
              description='Upload screenshot or acknowledgement receipt of your bank transfer'
              acceptedTypes='image/*,.pdf'
              value={uploadedFiles['bankTransferScreenshot'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'cash':
      return (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='paymentDate'>Payment Date *</Label>
              <Input
                id='paymentDate'
                type='date'
                value={String(paymentDetails.paymentDate ?? '')}
                onChange={e => handleFieldChange('paymentDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='paymentTime'>Payment Time *</Label>
              <Input
                id='paymentTime'
                type='time'
                value={String(paymentDetails.paymentTime ?? '')}
                onChange={e => handleFieldChange('paymentTime', e.target.value)}
              />
            </div>
          </div>

          <Separator />
          <div className='space-y-4'>
            <h4 className='font-medium text-sm'>Proof of Payment</h4>
            <FileUploadField
              fieldName='cashAcknowledgment'
              label='Payment Acknowledgement'
              description='Upload the payment acknowledgement document'
              acceptedTypes='image/*,.pdf'
              value={uploadedFiles['cashAcknowledgment'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'cheque':
      return (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='paymentDate'>Payment Date *</Label>
              <Input
                id='paymentDate'
                type='date'
                value={String(paymentDetails.paymentDate ?? '')}
                onChange={e => handleFieldChange('paymentDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='paymentTime'>Payment Time *</Label>
              <Input
                id='paymentTime'
                type='time'
                value={String(paymentDetails.paymentTime ?? '')}
                onChange={e => handleFieldChange('paymentTime', e.target.value)}
              />
            </div>
          </div>
          <BankSelect
            value={String(paymentDetails.bankName ?? '')}
            onValueChange={value => handleFieldChange('bankName', value)}
            label='Select Bank'
            placeholder='Select bank'
          />
          <div>
            <Label htmlFor='bankBranch'>Branch Name *</Label>
            <Input
              id='bankBranch'
              placeholder='Enter branch name'
              value={String(paymentDetails.bankBranch ?? '')}
              onChange={e => handleFieldChange('bankBranch', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='accountNumber'>Account Number *</Label>
            <Input
              id='accountNumber'
              placeholder='Enter account number'
              value={String(paymentDetails.accountNumber ?? '')}
              onChange={e => handleFieldChange('accountNumber', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor='chequeNumber'>Cheque Number *</Label>
            <Input
              id='chequeNumber'
              placeholder='Enter cheque number'
              value={String(paymentDetails.chequeNumber ?? '')}
              onChange={e => handleFieldChange('chequeNumber', e.target.value)}
            />
          </div>

          <Separator />
          <div className='space-y-4'>
            <h4 className='font-medium text-sm'>Proof of Payment</h4>
            <FileUploadField
              fieldName='chequeImage'
              label='Cheque Image'
              description='Upload front and back images of the cheque'
              acceptedTypes='image/*'
              value={uploadedFiles['chequeImage'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
            <FileUploadField
              fieldName='chequeAcknowledgment'
              label='Cheque Acknowledgment'
              description='Upload bank acknowledgment for cheque deposit'
              acceptedTypes='image/*,.pdf'
              value={uploadedFiles['chequeAcknowledgment'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'razorpay':
      return (
        <div className='space-y-4'>
          <Alert>
            <CreditCard className='h-4 w-4' />
            <AlertDescription>
              You will be redirected to Razorpay for secure online payment
              processing.
            </AlertDescription>
          </Alert>
        </div>
      );

    case 'scan_to_pay':
      console.info('[PaymentModeFields] Rendering scan_to_pay case');
      logger.info('PaymentModeFields rendering scan_to_pay case');
      return (
        <div className='space-y-4'>
          {/* Static QR for Scan to Pay */}
          <div className='p-4 border rounded-lg bg-muted/50'>
            <h4 className='font-medium text-sm mb-2'>Scan this QR to pay</h4>
            <div className='mt-2 p-4 bg-background rounded-lg border text-center'>
              {scanQrError ? (
                <div className='w-56 h-56 mx-auto bg-muted rounded-lg flex items-center justify-center'>
                  <span className='text-xs text-muted-foreground'>
                    QR unavailable
                  </span>
                </div>
              ) : (
                <img
                  src={SCAN_QR_IMAGE_URL}
                  alt='Scan to Pay QR code'
                  loading='lazy'
                  className='mx-auto rounded-md shadow-sm border w-56 h-56 object-contain bg-white'
                  onLoad={() => {
                    logger.info('Scan to Pay QR image loaded', {
                      src: SCAN_QR_IMAGE_URL,
                    });
                    console.info('[ScanToPay] QR image loaded');
                  }}
                  onError={() => {
                    setScanQrError(true);
                    logger.error('Scan to Pay QR image failed to load', {
                      src: SCAN_QR_IMAGE_URL,
                    });
                    console.error('[ScanToPay] QR image failed to load');
                  }}
                />
              )}
              <p className='text-xs text-muted-foreground mt-2'>
                Open your UPI app and scan the QR
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor='qrCode'>UPI QR Code *</Label>
            <Input
              id='qrCode'
              placeholder='Enter UPI QR Code'
              value={String(paymentDetails.qrCode ?? '')}
              onChange={e => handleFieldChange('qrCode', e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='paymentDate'>Payment Date *</Label>
              <Input
                id='paymentDate'
                type='date'
                value={String(paymentDetails.paymentDate ?? '')}
                onChange={e => handleFieldChange('paymentDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='paymentTime'>Payment Time *</Label>
              <Input
                id='paymentTime'
                type='time'
                value={String(paymentDetails.paymentTime ?? '')}
                onChange={e => handleFieldChange('paymentTime', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor='payerUpiId'>Payer UPI ID *</Label>
            <Input
              id='payerUpiId'
              placeholder='Enter payer UPI ID'
              value={String(paymentDetails.payerUpiId ?? '')}
              onChange={e => handleFieldChange('payerUpiId', e.target.value)}
            />
          </div>

          <Separator />
          <div className='space-y-4'>
            <h4 className='font-medium text-sm'>Proof of Payment</h4>
            <FileUploadField
              fieldName='scanToPayScreenshot'
              label='UPI Payment Screenshot'
              description='Upload screenshot of your UPI payment'
              acceptedTypes='image/*'
              value={uploadedFiles['scanToPayScreenshot'] ?? null}
              onChange={handleFileUpload}
              required={true}
            />
          </div>
        </div>
      );

    case 'dd':
      console.log('🔍 [PaymentModeFields] Rendering DD case');
      return (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='paymentDate'>Payment Date *</Label>
              <Input
                id='paymentDate'
                type='date'
                value={String(paymentDetails.paymentDate ?? '')}
                onChange={e => handleFieldChange('paymentDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor='paymentTime'>Payment Time *</Label>
              <Input
                id='paymentTime'
                type='time'
                value={String(paymentDetails.paymentTime ?? '')}
                onChange={e => handleFieldChange('paymentTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor='ddNumber'>DD Number *</Label>
            <Input
              id='ddNumber'
              placeholder='Enter DD number'
              value={String(paymentDetails.ddNumber ?? '')}
              onChange={e => handleFieldChange('ddNumber', e.target.value)}
            />
          </div>

          <BankSelect
            value={String(paymentDetails.ddBankName ?? '')}
            onValueChange={value => handleFieldChange('ddBankName', value)}
            label='Issuing Bank'
            placeholder='Select issuing bank'
          />
          {console.log(
            '🔍 [PaymentModeFields] BankSelect rendered for DD with value:',
            paymentDetails.ddBankName
          )}

          <div>
            <Label htmlFor='ddBranch'>Issuing Branch *</Label>
            <Input
              id='ddBranch'
              placeholder='Enter issuing branch'
              value={String(paymentDetails.ddBranch ?? '')}
              onChange={e => handleFieldChange('ddBranch', e.target.value)}
            />
          </div>

          <Separator />
          <div className='space-y-4'>
            <h4 className='font-medium text-sm'>Proof of Payment</h4>
            <FileUploadField
              fieldName='ddReceipt'
              label='DD Receipt'
              description='Upload the DD receipt as proof of payment'
              acceptedTypes='image/*,.pdf'
              value={uploadedFiles['ddReceipt'] ?? null}
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
