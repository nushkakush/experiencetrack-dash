import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SessionStatistics } from './SessionStatistics';
import type { SessionInfo, CohortStudent, AttendanceRecord } from '@/types/attendance';

interface SessionTabsProps {
  sessions: SessionInfo[];
  selectedSession: number;
  onSessionChange: (session: number) => void;
  students: CohortStudent[];
  attendanceRecords: AttendanceRecord[];
}

export const SessionTabs: React.FC<SessionTabsProps> = ({
  sessions,
  selectedSession,
  onSessionChange,
  students,
  attendanceRecords,
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No sessions available for this date
      </div>
    );
  }

  return (
    <Tabs 
      value={selectedSession.toString()} 
      onValueChange={(value) => onSessionChange(parseInt(value))}
    >
      <TabsList className="grid w-full grid-cols-2">
        {sessions.map(session => (
          <TabsTrigger 
            key={session.sessionNumber} 
            value={session.sessionNumber.toString()}
          >
            Session {session.sessionNumber} {session.isCancelled && '(Cancelled)'}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {sessions.map(session => (
        <TabsContent key={session.sessionNumber} value={session.sessionNumber.toString()}>
          <div className="space-y-4">
            <SessionStatistics
              students={students}
              attendanceRecords={attendanceRecords}
              sessionNumber={session.sessionNumber}
              isSessionCancelled={session.isCancelled}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
