import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Settings } from 'lucide-react';
import { CohortWithCounts } from '@/types/cohort';
import { FeeFeatureGate } from '@/components/common';

interface CohortHeaderProps {
  cohortData: CohortWithCounts;
  onSettingsClick: (mode?: 'view' | 'edit') => void;
}

export const CohortHeader: React.FC<CohortHeaderProps> = ({ 
  cohortData, 
  onSettingsClick 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getSeatsProgress = () => {
    // Use the cohort's max_students value instead of hardcoded 50
    const totalSeats = cohortData.max_students || 50;
    const progress = Math.round((cohortData.students_count / totalSeats) * 100);
    return progress;
  };

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">{cohortData.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Open
            </Badge>
            <span className="text-muted-foreground">Cohort ID: {cohortData.cohort_id}</span>
            <span className="text-muted-foreground">{cohortData.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {formatDate(cohortData.start_date)} - {formatDate(cohortData.end_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seats</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Filled {cohortData.students_count}/{cohortData.max_students || 50}</span>
                <Progress 
                  value={getSeatsProgress()} 
                  className="w-20 h-2 bg-gray-700 [&>div]:bg-green-500" 
                />
              </div>
            </div>
          </div>
          <FeeFeatureGate action="setup_structure">
            <Button
              onClick={() => onSettingsClick('view')}
              size="sm"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </FeeFeatureGate>
        </div>
      </div>
    </div>
  );
};
