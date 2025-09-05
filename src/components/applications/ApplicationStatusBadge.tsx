import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  APPLICATION_STATUS_CONFIG,
  ApplicationStatus,
} from '@/types/applications';
import { cn } from '@/lib/utils';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  className,
}) => {
  const config = APPLICATION_STATUS_CONFIG[status];

  if (!config) {
    return (
      <Badge variant='secondary' className={className}>
        {status}
      </Badge>
    );
  }

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'gray':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <Badge
      variant='secondary'
      className={cn(getStatusColor(config.color), 'font-medium', className)}
      title={config.description}
    >
      {config.label}
    </Badge>
  );
};
