import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Crown,
  CheckCircle,
  Upload,
} from 'lucide-react';
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
import BulkAttendanceUploadDialog from '@/components/common/bulk-upload/BulkAttendanceUploadDialog';
import { BulkAttendanceConfig } from '@/components/common/bulk-upload/types/attendance';

interface AttendanceHeaderProps {
  cohort: Cohort | null;
  epics: CohortEpic[];
  selectedEpic: string;
  onEpicChange: (epicId: string) => void;
  onMarkHolidays: () => void;
  onEpicActiveChanged?: () => void; // Callback to refresh data when active epic changes
  onAttendanceImported?: () => void; // Callback when bulk attendance is imported
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  cohort,
  epics,
  selectedEpic,
  onEpicChange,
  onMarkHolidays,
  onEpicActiveChanged,
  onAttendanceImported,
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
        className='flex items-center gap-2'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Cohorts
      </Button>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>{cohort?.name} Attendance</h1>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            onClick={onMarkHolidays}
            className='flex items-center gap-2'
          >
            <CalendarIcon className='h-4 w-4' />
            Mark Holidays
          </Button>

          {/* Epic-level Bulk Attendance Import - Hidden for now */}
          {/* {cohort && selectedEpic && (
            <BulkAttendanceUploadDialog
              config={{
                cohortId: cohort.id,
                epicId: selectedEpic,
                startDate: cohort.start_date,
                endDate: cohort.end_date,
                sessionsPerDay: cohort.sessions_per_day
              }}
              onSuccess={onAttendanceImported}
            >
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Import Epic
              </Button>
            </BulkAttendanceUploadDialog>
          )} */}
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
      </div>
    </>
  );
};
