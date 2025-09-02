import React from 'react';
import { SessionService } from '../services/SessionService';
import type { SessionType } from '../types';

export const SessionTypeLegend: React.FC = () => {
  // Simplified session types - CBL as one category, others as individual
  const sessionTypes = [
    {
      type: 'cbl',
      label: 'Challenge-Based Learning',
      description: 'Challenge-Based Learning',
    },
    { type: 'masterclass', label: 'Masterclass', description: 'Masterclass' },
    { type: 'workshop', label: 'Workshop', description: 'Workshop' },
    { type: 'gap', label: 'Gap', description: 'Gap' },
  ];

  return (
    <div className='mt-6 p-4 bg-muted/30 rounded-lg border'>
      <h3 className='text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide'>
        Session Type Legend
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
        {sessionTypes.map(({ type, label, description }) => {
          const config = SessionService.getSessionTypeConfig(
            type as SessionType
          );
          if (!config) return null;

          return (
            <div key={type} className='flex items-center gap-2'>
              <div
                className={`w-4 h-4 rounded ${config.color}`}
                title={description}
              />
              <span className='text-xs font-medium text-muted-foreground'>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
