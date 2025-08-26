import { useState, useEffect, useCallback } from 'react';
import {
  paymentInvoiceService,
  PaymentInvoiceRow,
} from '@/services/paymentInvoice.service';
import { toast } from 'sonner';

interface UseInvoiceManagementProps {
  paymentTransactionId: string;
  studentId?: string;
}

export const useInvoiceManagement = ({
  paymentTransactionId,
  studentId,
}: UseInvoiceManagementProps) => {
  const [invoice, setInvoice] = useState<PaymentInvoiceRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch invoice for the payment transaction
  const fetchInvoice = useCallback(async () => {
    if (!paymentTransactionId || paymentTransactionId === '') {
      console.log(
        '🔍 [useInvoiceManagement] No paymentTransactionId provided or empty string'
      );
      setInvoice(null);
      return;
    }

    console.log(
      '🔍 [useInvoiceManagement] Fetching invoice for transaction:',
      paymentTransactionId
    );
    setLoading(true);
    try {
      const result =
        await paymentInvoiceService.getByTransactionId(paymentTransactionId);
      console.log('🔍 [useInvoiceManagement] Fetch result:', result);
      if (result.success) {
        setInvoice(result.data);
        console.log('🔍 [useInvoiceManagement] Invoice set:', result.data);
      } else {
        console.error('Failed to fetch invoice:', result.error);
        setInvoice(null);
        // Don't show error toast for missing invoices as that's normal
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setInvoice(null);
      toast.error('Failed to fetch invoice data');
    } finally {
      setLoading(false);
    }
  }, [paymentTransactionId]);

  // Download invoice
  const downloadInvoice = useCallback(async () => {
    if (!invoice) {
      toast.error('No invoice available to download');
      return;
    }

    setDownloading(true);
    try {
      console.log(
        '🔍 [useInvoiceManagement] Starting download for invoice:',
        invoice.id
      );
      const result = await paymentInvoiceService.downloadInvoice(invoice.id);

      if (result.success && result.data) {
        // Create download link
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = invoice.invoice_file_name.split('/').pop() || 'invoice';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Invoice downloaded successfully');
        console.log(
          '🔍 [useInvoiceManagement] Download completed successfully'
        );
      } else {
        console.error('Download failed:', result.error);
        toast.error(result.error || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [invoice]);

  // Delete invoice
  const deleteInvoice = useCallback(async () => {
    if (!invoice) {
      toast.error('No invoice available to delete');
      return;
    }

    try {
      console.log(
        '🔍 [useInvoiceManagement] Starting delete for invoice:',
        invoice.id
      );
      const result = await paymentInvoiceService.deleteInvoice(invoice.id);

      if (result.success) {
        setInvoice(null);
        toast.success('Invoice deleted successfully');
        console.log('🔍 [useInvoiceManagement] Delete completed successfully');
      } else {
        console.error('Delete failed:', result.error);
        toast.error(result.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice. Please try again.');
    }
  }, [invoice]);

  // Refresh invoice data
  const refreshInvoice = useCallback(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Initial fetch
  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    loading,
    downloading,
    downloadInvoice,
    deleteInvoice,
    refreshInvoice,
  };
};
