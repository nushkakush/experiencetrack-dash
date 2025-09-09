#!/bin/bash

echo "🚀 Testing edge function for August 2025 calendar data..."

curl -X POST "https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/attendance-calculations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4" \
  -d '{
    "action": "getCalendarData",
    "params": {
      "cohortId": "a49ab406-f5b1-4557-a1c3-c612e3e9385b",
      "epicId": "82833d79-f56f-4627-9854-4636d9f4813b", 
      "month": "2025-08"
    }
  }' | jq '.'
