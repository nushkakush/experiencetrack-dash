-- Create email_logs table for tracking all emails sent
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  template VARCHAR(100),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  context JSONB,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  ai_enhanced BOOLEAN DEFAULT FALSE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);

-- Add RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own email logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = sent_by);

-- Allow authenticated users to insert email logs
CREATE POLICY "Users can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (auth.uid() = sent_by);

-- Allow service role to manage all email logs
CREATE POLICY "Service role can manage all email logs" ON email_logs
  FOR ALL USING (auth.role() = 'service_role');
