import React, { useState, useEffect } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { EpicsService } from '@/services/epics.service';
import type { Epic } from '@/types/epic';

interface EpicSelectorProps {
  selectedEpicId: string | null;
  onEpicChange: (epicId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export const EpicSelector: React.FC<EpicSelectorProps> = ({
  selectedEpicId,
  onEpicChange,
  placeholder = 'Select an Epic',
  className = '',
}) => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpics = async () => {
      try {
        setLoading(true);
        const { data } = await EpicsService.getEpics();
        setEpics(data || []);
      } catch (error) {
        console.error('Error fetching epics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpics();
  }, []);

  const selectedEpic = epics.find(epic => epic.id === selectedEpicId);

  const handleEpicSelect = (epicId: string) => {
    onEpicChange(epicId);
  };

  const handleClearSelection = () => {
    onEpicChange(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Zap className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Loading epics...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Zap className='h-4 w-4 text-muted-foreground' />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='h-8 px-3'>
            <span className='text-sm'>
              {selectedEpic ? selectedEpic.name : placeholder}
            </span>
            <ChevronDown className='ml-2 h-3 w-3' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-64'>
          {epics.length === 0 ? (
            <div className='px-2 py-1.5 text-sm text-muted-foreground'>
              No epics available
            </div>
          ) : (
            <>
              <DropdownMenuItem onClick={handleClearSelection}>
                <span className='text-sm text-muted-foreground'>No Epic Selected</span>
              </DropdownMenuItem>
              {epics.map((epic) => (
                <DropdownMenuItem
                  key={epic.id}
                  onClick={() => handleEpicSelect(epic.id)}
                  className='flex items-center justify-between'
                >
                  <div className='flex flex-col items-start'>
                    <span className='text-sm font-medium'>{epic.name}</span>
                    {epic.description && (
                      <span className='text-xs text-muted-foreground truncate max-w-48'>
                        {epic.description}
                      </span>
                    )}
                  </div>
                  {selectedEpicId === epic.id && (
                    <Badge variant='secondary' className='ml-2 text-xs'>
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedEpic && (
        <Badge variant='outline' className='text-xs'>
          {epics.filter(e => e.id === selectedEpicId).length > 0 ? 'Active' : 'Inactive'}
        </Badge>
      )}
    </div>
  );
};
