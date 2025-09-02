import React from 'react';
import { cn } from '../../../lib/utils';

interface CalendarDropZoneProps {
  sessionsPerDay: number;
  isActive: boolean;
  hoveredSlot: number | null;
  getSlotState: (slot: number) => { available: boolean };
  onHoverSlot: (slot: number) => void;
  onLeave: () => void;
  onDropSlot: (slot: number, e: React.DragEvent) => void;
}

export const CalendarDropZone: React.FC<CalendarDropZoneProps> = ({
  sessionsPerDay,
  isActive,
  hoveredSlot,
  getSlotState,
  onHoverSlot,
  onLeave,
  onDropSlot,
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <div className='absolute inset-0 pointer-events-none' onDragLeave={onLeave}>
      {Array.from({ length: sessionsPerDay }, (_, index) => {
        const slot = index + 1;
        const slotState = getSlotState(slot);
        const isHovered = hoveredSlot === slot;

        return (
          <div
            key={slot}
            className={cn(
              'absolute left-0 right-0 transition-all duration-200 pointer-events-auto',
              'border-2 border-dashed rounded-md',
              isHovered && slotState.available
                ? 'border-blue-400 bg-blue-50/50'
                : isHovered && !slotState.available
                  ? 'border-red-400 bg-red-50/50'
                  : 'border-transparent'
            )}
            style={{
              top: `${(index / sessionsPerDay) * 100}%`,
              height: `${100 / sessionsPerDay}%`,
            }}
            onDragEnter={e => {
              e.preventDefault();
              onHoverSlot(slot);
            }}
            onDragOver={e => {
              e.preventDefault();
              onHoverSlot(slot);
            }}
            onDrop={e => {
              e.preventDefault();
              onDropSlot(slot, e);
            }}
          >
            {isHovered && (
              <div className='flex items-center justify-center h-full text-xs font-medium'>
                {slotState.available ? (
                  <span className='text-blue-600'>Drop here</span>
                ) : (
                  <span className='text-green-600 font-semibold'>
                    Swap positions
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
