import { HolidayDialog } from "@/features/holidays";

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
      scope="cohort"
      cohortId={cohortId}
      title={`${cohortName} Holiday Management`}
      description={`Manage holidays for the ${cohortName} cohort. This includes both global holidays (applying to all cohorts) and cohort-specific holidays.`}
    />
  );
}
