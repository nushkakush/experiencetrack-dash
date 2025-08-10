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
import { HolidayEditDialog } from './HolidayEditDialog';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import type { Holiday } from '@/types/holiday';

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
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleClose = () => {
    actions.clearDrafts();
    onOpenChange(false);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Holiday>) => {
    await actions.editPublishedHoliday(id, updates);
    setEditDialogOpen(false);
    setEditingHoliday(null);
  };

  // Convert published holidays to Date objects for calendar highlighting
  const publishedHolidayDates = state.publishedHolidays.map(holiday => 
    parseISO(holiday.date)
  );

  // Calendar modifiers for highlighting published holidays
  const calendarModifiers = {
    published: publishedHolidayDates,
  };

  // Calendar modifier styles
  const calendarModifierStyles = {
    published: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      fontWeight: 'bold',
    },
  };

  return (
    <>
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
                  <div className="space-y-2">
                    <CalendarComponent
                      mode="multiple"
                      selected={state.selectedDates}
                      onSelect={(dates) => actions.setSelectedDates(dates || [])}
                      className="rounded-md border"
                      modifiers={calendarModifiers}
                      modifiersStyles={calendarModifierStyles}
                    />
                    {publishedHolidayDates.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="inline-block w-3 h-3 bg-primary rounded mr-1"></span>
                        Published holidays are highlighted
                      </div>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <HolidayForm
                    selectedDates={state.selectedDates}
                    publishedHolidays={state.publishedHolidays}
                    onAddHoliday={actions.addHoliday}
                    onClearDates={() => actions.setSelectedDates([])}
                    onEditHoliday={handleEditHoliday}
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
                onEdit={handleEditHoliday}
                isLoading={state.loading}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <HolidayEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        holiday={editingHoliday}
        onSave={handleSaveEdit}
        isLoading={state.editing}
      />
    </>
  );
};
