import { HolidayDialog } from '@/features/holidays';

interface GlobalHolidayManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalHolidayManagementDialog({
  open,
  onOpenChange,
}: GlobalHolidayManagementDialogProps) {
  return (
    <HolidayDialog
      open={open}
      onOpenChange={onOpenChange}
      scope="global"
      title="Global Holiday Management"
      description="Manage holidays that apply to all cohorts across the organization."
    />
  );
}
