import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Crown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CohortFeatureGate } from '@/components/common';
import { AttendanceService } from '@/services/attendance.service';
import { toast } from 'sonner';
import type { Cohort, CohortEpic } from '@/types/attendance';

interface AttendanceHeaderProps {
  cohort: Cohort | null;
  epics: CohortEpic[];
  selectedEpic: string;
  onEpicChange: (epicId: string) => void;
  onMarkHolidays: () => void;
  onEpicActiveChanged?: () => void; // Callback to refresh data when active epic changes
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  cohort,
  epics,
  selectedEpic,
  onEpicChange,
  onMarkHolidays,
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
        variant="outline"
        size="sm"
        onClick={() => navigate('/cohorts')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cohorts
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {cohort?.name} Attendance
        </h1>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onMarkHolidays}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Mark Holidays
          </Button>
          <div className="flex items-center gap-2">
            <Select value={selectedEpic} onValueChange={onEpicChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select epic" />
              </SelectTrigger>
              <SelectContent>
                {epics.map(epic => (
                  <SelectItem key={epic.id} value={epic.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{epic.name}</span>
                      <div className="flex items-center gap-2">
                        {epic.is_active && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <CohortFeatureGate action="set_active_epic">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetActiveEpic(selectedEpic)}
                disabled={settingActiveEpic || !selectedEpic}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                {settingActiveEpic ? 'Setting...' : 'Set Active'}
              </Button>
            </CohortFeatureGate>
          </div>
        </div>
      </div>


    </>
  );
};
