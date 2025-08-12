import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardShell from '@/components/DashboardShell';

export const LoadingState: React.FC = () => {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </DashboardShell>
  );
};
