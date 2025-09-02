import React from 'react';
import { Badge } from '../badge';
import type { SessionType } from '../../../domains/sessions/types';
import { SessionService } from '../../../domains/sessions/services/SessionService';
import { cn } from '../../../lib/utils';

interface SessionTypeBadgeProps {
  type: SessionType;
  className?: string;
}

export const SessionTypeBadge: React.FC<SessionTypeBadgeProps> = ({
  type,
  className,
}) => {
  const sessionConfig = SessionService.getSessionTypeConfig(type);

  return (
    <Badge
      variant='secondary'
      className={cn(
        'text-xs px-2 py-1 h-6 bg-white/20 text-white border-white/30',
        className
      )}
    >
      {sessionConfig.label}
    </Badge>
  );
};
