-- Create OpenAI request logs table
CREATE TABLE IF NOT EXISTS openai_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  context_count INTEGER DEFAULT 0,
  context_types TEXT[] DEFAULT '{}',
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  response_format TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  response_content TEXT,
  usage_tokens INTEGER,
  cost DECIMAL(10,6),
  response_time INTEGER, -- in milliseconds
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_openai_logs_user_id ON openai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_logs_created_at ON openai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_openai_logs_model ON openai_request_logs(model);
CREATE INDEX IF NOT EXISTS idx_openai_logs_success ON openai_request_logs(success);
CREATE INDEX IF NOT EXISTS idx_openai_logs_cost ON openai_request_logs(cost);

-- Create RLS policies
ALTER TABLE openai_request_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own logs
CREATE POLICY "Users can view their own OpenAI logs" ON openai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for service role to insert logs
CREATE POLICY "Service role can insert OpenAI logs" ON openai_request_logs
  FOR INSERT WITH CHECK (true);

-- Policy for service role to update logs
CREATE POLICY "Service role can update OpenAI logs" ON openai_request_logs
  FOR UPDATE USING (true);

-- Policy for admins to view all logs (if you have an admin role)
CREATE POLICY "Admins can view all OpenAI logs" ON openai_request_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create a view for analytics
CREATE OR REPLACE VIEW openai_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  model,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  ROUND(
    COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*)::DECIMAL * 100, 
    2
  ) as success_rate,
  SUM(usage_tokens) as total_tokens,
  SUM(cost) as total_cost,
  AVG(response_time) as avg_response_time,
  AVG(usage_tokens) as avg_tokens_per_request
FROM openai_request_logs
GROUP BY DATE_TRUNC('day', created_at), model
ORDER BY date DESC, model;

-- Create a function to get usage statistics for a user
CREATE OR REPLACE FUNCTION get_user_openai_usage(
  target_user_id UUID DEFAULT auth.uid(),
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL(10,6),
  avg_response_time DECIMAL,
  success_rate DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    COALESCE(SUM(usage_tokens), 0) as total_tokens,
    COALESCE(SUM(cost), 0) as total_cost,
    COALESCE(AVG(response_time), 0) as avg_response_time,
    ROUND(
      COUNT(*) FILTER (WHERE success = true)::DECIMAL / 
      NULLIF(COUNT(*), 0)::DECIMAL * 100, 
      2
    ) as success_rate
  FROM openai_request_logs
  WHERE user_id = target_user_id
    AND created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$;

-- Create a function to get model usage statistics
CREATE OR REPLACE FUNCTION get_model_usage_stats(
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  model TEXT,
  total_requests BIGINT,
  successful_requests BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL(10,6),
  avg_response_time DECIMAL,
  success_rate DECIMAL(5,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ol.model,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COALESCE(SUM(usage_tokens), 0) as total_tokens,
    COALESCE(SUM(cost), 0) as total_cost,
    COALESCE(AVG(response_time), 0) as avg_response_time,
    ROUND(
      COUNT(*) FILTER (WHERE success = true)::DECIMAL / 
      NULLIF(COUNT(*), 0)::DECIMAL * 100, 
      2
    ) as success_rate
  FROM openai_request_logs ol
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY ol.model
  ORDER BY total_requests DESC;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON openai_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_openai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_model_usage_stats TO authenticated;
