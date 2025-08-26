import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghmpaghyasyllfvamfna.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTransactionInstallment() {
  try {
    console.log(
      '🔧 Fixing existing transaction with installment information...'
    );

    // Find the transaction with reference_number "312312312312312"
    const { data: transaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('reference_number', '312312312312312')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching transaction:', fetchError);
      return;
    }

    if (!transaction) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('✅ Found transaction:', {
      id: transaction.id,
      amount: transaction.amount,
      reference_number: transaction.reference_number,
      installment_id: transaction.installment_id,
      semester_number: transaction.semester_number,
    });

    // Update the transaction with installment information
    // Based on the amount (26550.00), this looks like it's for semester 1
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        installment_id: '1-1', // Semester 1, Installment 1
        semester_number: 1,
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('❌ Error updating transaction:', updateError);
      return;
    }

    console.log(
      '✅ Successfully updated transaction with installment information'
    );

    // Verify the update
    const { data: updatedTransaction, error: verifyError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transaction.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('✅ Updated transaction:', {
      id: updatedTransaction.id,
      amount: updatedTransaction.amount,
      reference_number: updatedTransaction.reference_number,
      installment_id: updatedTransaction.installment_id,
      semester_number: updatedTransaction.semester_number,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixTransactionInstallment();
