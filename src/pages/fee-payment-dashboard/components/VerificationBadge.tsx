import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  count,
  onClick,
  className,
}) => {
  if (count === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <Badge
        variant='destructive'
        className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-destructive/90 transition-colors'
        onClick={onClick}
      >
        {count > 99 ? '99+' : count}
      </Badge>
      <FileText className='h-5 w-5 text-muted-foreground' />
    </div>
  );
};
