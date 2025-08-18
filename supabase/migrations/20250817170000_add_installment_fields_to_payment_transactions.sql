-- Add installment identification fields to payment_transactions table
-- This allows tracking which specific installment a payment is for

-- Add installment_id column to track specific installment
ALTER TABLE payment_transactions 
ADD COLUMN installment_id TEXT NULL;

-- Add semester_number column to track semester-based payments  
ALTER TABLE payment_transactions 
ADD COLUMN semester_number INTEGER NULL;

-- Add comments for documentation
COMMENT ON COLUMN payment_transactions.installment_id IS 'ID of the specific installment this payment is for (for installment-wise payments)';
COMMENT ON COLUMN payment_transactions.semester_number IS 'Semester number this payment is for (for semester-wise payments)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_installment_id ON payment_transactions(installment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_semester_number ON payment_transactions(semester_number);
