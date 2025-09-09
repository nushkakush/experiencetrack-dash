#!/usr/bin/env node

const fetch = require('node-fetch');

async function testEdgeFunction() {
  const ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4';
  const EDGE_FUNCTION_URL =
    'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/attendance-calculations';

  const requestBody = {
    action: 'getCalendarData',
    params: {
      cohortId: 'a49ab406-f5b1-4557-a1c3-c612e3e9385b',
      epicId: '82833d79-f56f-4627-9854-4636d9f4813b',
      month: '2025-08',
    },
  };

  console.log(
    '🚀 Testing edge function with request:',
    JSON.stringify(requestBody, null, 2)
  );

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📊 Response status:', response.status);
    console.log(
      '📊 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    const result = await response.json();
    console.log('📊 Response body:', JSON.stringify(result, null, 2));

    if (result.success && result.data && result.data.days) {
      const august21to31Days = result.data.days.filter(
        day => day.date >= '2025-08-21' && day.date <= '2025-08-31'
      );

      console.log('\n🔍 August 21-31 days analysis:');
      august21to31Days.forEach(day => {
        console.log(
          `  ${day.date}: ${day.totalSessions} sessions, ${day.overallAttendance}% attendance`
        );
        if (day.sessions && day.sessions.length > 0) {
          day.sessions.forEach(session => {
            console.log(
              `    Session ${session.sessionNumber}: ${session.attendancePercentage}%`
            );
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error calling edge function:', error);
  }
}

testEdgeFunction();
