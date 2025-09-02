import React from 'react';
import { cn } from '../../../lib/utils';
import type { Session } from '../types';

interface DraggableSessionProps {
  session: Session;
  sessionNumber: number;
  className?: string;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, session: Session) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDelete?: (session: Session, sessionNumber: number) => void;
}

export const DraggableSession: React.FC<DraggableSessionProps> = ({
  session,
  sessionNumber,
  className,
  onClick,
  onDragStart,
  onDragEnd,
  onDelete,
}) => {
  const sessionType = session.session_type;

  const getSessionTypeConfig = (type: string) => {
    switch (type) {
      case 'masterclass':
        return {
          label: 'MC',
          color:
            'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25',
          description: 'Masterclass',
        };
      case 'workshop':
        return {
          label: 'WS',
          color:
            'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25',
          description: 'Workshop',
        };
      case 'gap':
        return {
          label: 'GAP',
          color:
            'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/25',
          description: 'Gap Day',
        };
      default:
        return {
          label: 'S',
          color:
            'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-500/25',
          description: 'Session',
        };
    }
  };

  const config = getSessionTypeConfig(sessionType);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.setData('sessionType', sessionType);
    e.dataTransfer.setData('sessionTitle', session.title);
    e.dataTransfer.setData('sessionDate', session.session_date);
    e.dataTransfer.setData('sessionNumber', sessionNumber.toString());
    e.dataTransfer.effectAllowed = 'move';

    if (onDragStart) {
      onDragStart(e, session);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(session, sessionNumber);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:scale-105 hover:shadow-lg',
        'border border-transparent hover:border-white/20',
        config.color,
        className
      )}
      title={`${config.description}: ${session.title}`}
    >
      {/* Session Type Badge */}
      <div className='flex items-center justify-between mb-1'>
        <span className='text-xs font-bold bg-white/20 px-1.5 py-0.5 rounded'>
          {config.label}
        </span>
        <span className='text-xs opacity-75'>S{sessionNumber}</span>
      </div>

      {/* Session Title */}
      <div className='text-xs font-medium line-clamp-2 mb-1'>
        {session.title}
      </div>

      {/* Session Status */}
      <div className='text-xs opacity-75 capitalize'>{session.status}</div>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className='absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'
          title='Delete session'
        >
          ×
        </button>
      )}
    </div>
  );
};
