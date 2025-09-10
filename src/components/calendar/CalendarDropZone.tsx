import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ExperienceType } from '@/types/experience';

// Global state to track which slot is currently being dragged over
let globalDragOverSlot: { date: Date; sessionNumber: number } | null = null;
const dragOverListeners = new Set<() => void>();

const setGlobalDragOverSlot = (
  slot: { date: Date; sessionNumber: number } | null
) => {
  globalDragOverSlot = slot;
  dragOverListeners.forEach(listener => listener());
};

const addDragOverListener = (listener: () => void) => {
  dragOverListeners.add(listener);
  return () => dragOverListeners.delete(listener);
};

interface ExperienceDropZoneProps {
  date: Date;
  sessionNumber: number;
  onDrop: (type: ExperienceType, date: Date, sessionNumber: number) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const ExperienceDropZone: React.FC<ExperienceDropZoneProps> = ({
  date,
  sessionNumber,
  onDrop,
  children,
  className,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if this slot is currently being dragged over
  const isCurrentDragOver =
    globalDragOverSlot?.date.getTime() === date.getTime() &&
    globalDragOverSlot?.sessionNumber === sessionNumber;

  // Update local state when global state changes
  useEffect(() => {
    const unsubscribe = addDragOverListener(() => {
      setIsDragOver(isCurrentDragOver);
    });
    return unsubscribe;
  }, [isCurrentDragOver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        globalDragOverSlot?.date.getTime() === date.getTime() &&
        globalDragOverSlot?.sessionNumber === sessionNumber
      ) {
        setGlobalDragOverSlot(null);
      }
    };
  }, [date, sessionNumber]);

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setGlobalDragOverSlot({ date, sessionNumber });
    console.log('🎯 ExperienceDropZone handleDragOver called for:', {
      date,
      sessionNumber,
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setGlobalDragOverSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    setGlobalDragOverSlot(null);

    // Get the dragged experience type from the drag data
    const draggedType = e.dataTransfer.getData('text/plain') as ExperienceType;
    console.log('🎯 ExperienceDropZone handleDrop called with:', {
      draggedType,
      date,
      sessionNumber,
      onDrop: !!onDrop,
      dataTransferTypes: e.dataTransfer.types,
      effectAllowed: e.dataTransfer.effectAllowed,
    });

    // Try to get data from different formats
    const altData = e.dataTransfer.getData('application/x-experience-type');
    console.log('🎯 Alternative drag data:', altData);

    if (draggedType && onDrop) {
      console.log('🎯 Calling onDrop with:', {
        draggedType,
        date,
        sessionNumber,
      });
      onDrop(draggedType, date, sessionNumber);
    } else {
      console.log('🎯 Not calling onDrop - missing draggedType or onDrop:', {
        draggedType,
        onDrop: !!onDrop,
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return;

    e.preventDefault();
    setGlobalDragOverSlot({ date, sessionNumber });
    console.log('🎯 ExperienceDropZone handleDragEnter called for:', {
      date,
      sessionNumber,
    });
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        isDragOver &&
          !disabled &&
          'ring-2 ring-blue-400 ring-opacity-75 bg-blue-50/50 dark:bg-blue-500/10',
        !disabled &&
          'hover:ring-1 hover:ring-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-500/5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      style={{
        minHeight: '60px', // Ensure minimum height for drop zone
        pointerEvents: 'auto', // Ensure pointer events are enabled
      }}
    >
      {children}

      {/* Drop indicator overlay */}
      {isDragOver && !disabled && (
        <div className='absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-lg border-2 border-dashed border-blue-400 pointer-events-none'>
          <div className='bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg border'>
            <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
              Drop experience here
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
