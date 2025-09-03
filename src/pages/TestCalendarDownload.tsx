import React, { useState } from 'react';
import { WeeklyCalendarDownload } from '@/components/calendar';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import type { Session } from '@/domains/sessions/types';
import type { CalendarDay } from '@/domains/calendar/types';
import type { UserProfile } from '@/types/auth';

const TestCalendarDownload: React.FC = () => {
  const [currentWeek] = useState(new Date());
  
  // Mock data for testing
  const mockSessions: Session[] = [
    {
      id: '1',
      title: 'The Ad Plot: Storytelling in Social Media Ads',
      session_type: 'learn',
      status: 'planned',
      session_date: '2024-01-15',
      session_number: 1,
      cohort_id: 'CP02',
      epic_id: 'epic1',
      start_time: '10:30',
      end_time: '13:00',
    },
    {
      id: '2',
      title: 'Scaling your storytelling skillsets',
      session_type: 'innovate',
      status: 'planned',
      session_date: '2024-01-15',
      session_number: 2,
      cohort_id: 'CP02',
      epic_id: 'epic1',
      start_time: '14:00',
      end_time: '16:00',
    },
    {
      id: '3',
      title: 'Hands-on learning experience',
      session_type: 'workshop',
      status: 'planned',
      session_date: '2024-01-17',
      session_number: 1,
      cohort_id: 'CP02',
      epic_id: 'epic1',
      start_time: '10:30',
      end_time: '13:00',
    },
  ];

  const mockCalendarDays: CalendarDay[] = [
    {
      date: new Date('2024-01-15'),
      isCurrentMonth: true,
      isToday: false,
      isSelected: false,
    },
    {
      date: new Date('2024-01-16'),
      isCurrentMonth: true,
      isToday: false,
      isSelected: false,
    },
    {
      date: new Date('2024-01-17'),
      isCurrentMonth: true,
      isToday: false,
      isSelected: false,
    },
    {
      date: new Date('2024-01-18'),
      isCurrentMonth: true,
      isToday: false,
      isSelected: false,
    },
    {
      date: new Date('2024-01-19'),
      isCurrentMonth: true,
      isToday: false,
      isSelected: false,
    },
  ];

  const mockMentors: UserProfile[] = [
    {
      id: '1',
      user_id: '1',
      first_name: 'LALITH',
      last_name: 'DHANUSH',
      email: 'lalith@example.com',
      role: 'mentor_manager',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', // Sample avatar
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      user_id: '2',
      first_name: 'SANJAY',
      last_name: 'SINGHA',
      email: 'sanjay@example.com',
      role: 'mentor_manager',
      avatar_url: null, // This will show initials fallback
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      user_id: '3',
      first_name: 'KANISHKAR',
      last_name: 'VELLINGIRI',
      email: 'kanishkar@example.com',
      role: 'mentor_manager',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', // Sample avatar
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      user_id: '4',
      first_name: 'KARAN',
      last_name: 'KATKE',
      email: 'karan@example.com',
      role: 'mentor_manager',
      avatar_url: null, // This will show initials fallback
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Weekly Calendar Download Test</h1>
          <p className="text-muted-foreground">
            Test the weekly calendar download functionality with mock data
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Download Options
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This component will generate a weekly calendar matching the design reference.
            You can preview the calendar and download it in PNG or JPG format.
          </p>
          
          <WeeklyCalendarDownload
            currentWeek={currentWeek}
            sessions={mockSessions}
            calendarDays={mockCalendarDays}
            cohortId="CP02"
            programCode="CP02"
            mentors={mockMentors}
            sessionMentorAssignments={{}}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Mock Data Used:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Sessions:</strong> {mockSessions.length} sessions across the week</p>
            <p><strong>Mentors:</strong> {mockMentors.length} mentors</p>
            <p><strong>Program Code:</strong> CP02</p>
            <p><strong>Week:</strong> {currentWeek.toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCalendarDownload;
