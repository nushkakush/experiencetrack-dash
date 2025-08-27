import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trophy, Users, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';

interface CohortWithCounts {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  studentCount: number;
}

interface CombinedLeaderboardProps {
  availableCohorts: CohortWithCounts[];
  onClose?: () => void;
}

export const CombinedLeaderboard: React.FC<CombinedLeaderboardProps> = ({
  availableCohorts,
  onClose,
}) => {
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter cohorts based on search term
  const filteredCohorts = availableCohorts.filter(
    cohort =>
      cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cohort.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle cohort selection
  const handleCohortToggle = (cohortId: string, checked: boolean) => {
    if (checked) {
      setSelectedCohorts(prev => [...prev, cohortId]);
    } else {
      setSelectedCohorts(prev => prev.filter(id => id !== cohortId));
    }
  };

  // Handle select all / deselect all for filtered cohorts
  const handleSelectAll = () => {
    const filteredCohortIds = filteredCohorts.map(cohort => cohort.id);
    const allFilteredSelected = filteredCohortIds.every(id =>
      selectedCohorts.includes(id)
    );

    if (allFilteredSelected) {
      // Deselect all filtered cohorts
      setSelectedCohorts(prev =>
        prev.filter(id => !filteredCohortIds.includes(id))
      );
    } else {
      // Select all filtered cohorts (add them to existing selection)
      setSelectedCohorts(prev => [...new Set([...prev, ...filteredCohortIds])]);
    }
  };

  // Check if all filtered cohorts are selected
  const allFilteredSelected =
    filteredCohorts.length > 0 &&
    filteredCohorts.every(cohort => selectedCohorts.includes(cohort.id));

  // Generate and copy public link
  const generatePublicLink = () => {
    if (selectedCohorts.length === 0) {
      toast.error('Please select at least one cohort first');
      return;
    }

    const cohortIds = selectedCohorts.join(',');
    const publicUrl = `${window.location.origin}/public/leaderboards/${cohortIds}`;

    navigator.clipboard
      .writeText(publicUrl)
      .then(() => {
        toast.success('Public link copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy link to clipboard');
      });
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Trophy className='h-6 w-6 text-yellow-500' />
            Combined Leaderboards
          </h2>
          <p className='text-muted-foreground'>
            Compare attendance performance across multiple cohorts
          </p>
        </div>
        {onClose && (
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Cohort Selection */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg'>Select Cohorts</CardTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              disabled={filteredCohorts.length === 0}
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className='mb-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search cohorts...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredCohorts.map(cohort => (
              <div
                key={cohort.id}
                className='flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors'
              >
                <Checkbox
                  id={cohort.id}
                  checked={selectedCohorts.includes(cohort.id)}
                  onCheckedChange={checked =>
                    handleCohortToggle(cohort.id, checked as boolean)
                  }
                />
                <div className='flex-1 min-w-0'>
                  <label
                    htmlFor={cohort.id}
                    className='text-sm font-medium cursor-pointer'
                  >
                    {cohort.name}
                  </label>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Users className='h-3 w-3' />
                    <span>{cohort.studentCount} students</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No results message */}
          {filteredCohorts.length === 0 && searchTerm && (
            <div className='text-center py-8 text-muted-foreground'>
              <Search className='h-8 w-8 mx-auto mb-2' />
              <p>No cohorts match "{searchTerm}"</p>
            </div>
          )}

          {selectedCohorts.length > 0 && (
            <div className='mt-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>Selected:</span>
                <Badge variant='secondary'>
                  {selectedCohorts.length} cohort
                  {selectedCohorts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={generatePublicLink}
                className='gap-2'
              >
                <Copy className='h-3 w-3' />
                Copy Public Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
