import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FileUploadField } from './FileUploadField';
import { PaymentModeConfig } from '@/features/payments/domain/PaymentModeConfig';
import { CreditCard } from 'lucide-react';
import { BankSelect } from './BankSelect';
import { 
  PaymentDetails,
  FormErrors
} from '@/types/components/PaymentFormTypes';

interface PaymentFieldRendererProps {
  config: PaymentModeConfig;
  paymentDetails: PaymentDetails;
  uploadedFiles: Record<string, File | null>;
  errors: FormErrors;
  onFieldChange: (fieldName: string, value: string | number | boolean) => void;
  onFileUpload: (fieldName: string, file: File | null) => void;
}

export const PaymentFieldRenderer = React.memo<PaymentFieldRendererProps>(({
  config,
  paymentDetails,
  uploadedFiles,
  errors,
  onFieldChange,
  onFileUpload
}) => {
  // Render custom components
  const renderCustomComponent = () => {
    // Check if this is scan_to_pay mode by looking at the config fields
    const isScanToPay = config.fields.some(field => field.name === 'payerUpiId') && 
                       config.fileUploads.some(upload => upload.name === 'scanToPayScreenshot');
    
    if (isScanToPay) {
      const SCAN_QR_IMAGE_URL = 'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/payment-modes/qr%20code.jpeg';
      console.info('[PaymentFieldRenderer] Rendering scan_to_pay QR code');
      
      return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm mb-2">Scan this QR to pay</h4>
          <div className="mt-2 p-4 bg-background rounded-lg border text-center">
            <img
              src={SCAN_QR_IMAGE_URL}
              alt="Scan to Pay QR code"
              loading="lazy"
              className="mx-auto rounded-md shadow-sm border w-56 h-56 object-contain bg-white"
              onLoad={() => {
                console.info('[PaymentFieldRenderer] Scan to Pay QR image loaded');
              }}
              onError={(e) => {
                console.error('[PaymentFieldRenderer] Scan to Pay QR image failed to load');
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-56 h-56 mx-auto flex items-center justify-center bg-gray-100 rounded-lg';
                  fallback.innerHTML = '<span class="text-xs text-gray-500">QR Code unavailable</span>';
                  parent.appendChild(fallback);
                }
              }}
            />
            <p className="text-xs text-muted-foreground mt-2">Open your UPI app and scan the QR</p>
          </div>
        </div>
      );
    }
    
    if (config.ui?.customComponent === 'QRCodeDisplay') {
      return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium text-sm">UPI QR Code</h4>
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500">QR Code Placeholder</p>
                <p className="text-xs text-gray-400">UPI: 9632121920@ibl</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Alert Message */}
      {config.ui?.alert && (
        <Alert>
          <config.ui.alert.icon className="h-4 w-4" />
          <AlertDescription>
            {config.ui.alert.description}
          </AlertDescription>
        </Alert>
      )}

      {/* Custom Component */}
      {renderCustomComponent()}

      {/* Form Fields */}
      {config.fields.length > 0 && (
        <div className="space-y-4">
          {config.fields.map((field) => {
            // Render different field types
            if (field.type === 'select' && field.name === 'bankName') {
              return (
                <BankSelect
                  key={field.name}
                  value={paymentDetails[field.name] || ''}
                  onValueChange={(value) => onFieldChange(field.name, value)}
                  label={field.label}
                  placeholder={field.placeholder}
                  required={field.required}
                  error={errors[field.name]}
                />
              );
            }
            
            return (
              <div key={field.name}>
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={paymentDetails[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className={errors[field.name] ? 'border-red-500' : ''}
                />
                {errors[field.name] && (
                  <p className="text-sm text-red-500 mt-1">{errors[field.name]}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File Upload Fields */}
      {config.fileUploads.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">
              {config.ui?.customComponent === 'QRCodeDisplay' ? 'Proof of Payment' : 'Proof of Payment'}
            </h4>
            {config.fileUploads.map((fileUpload) => (
              <FileUploadField
                key={fileUpload.name}
                fieldName={fileUpload.name}
                label={fileUpload.label}
                description={fileUpload.description}
                acceptedTypes={fileUpload.acceptedTypes}
                required={fileUpload.required}
                value={uploadedFiles[fileUpload.name] || null}
                onChange={onFileUpload}
                error={errors[fileUpload.name]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

PaymentFieldRenderer.displayName = 'PaymentFieldRenderer';
