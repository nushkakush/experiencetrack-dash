import { Calendar } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useHolidayManagement } from '../hooks/useHolidayManagement';
import { HolidayForm } from './HolidayForm';
import { HolidayList } from './HolidayList';
import { HolidayEditDialog } from './HolidayEditDialog';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import type { Holiday, SelectedHoliday } from '@/types/holiday';
import { cn } from '@/lib/utils';

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
  const [addHolidayModalOpen, setAddHolidayModalOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<
    Holiday | SelectedHoliday | null
  >(null);

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

  const handleAddHoliday = (holiday: SelectedHoliday) => {
    actions.addHoliday(holiday);
    setAddHolidayModalOpen(false);
    actions.setSelectedDates([]);
  };

  const handleDeleteHoliday = (id: string) => {
    // Find the holiday by ID from both published and draft lists
    const holiday = [
      ...state.publishedHolidays,
      ...state.existingDraftHolidays,
      ...state.draftHolidays,
    ].find(h => h.id === id);

    if (holiday) {
      setHolidayToDelete(holiday);
      setDeleteConfirmationOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (holidayToDelete) {
      await actions.deletePublishedHoliday(holidayToDelete.id);
      setDeleteConfirmationOpen(false);
      setHolidayToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setHolidayToDelete(null);
  };

  // Convert all holidays to Date objects for calendar highlighting
  const publishedHolidayDates = state.publishedHolidays.map(holiday =>
    parseISO(holiday.date)
  );
  const draftHolidayDates = [
    ...state.existingDraftHolidays.map(holiday => parseISO(holiday.date)),
    ...state.draftHolidays.map(holiday => parseISO(holiday.date)),
  ];

  // Calendar modifiers for highlighting different types of holidays
  const calendarModifiers = {
    published: publishedHolidayDates,
    draft: draftHolidayDates,
  };

  // Calendar modifier styles
  const calendarModifierStyles = {
    published: {
      backgroundColor:
        scope === 'global' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
      color:
        scope === 'global'
          ? 'hsl(var(--primary-foreground))'
          : 'hsl(var(--secondary-foreground))',
      fontWeight: 'bold',
    },
    draft: {
      backgroundColor: 'hsl(var(--muted-foreground))',
      color: 'hsl(var(--background))',
      fontWeight: 'bold',
    },
  };

  // Check if selected date already has any holiday
  const selectedDateHasHoliday =
    state.selectedDates.length === 1 &&
    (publishedHolidayDates.some(
      date =>
        format(date, 'yyyy-MM-dd') ===
        format(state.selectedDates[0], 'yyyy-MM-dd')
    ) ||
      draftHolidayDates.some(
        date =>
          format(date, 'yyyy-MM-dd') ===
          format(state.selectedDates[0], 'yyyy-MM-dd')
      ));

  // Get all draft holidays (existing + new)
  const allDraftHolidays = [
    ...state.existingDraftHolidays,
    ...state.draftHolidays,
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue='draft' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='draft'>Draft holidays</TabsTrigger>
              <TabsTrigger value='published'>Published holidays</TabsTrigger>
            </TabsList>

            <TabsContent value='draft' className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Calendar */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold'>Select Date</h3>
                  <div className='space-y-2'>
                    <CalendarComponent
                      mode='single'
                      selected={state.selectedDates[0] || undefined}
                      onSelect={date =>
                        actions.setSelectedDates(date ? [date] : [])
                      }
                      className='rounded-md border'
                      modifiers={calendarModifiers}
                      modifiersStyles={calendarModifierStyles}
                    />
                    <div className='text-xs text-muted-foreground space-y-1'>
                      {publishedHolidayDates.length > 0 && (
                        <div>
                          <span
                            className={cn(
                              'inline-block w-3 h-3 rounded mr-1',
                              scope === 'global' ? 'bg-primary' : 'bg-secondary'
                            )}
                          ></span>
                          {scope === 'global'
                            ? 'Global Published Holidays'
                            : 'Cohort Published Holidays'}
                        </div>
                      )}
                      {draftHolidayDates.length > 0 && (
                        <div>
                          <span className='inline-block w-3 h-3 bg-muted-foreground rounded mr-1'></span>
                          Draft holidays
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Draft Holidays List */}
                <div className='space-y-4'>
                  {allDraftHolidays.length > 0 && (
                    <HolidayList
                      title='Draft Holidays'
                      holidays={allDraftHolidays}
                      onDelete={handleDeleteHoliday}
                      onPublish={actions.publishExistingDraft}
                      isDraft={true}
                    />
                  )}

                  {/* Add Holiday Button */}
                  {state.selectedDates.length === 1 &&
                    !selectedDateHasHoliday && (
                      <div className='p-4 border rounded-lg'>
                        <p className='text-sm text-muted-foreground mb-3'>
                          Selected date:{' '}
                          {format(state.selectedDates[0], 'EEEE, MMMM d, yyyy')}
                        </p>
                        <Button
                          onClick={() => setAddHolidayModalOpen(true)}
                          className='w-full'
                        >
                          Add Holiday
                        </Button>
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              {allDraftHolidays.length > 0 && (
                <div className='flex gap-2 pt-4 border-t'>
                  <Button
                    onClick={actions.publishHolidays}
                    disabled={state.publishing || state.saving}
                  >
                    {state.publishing
                      ? 'Publishing...'
                      : 'Publish All Holidays'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={actions.saveDrafts}
                    disabled={state.publishing || state.saving}
                  >
                    {state.saving ? 'Saving...' : 'Save New Drafts'}
                  </Button>
                  <Button
                    variant='outline'
                    onClick={actions.clearDrafts}
                    disabled={state.publishing || state.saving}
                  >
                    Clear New Drafts
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value='published' className='space-y-6'>
              <HolidayList
                title='Published Holidays'
                holidays={state.publishedHolidays}
                onDelete={handleDeleteHoliday}
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

      {/* Add Holiday Modal */}
      <Dialog open={addHolidayModalOpen} onOpenChange={setAddHolidayModalOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a new holiday for{' '}
              {state.selectedDates[0]
                ? format(state.selectedDates[0], 'EEEE, MMMM d, yyyy')
                : 'selected date'}
            </DialogDescription>
          </DialogHeader>
          <HolidayForm
            selectedDates={state.selectedDates}
            publishedHolidays={state.publishedHolidays}
            existingDraftHolidays={state.existingDraftHolidays}
            onAddHoliday={handleAddHoliday}
            onClearDates={() => {
              setAddHolidayModalOpen(false);
              actions.setSelectedDates([]);
            }}
            onEditHoliday={handleEditHoliday}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the holiday "
              {holidayToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
