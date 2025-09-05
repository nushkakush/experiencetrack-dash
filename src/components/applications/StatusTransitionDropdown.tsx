import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
} from 'lucide-react';
import {
  ApplicationStatus,
  APPLICATION_STATUS_CONFIG,
} from '@/types/applications';
import { cn } from '@/lib/utils';

interface StatusTransitionDropdownProps {
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
  disabled?: boolean;
}

export const StatusTransitionDropdown: React.FC<
  StatusTransitionDropdownProps
> = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Define possible transitions based on current status
  const getPossibleTransitions = (
    status: ApplicationStatus
  ): ApplicationStatus[] => {
    switch (status) {
      case 'registration_initiated':
        return ['registration_completed']; // Auto-transition, but allow manual override
      case 'registration_completed':
        return ['submitted', 'draft'];
      case 'draft':
        return ['submitted', 'registration_completed'];
      case 'submitted':
        return ['under_review', 'draft'];
      case 'under_review':
        return ['approved', 'rejected', 'submitted'];
      case 'approved':
        return ['under_review']; // Allow going back for corrections
      case 'rejected':
        return ['under_review', 'submitted']; // Allow resubmission
      default:
        return [];
    }
  };

  const possibleTransitions = getPossibleTransitions(currentStatus);

  if (possibleTransitions.length === 0) {
    return null;
  }

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'registration_completed':
      case 'approved':
        return <CheckCircle className='h-4 w-4' />;
      case 'submitted':
      case 'under_review':
        return <Clock className='h-4 w-4' />;
      case 'draft':
        return <FileText className='h-4 w-4' />;
      case 'rejected':
        return <XCircle className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'green':
        return 'text-green-600';
      case 'gray':
        return 'text-gray-600';
      case 'purple':
        return 'text-purple-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' disabled={disabled} className='h-8'>
          Change Status
          <ChevronDown className='h-4 w-4 ml-1' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        {possibleTransitions.map(status => {
          const config = APPLICATION_STATUS_CONFIG[status];
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => {
                onStatusChange(status);
                setIsOpen(false);
              }}
              className='flex items-center gap-2'
            >
              {getStatusIcon(status)}
              <span className={cn('font-medium', getStatusColor(config.color))}>
                {config.label}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
