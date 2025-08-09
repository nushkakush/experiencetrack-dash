import React from 'react';
import { cn } from '@/lib/utils';

interface StatisticsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
};

export const StatisticsGrid: React.FC<StatisticsGridProps> = ({
  children,
  columns = 6,
  className,
}) => {
  return (
    <div
      className={cn(
        'grid gap-4',
        columnClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
};
