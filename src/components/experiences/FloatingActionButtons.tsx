import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BookOpen, Target, Users, Wrench, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExperienceType } from '@/types/experience';

interface FloatingActionButtonsProps {
  isDragging?: boolean;
  draggedType?: ExperienceType | null;
}

const experienceTypes: Array<{
  type: ExperienceType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hoverColor: string;
  description: string;
}> = [
  {
    type: 'CBL',
    label: 'CBL',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    description: 'Challenge-Based Learning',
  },
  {
    type: 'Mock Challenge',
    label: 'Mock',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    description: 'Mock Challenge',
  },
  {
    type: 'Masterclass',
    label: 'Master',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    description: 'Expert Masterclass',
  },
  {
    type: 'Workshop',
    label: 'Workshop',
    icon: Wrench,
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    description: 'Hands-on Workshop',
  },
  {
    type: 'GAP',
    label: 'GAP',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    description: 'GAP Activity',
  },
];

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  isDragging = false,
  draggedType = null,
}) => {
  const [draggedButton, setDraggedButton] = useState<ExperienceType | null>(
    null
  );

  const handleDragStart = (e: React.DragEvent, type: ExperienceType) => {
    console.log('🎯 FloatingActionButtons handleDragStart called with:', type);
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.setData('application/x-experience-type', type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedButton(type);
    console.log('🎯 Drag data set to:', type);
  };

  const handleDragEnd = () => {
    setDraggedButton(null);
  };

  // Remove click functionality - buttons only work with drag and drop

  return (
    <TooltipProvider>
      <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50'>
        <div className='flex items-center space-x-3'>
          {experienceTypes.map(
            ({
              type,
              label,
              icon: Icon,
              color,
              bgColor,
              hoverColor,
              description,
            }) => (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    draggable
                    onDragStart={e => handleDragStart(e, type)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'w-14 h-14 rounded-full shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95',
                      bgColor,
                      hoverColor,
                      'text-white border-2 border-white/20',
                      draggedButton === type &&
                        'scale-110 shadow-2xl ring-4 ring-white/30',
                      isDragging && draggedType === type && 'animate-pulse'
                    )}
                    style={{
                      filter:
                        draggedButton === type
                          ? 'drop-shadow(0 0 20px rgba(255,255,255,0.5))'
                          : undefined,
                    }}
                  >
                    <Icon className='h-6 w-6' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='top' className='bg-gray-900 text-white'>
                  <div className='text-center'>
                    <div className='font-semibold'>{description}</div>
                    <div className='text-xs text-gray-300'>
                      Drag to calendar to create
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          )}
        </div>

        {/* Instructions */}
        <div className='mt-4 text-center'>
          <p className='text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm'>
            Drag to calendar to create
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};
