import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SessionInfo } from '@/types/attendance';

interface SessionTabsProps {
  sessions: SessionInfo[];
  selectedSession: number;
  onSessionChange: (session: number) => void;
}

export const SessionTabs: React.FC<SessionTabsProps> = ({
  sessions,
  selectedSession,
  onSessionChange,
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
    </Tabs>
  );
};
