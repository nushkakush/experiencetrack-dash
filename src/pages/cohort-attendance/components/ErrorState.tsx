import React from 'react';
import DashboardShell from '@/components/DashboardShell';

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <DashboardShell>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Error loading attendance data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    </DashboardShell>
  );
};
