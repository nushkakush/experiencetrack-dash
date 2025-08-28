import { HolidayDialog } from '@/features/holidays';

interface CohortHolidayManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  cohortName: string;
}

export function CohortHolidayManagementDialog({
  open,
  onOpenChange,
  cohortId,
  cohortName,
}: CohortHolidayManagementDialogProps) {
  return (
    <HolidayDialog
      open={open}
      onOpenChange={onOpenChange}
      scope='cohort'
      cohortId={cohortId}
      title={`${cohortName} Holiday Management`}
      description={`Manage cohort-specific holidays for the ${cohortName} cohort. Global holidays are managed separately and apply to all cohorts.`}
    />
  );
}
