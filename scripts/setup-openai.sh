#!/bin/bash

# OpenAI Integration Setup Script
# This script helps set up the OpenAI integration for the ExperienceTrack Dashboard

set -e

echo "🚀 Setting up OpenAI Integration for ExperienceTrack Dashboard"
echo "=============================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from the project root."
    exit 1
fi

echo "✅ Supabase project detected"

# Deploy the migration
echo "📊 Deploying database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database migration deployed successfully"
else
    echo "❌ Failed to deploy database migration"
    exit 1
fi

# Deploy the Edge Function
echo "🔧 Deploying OpenAI Edge Function..."
supabase functions deploy openai-chat

if [ $? -eq 0 ]; then
    echo "✅ Edge Function deployed successfully"
else
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi

# Check for OpenAI API key
echo "🔑 Checking for OpenAI API key..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable not set"
    echo "   Please set it in your Supabase project:"
    echo "   1. Go to Supabase Dashboard > Settings > Edge Functions"
    echo "   2. Add environment variable: OPENAI_API_KEY=your_key_here"
    echo "   3. Redeploy the function: supabase functions deploy openai-chat"
else
    echo "✅ OpenAI API key found"
fi

echo ""
echo "🎉 OpenAI Integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Set your OpenAI API key in Supabase Dashboard if not already done"
echo "2. Import the service in your components:"
echo "   import { useOpenAI } from '@/hooks/useOpenAI';"
echo "3. Check the examples in src/examples/OpenAIUsageExamples.tsx"
echo "4. Read the documentation in docs/OPENAI_INTEGRATION.md"
echo ""
echo "Happy coding! 🤖"
