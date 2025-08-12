import React from 'react';
import DashboardShell from '@/components/DashboardShell';

export const ErrorState: React.FC = () => {
  return (
    <DashboardShell>
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cohort Not Found</h2>
        <p className="text-gray-600">The cohort you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    </DashboardShell>
  );
};
