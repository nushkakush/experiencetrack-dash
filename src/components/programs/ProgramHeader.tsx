import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CohortFeatureGate } from '@/components/common';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { Cohort, CohortEpic } from '@/types/attendance';

interface ProgramHeaderProps {
  cohort: Cohort | null;
  epics: CohortEpic[];
  selectedEpic: string;
  onEpicChange: (epicId: string) => void;
  onEpicActiveChanged?: () => void; // Callback to refresh data when active epic changes
}

export const ProgramHeader: React.FC<ProgramHeaderProps> = ({
  cohort,
  epics,
  selectedEpic,
  onEpicChange,
  onEpicActiveChanged,
}) => {
  const navigate = useNavigate();
  const [settingActiveEpic, setSettingActiveEpic] = useState(false);

  const handleSetActiveEpic = async (epicId: string) => {
    if (!cohort) return;

    setSettingActiveEpic(true);
    try {
      await AttendanceService.setEpicActive(epicId);
      toast.success('Active epic updated successfully');
      onEpicActiveChanged?.(); // Refresh data to reflect the change
    } catch (error) {
      console.error('Error setting active epic:', error);
      toast.error('Failed to update active epic');
    } finally {
      setSettingActiveEpic(false);
    }
  };

  return (
    <>
      {/* Back Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={() => navigate('/cohorts')}
        className='flex items-center gap-2 w-fit'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Cohorts
      </Button>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Manage {cohort?.name}</h1>
          <p className='text-muted-foreground'>
            Program management dashboard for day-to-day activities and skill
            development
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Select value={selectedEpic} onValueChange={onEpicChange}>
            <SelectTrigger className='w-[250px]'>
              <SelectValue placeholder='Select epic' />
            </SelectTrigger>
            <SelectContent>
              {epics.map(epic => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.epic?.name || epic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <CohortFeatureGate action='set_active_epic'>
            {(() => {
              const selectedEpicData = epics.find(
                epic => epic.id === selectedEpic
              );
              const isCurrentlyActive = selectedEpicData?.is_active;

              return (
                <Button
                  variant={isCurrentlyActive ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => handleSetActiveEpic(selectedEpic)}
                  disabled={
                    settingActiveEpic || !selectedEpic || isCurrentlyActive
                  }
                  className={`flex items-center gap-2 ${
                    isCurrentlyActive
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                      : ''
                  }`}
                >
                  <Crown className='h-4 w-4' />
                  {settingActiveEpic
                    ? 'Setting...'
                    : isCurrentlyActive
                      ? 'Active'
                      : 'Set Active'}
                </Button>
              );
            })()}
          </CohortFeatureGate>
        </div>
      </div>
    </>
  );
};
