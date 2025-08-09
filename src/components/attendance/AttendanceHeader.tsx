import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Cohort, CohortEpic } from '@/types/attendance';

interface AttendanceHeaderProps {
  cohort: Cohort | null;
  epics: CohortEpic[];
  selectedEpic: string;
  onEpicChange: (epicId: string) => void;
  onMarkHolidays: () => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  cohort,
  epics,
  selectedEpic,
  onEpicChange,
  onMarkHolidays,
}) => {
  const navigate = useNavigate();

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
          <Select value={selectedEpic} onValueChange={onEpicChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select epic" />
            </SelectTrigger>
            <SelectContent>
              {epics.map(epic => (
                <SelectItem key={epic.id} value={epic.id}>
                  <span>{epic.name}</span>
                  {epic.is_active && <span className="ml-2 text-green-600">●</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


    </>
  );
};
