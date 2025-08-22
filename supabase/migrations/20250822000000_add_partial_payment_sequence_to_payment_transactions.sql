-- Add partial_payment_sequence column to payment_transactions table
-- This tracks the sequence number for partial payments within an installment

-- Add partial_payment_sequence column to track partial payment order
ALTER TABLE payment_transactions 
ADD COLUMN partial_payment_sequence INTEGER NULL DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN payment_transactions.partial_payment_sequence IS 'Sequence number for partial payments within an installment (1 = first payment, 2 = second payment, etc.)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_partial_payment_sequence ON payment_transactions(partial_payment_sequence);

-- Create a composite index for better performance when querying by installment and sequence
CREATE INDEX IF NOT EXISTS idx_payment_transactions_installment_sequence ON payment_transactions(installment_id, partial_payment_sequence);
