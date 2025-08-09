import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHolidayManagement } from '../hooks/useHolidayManagement';
import { HolidayForm } from './HolidayForm';
import { HolidayList } from './HolidayList';

interface HolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: 'global' | 'cohort';
  cohortId?: string;
  title: string;
  description: string;
}

export const HolidayDialog = ({
  open,
  onOpenChange,
  scope,
  cohortId,
  title,
  description,
}: HolidayDialogProps) => {
  const { state, actions } = useHolidayManagement(scope, cohortId);

  const handleClose = () => {
    actions.clearDrafts();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="draft" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draft">Add Holidays</TabsTrigger>
            <TabsTrigger value="live">Manage Existing</TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Dates</h3>
                <CalendarComponent
                  mode="multiple"
                  selected={state.selectedDates}
                  onSelect={(dates) => actions.setSelectedDates(dates || [])}
                  className="rounded-md border"
                />
              </div>

              {/* Form */}
              <div className="space-y-4">
                <HolidayForm
                  selectedDates={state.selectedDates}
                  onAddHoliday={actions.addHoliday}
                  onClearDates={() => actions.setSelectedDates([])}
                />

                {/* Draft List */}
                {state.draftHolidays.length > 0 && (
                  <>
                    <Separator />
                    <HolidayList
                      title="Draft Holidays"
                      holidays={state.draftHolidays}
                      onDelete={actions.removeHoliday}
                      isDraft={true}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {state.draftHolidays.length > 0 && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={actions.publishHolidays}
                  disabled={state.publishing || state.saving}
                >
                  {state.publishing ? 'Publishing...' : 'Publish All'}
                </Button>
                <Button
                  variant="outline"
                  onClick={actions.saveDrafts}
                  disabled={state.publishing || state.saving}
                >
                  {state.saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  variant="outline"
                  onClick={actions.clearDrafts}
                  disabled={state.publishing || state.saving}
                >
                  Clear All
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <HolidayList
              title="Published Holidays"
              holidays={state.publishedHolidays}
              onDelete={actions.deletePublishedHoliday}
              isLoading={state.loading}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
