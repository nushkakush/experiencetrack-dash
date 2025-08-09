import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Trash2, Edit2, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { HolidaysService } from '@/services/holidays.service';
import type { Holiday, SelectedHoliday } from '@/types/holiday';

interface GlobalHolidayManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalHolidayManagementDialog({
  open,
  onOpenChange,
}: GlobalHolidayManagementDialogProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [draftHolidays, setDraftHolidays] = useState<SelectedHoliday[]>([]);
  const [publishedHolidays, setPublishedHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<'draft' | 'live'>('draft');

  // Load existing holidays when dialog opens
  useEffect(() => {
    if (open) {
      loadHolidays();
    }
  }, [open]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const [drafts, published] = await Promise.all([
        HolidaysService.getGlobalHolidays('draft'),
        HolidaysService.getGlobalHolidays('published'),
      ]);

      // Convert draft holidays to SelectedHoliday format
      const draftSelected: SelectedHoliday[] = drafts.map(holiday => ({
        id: holiday.id,
        date: holiday.date,
        title: holiday.title,
        description: holiday.description || '',
        isNew: false,
      }));

      setDraftHolidays(draftSelected);
      setPublishedHolidays(published);

      // Set selected dates for calendar
      const draftDates = drafts.map(h => parseISO(h.date));
      setSelectedDates(draftDates);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const isAlreadySelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateString);

    if (isAlreadySelected) {
      // Remove the date and its holiday
      setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateString));
      setDraftHolidays(prev => prev.filter(h => h.date !== dateString));
    } else {
      // Add the date and create a new holiday entry
      setSelectedDates(prev => [...prev, date]);
      setDraftHolidays(prev => [
        ...prev,
        {
          date: dateString,
          title: '',
          description: '',
          isNew: true,
        },
      ]);
    }
  };

  const updateHolidayDetails = (date: string, field: 'title' | 'description', value: string) => {
    setDraftHolidays(prev =>
      prev.map(holiday =>
        holiday.date === date ? { ...holiday, [field]: value } : holiday
      )
    );
  };

  const removeHoliday = async (date: string) => {
    try {
      // Find the holiday to remove
      const holidayToRemove = draftHolidays.find(h => h.date === date);
      
      // If it has an ID, it exists in the database and needs to be deleted
      if (holidayToRemove?.id) {
        await HolidaysService.deleteHoliday(holidayToRemove.id);
      }
      
      // Remove from local state
      setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== date));
      setDraftHolidays(prev => prev.filter(h => h.date !== date));
      
      if (holidayToRemove?.id) {
        toast.success('Holiday deleted successfully');
      }
    } catch (error) {
      console.error('Failed to remove holiday:', error);
      toast.error('Failed to remove holiday');
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const validHolidays = draftHolidays.filter(h => h.title.trim());
      
      if (validHolidays.length === 0) {
        toast.error('Please add at least one holiday with a title');
        return;
      }

      // Separate new holidays from existing ones
      const newHolidays = validHolidays.filter(h => !h.id);
      const existingHolidays = validHolidays.filter(h => h.id);

      // Create new holidays
      if (newHolidays.length > 0) {
        const newHolidayRequests = newHolidays.map(holiday => ({
          date: holiday.date,
          title: holiday.title.trim(),
          description: holiday.description?.trim() || '',
          holiday_type: 'global' as const,
          status: 'draft' as const,
        }));
        await HolidaysService.upsertHolidays(newHolidayRequests);
      }

      // Update existing holidays
      for (const holiday of existingHolidays) {
        await HolidaysService.updateHoliday({
          id: holiday.id!,
          title: holiday.title.trim(),
          description: holiday.description?.trim() || '',
        });
      }

      toast.success('Draft saved successfully');
      await loadHolidays(); // Reload to get IDs for new holidays
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const publishHolidays = async () => {
    setPublishing(true);
    try {
      // First save any unsaved drafts
      await saveDraft();
      
      // Reload to get the latest state with IDs for newly created holidays
      await loadHolidays();
      
      // Get all current draft holidays from the database (fresh data)
      const currentDrafts = await HolidaysService.getGlobalHolidays('draft');
      const draftIds = currentDrafts.map(h => h.id);

      if (draftIds.length === 0) {
        toast.error('No holidays to publish');
        return;
      }

      await HolidaysService.publishHolidays(draftIds);
      toast.success('Holidays published successfully');
      
      // Clear drafts and reload to show published holidays
      setDraftHolidays([]);
      setSelectedDates([]);
      await loadHolidays();
      setActiveTab('live');
    } catch (error) {
      console.error('Failed to publish holidays:', error);
      toast.error('Failed to publish holidays');
    } finally {
      setPublishing(false);
    }
  };

  const clearAll = async () => {
    try {
      // Find holidays that exist in database (have IDs)
      const existingHolidays = draftHolidays.filter(h => h.id);
      
      // Delete existing holidays from database
      if (existingHolidays.length > 0) {
        await Promise.all(
          existingHolidays.map(holiday => 
            HolidaysService.deleteHoliday(holiday.id!)
          )
        );
        toast.success(`${existingHolidays.length} draft holiday(s) deleted`);
      }
      
      // Clear local state
      setSelectedDates([]);
      setDraftHolidays([]);
    } catch (error) {
      console.error('Failed to clear holidays:', error);
      toast.error('Failed to clear some holidays');
      // Still clear local state even if some deletions failed
      setSelectedDates([]);
      setDraftHolidays([]);
    }
  };

  const deletePublishedHoliday = async (holidayId: string) => {
    try {
      await HolidaysService.deleteHoliday(holidayId);
      toast.success('Holiday deleted successfully');
      await loadHolidays();
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error('Failed to delete holiday');
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Global Holiday Management
            </DialogTitle>
            <DialogDescription>
              Loading holidays...
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Global Holiday Management
          </DialogTitle>
          <DialogDescription>
            Manage global holidays that apply to all cohorts. Global holidays affect attendance calculations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draft' | 'live')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Draft ({draftHolidays.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Live ({publishedHolidays.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select dates on the calendar and add holiday details. Save as draft or publish to make them live.
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Holiday Dates</h3>
                <CalendarComponent
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => {
                    if (Array.isArray(dates)) {
                      // Handle multiple date selection by comparing with current selection
                      const newDate = dates.find(date => 
                        !selectedDates.some(selected => 
                          format(selected, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                        )
                      );
                      if (newDate) {
                        handleDateSelect(newDate);
                      }
                    }
                  }}
                  modifiers={{
                    published: publishedHolidays.map(h => parseISO(h.date))
                  }}
                  modifiersStyles={{
                    published: {
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                  disabled={publishedHolidays.map(h => parseISO(h.date))}
                  className="rounded-md border"
                />
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Draft holidays</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-destructive rounded"></div>
                    <span>Published holidays</span>
                  </div>
                </div>
              </div>

              {/* Holiday Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Holiday Notes</h3>
                  {draftHolidays.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                {draftHolidays.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No dates selected</p>
                    <p className="text-sm">Select dates from the calendar to add holiday details</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {draftHolidays
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((holiday) => (
                        <Card key={holiday.date}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">
                                {format(parseISO(holiday.date), 'EEEE, MMMM d, yyyy')}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeHoliday(holiday.date)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Input
                              placeholder="Holiday title *"
                              value={holiday.title}
                              onChange={(e) =>
                                updateHolidayDetails(holiday.date, 'title', e.target.value)
                              }
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={holiday.description}
                              onChange={(e) =>
                                updateHolidayDetails(holiday.date, 'description', e.target.value)
                              }
                              rows={2}
                            />
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {draftHolidays.length > 0 && (
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveDraft}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={publishHolidays}
                    disabled={publishing || draftHolidays.every(h => !h.title.trim())}
                  >
                    {publishing ? 'Publishing...' : 'Publish'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Live holidays are currently active and affecting attendance calculations.
            </div>

            {publishedHolidays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>No published holidays</p>
                <p className="text-sm">Publish some holidays from the draft tab to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {publishedHolidays
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((holiday) => (
                    <Card key={holiday.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{holiday.title}</h4>
                              <Badge variant="secondary">Live</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(holiday.date), 'EEEE, MMMM d, yyyy')}
                            </p>
                            {holiday.description && (
                              <p className="text-sm">{holiday.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePublishedHoliday(holiday.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
