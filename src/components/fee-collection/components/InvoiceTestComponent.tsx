import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, CheckCircle } from 'lucide-react';
import { InvoiceUploadDialog } from './student-details/InvoiceUploadDialog';
import { useInvoiceManagement } from './student-details/hooks/useInvoiceManagement';
import { useAuth } from '@/hooks/useAuth';

interface InvoiceTestComponentProps {
  paymentTransactionId: string;
  studentId: string;
  cohortId: string;
  paymentStatus: string;
}

export const InvoiceTestComponent: React.FC<InvoiceTestComponentProps> = ({
  paymentTransactionId,
  studentId,
  cohortId,
  paymentStatus,
}) => {
  const { profile } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const {
    invoice,
    loading: invoiceLoading,
    downloading,
    downloadInvoice,
    refreshInvoice,
  } = useInvoiceManagement({
    paymentTransactionId,
    studentId,
  });

  const isPaid = paymentStatus === 'paid' || paymentStatus === 'waived';
  const canManageInvoices =
    profile?.role === 'fee_collector' || profile?.role === 'super_admin';

  if (!isPaid) {
    return (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-lg'>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant='secondary' className='mb-2'>
            {paymentStatus}
          </Badge>
          <p className='text-sm text-muted-foreground'>
            Invoice upload is only available for paid payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle className='text-lg'>Invoice Management</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Payment Status</span>
          <Badge variant='default' className='bg-green-100 text-green-800'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Paid
          </Badge>
        </div>

        {invoiceLoading ? (
          <div className='text-center py-4'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
            <p className='text-sm text-muted-foreground mt-2'>
              Loading invoice...
            </p>
          </div>
        ) : invoice ? (
          <div className='space-y-3'>
            <div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
              <FileText className='h-5 w-5 text-primary' />
              <div className='flex-1'>
                <p className='text-sm font-medium'>
                  {invoice.invoice_file_name}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Uploaded on{' '}
                  {new Date(invoice.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={downloadInvoice}
                disabled={downloading}
                className='flex-1'
                size='sm'
              >
                <Download className='h-4 w-4 mr-2' />
                {downloading ? 'Downloading...' : 'Download Invoice'}
              </Button>
            </div>
          </div>
        ) : (
          <div className='text-center py-4'>
            <FileText className='h-8 w-8 text-muted-foreground mx-auto mb-2' />
            <p className='text-sm text-muted-foreground mb-3'>
              No invoice uploaded yet
            </p>
            {canManageInvoices && (
              <Button onClick={() => setShowUploadDialog(true)} size='sm'>
                <Upload className='h-4 w-4 mr-2' />
                Upload Invoice
              </Button>
            )}
          </div>
        )}

        {/* Invoice Upload Dialog */}
        <InvoiceUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          paymentTransactionId={paymentTransactionId}
          studentId={studentId}
          cohortId={cohortId}
          onInvoiceUploaded={refreshInvoice}
        />
      </CardContent>
    </Card>
  );
};
