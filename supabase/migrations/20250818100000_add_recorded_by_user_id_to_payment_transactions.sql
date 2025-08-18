-- Add recorded_by_user_id column to payment_transactions table
-- This tracks who initiated/recorded the payment (student vs admin/fee_collector)
-- This is separate from created_by which tracks the system user who created the record

-- Add recorded_by_user_id column to track who initiated the payment
ALTER TABLE payment_transactions 
ADD COLUMN recorded_by_user_id UUID NULL REFERENCES auth.users(id);

-- Add comments for documentation
COMMENT ON COLUMN payment_transactions.recorded_by_user_id IS 'User ID of who recorded/initiated the payment (student vs admin). Null for system-generated transactions.';
COMMENT ON COLUMN payment_transactions.created_by IS 'User ID of who created the transaction record in the system (typically system/service account)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_recorded_by_user_id ON payment_transactions(recorded_by_user_id);

-- Add a function to determine if payment was recorded by admin
CREATE OR REPLACE FUNCTION is_admin_recorded_payment(transaction_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recorder_role TEXT;
BEGIN
    -- Get the role of the user who recorded the payment
    SELECT 
        CASE 
            WHEN pt.recorded_by_user_id IS NULL THEN 'system'
            WHEN pt.recorded_by_user_id IN (
                SELECT user_id FROM user_roles 
                WHERE role_name IN ('super_admin', 'fee_collector', 'partnerships_head')
            ) THEN 'admin'
            ELSE 'student'
        END INTO recorder_role
    FROM payment_transactions pt
    WHERE pt.id = transaction_id;
    
    RETURN recorder_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for the function
COMMENT ON FUNCTION is_admin_recorded_payment(UUID) IS 'Returns true if the payment transaction was recorded by an admin/fee_collector';
