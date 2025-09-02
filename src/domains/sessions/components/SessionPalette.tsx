import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';

const SESSION_TYPES = [
  {
    type: 'masterclass' as const,
    title: 'Masterclass',
    description: 'Expert-led learning session',
  },
  {
    type: 'workshop' as const,
    title: 'Workshop',
    description: 'Hands-on practical learning session',
  },
  {
    type: 'gap' as const,
    title: 'GAP Session',
    description: 'Break day for reflection and catch-up',
  },
];

interface SessionPaletteProps {
  onSessionSelect: (sessionType: string) => void;
  className?: string;
}

export const SessionPalette: React.FC<SessionPaletteProps> = ({
  onSessionSelect,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-1 gap-3', className)}>
      {SESSION_TYPES.map(sessionType => (
        <Card
          key={sessionType.type}
          className='cursor-pointer hover:shadow-md transition-shadow'
          onClick={() => onSessionSelect(sessionType.type)}
        >
          <CardContent className='p-4'>
            <h3 className='font-medium text-sm mb-1'>{sessionType.title}</h3>
            <p className='text-xs text-muted-foreground'>
              {sessionType.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
