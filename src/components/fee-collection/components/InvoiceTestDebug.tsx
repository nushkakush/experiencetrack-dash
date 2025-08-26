import React from 'react';
import { Button } from '@/components/ui/button';
import { paymentInvoiceService } from '@/services/paymentInvoice.service';

export const InvoiceTestDebug: React.FC = () => {
  const testInvoiceFetch = async () => {
    console.log(
      '🔍 [InvoiceTestDebug] Testing invoice fetch for transaction: 62ae10c5-1df0-4c11-b9b2-559754f0fc63'
    );

    try {
      // Test direct Supabase query
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://ghmpaghyasyllfvamfna.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNzE3NjAsImV4cCI6MjA3MTc0Nzc2MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
      );

      const { data, error } = await supabase
        .from('payment_invoices')
        .select('*')
        .eq('payment_transaction_id', '62ae10c5-1df0-4c11-b9b2-559754f0fc63')
        .maybeSingle();

      console.log('🔍 [InvoiceTestDebug] Direct query result:', {
        data,
        error,
      });

      if (data) {
        console.log(
          '✅ [InvoiceTestDebug] Invoice found via direct query:',
          data
        );
      } else {
        console.log('❌ [InvoiceTestDebug] No invoice found via direct query');
      }

      // Test service method
      const result = await paymentInvoiceService.getByTransactionId(
        '62ae10c5-1df0-4c11-b9b2-559754f0fc63'
      );
      console.log('🔍 [InvoiceTestDebug] Service result:', result);

      if (result.success) {
        console.log(
          '✅ [InvoiceTestDebug] Invoice found via service:',
          result.data
        );
      } else {
        console.error(
          '❌ [InvoiceTestDebug] Failed to fetch invoice via service:',
          result.error
        );
      }
    } catch (error) {
      console.error('❌ [InvoiceTestDebug] Error:', error);
    }
  };

  return (
    <div className='p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20'>
      <h3 className='font-medium mb-2'>Invoice Debug Test</h3>
      <Button onClick={testInvoiceFetch} size='sm'>
        Test Invoice Fetch
      </Button>
    </div>
  );
};
