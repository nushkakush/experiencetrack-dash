import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

const SESSION_TYPES = [
  {
    type: 'masterclass' as const,
    label: 'MC',
    color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    description: 'Masterclass',
  },
  {
    type: 'workshop' as const,
    label: 'WS',
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    description: 'Workshop',
  },
  {
    type: 'gap' as const,
    label: 'GAP',
    color: 'bg-gradient-to-r from-orange-500 to-orange-600',
    description: 'Gap Day',
  },
];

interface FloatingSessionPaletteProps {
  onDragStart: (e: React.DragEvent, sessionType: string) => void;
}

export const FloatingSessionPalette: React.FC<FloatingSessionPaletteProps> = ({
  onDragStart,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragStart = (e: React.DragEvent, sessionType: string) => {
    onDragStart(e, sessionType);
  };

  return (
    <div className='fixed bottom-6 right-6 z-50'>
      {isExpanded && (
        <div className='mb-4 p-4 bg-background border rounded-lg shadow-lg'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-medium'>Session Types</h3>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsExpanded(false)}
              className='h-6 w-6 p-0'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
          <div className='grid grid-cols-1 gap-2'>
            {SESSION_TYPES.map(sessionType => (
              <div
                key={sessionType.type}
                draggable
                onDragStart={e => handleDragStart(e, sessionType.type)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all',
                  'hover:scale-105 hover:shadow-md',
                  sessionType.color,
                  'text-white'
                )}
              >
                <div className='text-sm font-medium'>{sessionType.label}</div>
                <div className='text-xs opacity-90'>
                  {sessionType.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'h-12 w-12 rounded-full shadow-lg transition-all duration-200',
          'bg-primary hover:bg-primary/90',
          'transform opacity-0 scale-75',
          'animate-in slide-in-from-bottom-2',
          'hover:scale-110'
        )}
      >
        <Plus className='h-6 w-6' />
      </Button>
    </div>
  );
};
