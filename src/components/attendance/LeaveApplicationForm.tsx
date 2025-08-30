import React, { useState, useEffect } from 'react';
import { format, addDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CreateLeaveApplicationRequest,
  LeaveApplication,
} from '@/types/attendance';
import { supabase } from '@/integrations/supabase/client';

interface LeaveApplicationFormProps {
  studentId: string;
  cohortId: string;
  epicId?: string;
  onSubmit: (data: CreateLeaveApplicationRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

interface CohortData {
  sessions_per_day: number;
}

const commonReasons = [
  'Medical appointment',
  'Personal emergency',
  'Family function',
  'Travel',
  'Illness',
  'Other',
];

export const LeaveApplicationForm: React.FC<LeaveApplicationFormProps> = ({
  studentId,
  cohortId,
  epicId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [isDateRange, setIsDateRange] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [loadingCohort, setLoadingCohort] = useState(true);
  const [existingLeaveApplications, setExistingLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [loadingLeaveApplications, setLoadingLeaveApplications] =
    useState(true);

  // Fetch cohort data to get sessions_per_day
  useEffect(() => {
    const fetchCohortData = async () => {
      try {
        const { data, error } = await supabase
          .from('cohorts')
          .select('sessions_per_day')
          .eq('id', cohortId)
          .single();

        if (error) throw error;
        setCohortData(data);
      } catch (error) {
        console.error('Error fetching cohort data:', error);
        toast.error('Failed to load cohort information');
      } finally {
        setLoadingCohort(false);
      }
    };

    fetchCohortData();
  }, [cohortId]);

  // Fetch existing leave applications for the student
  useEffect(() => {
    const fetchExistingLeaveApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('leave_applications')
          .select('*')
          .eq('student_id', studentId)
          .eq('cohort_id', cohortId)
          .order('session_date', { ascending: true });

        if (error) throw error;
        setExistingLeaveApplications(data || []);
      } catch (error) {
        console.error('Error fetching existing leave applications:', error);
        toast.error('Failed to load existing leave applications');
      } finally {
        setLoadingLeaveApplications(false);
      }
    };

    fetchExistingLeaveApplications();
  }, [studentId, cohortId]);

  // Session selection colors
  const sessionColors = [
    'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
    'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
    'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300',
    'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300',
    'bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300',
    'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-300',
  ];

  const handleSessionToggle = (sessionNum: number) => {
    setSelectedSessions(prev =>
      prev.includes(sessionNum)
        ? prev.filter(s => s !== sessionNum)
        : [...prev, sessionNum]
    );
  };

  // Helper functions for leave application status
  const getLeaveApplicationForDate = (date: Date): LeaveApplication | null => {
    const dateString = format(date, 'yyyy-MM-dd');
    return (
      existingLeaveApplications.find(app => {
        if (app.is_date_range && app.end_date) {
          // Check if date falls within the range
          const appStart = new Date(app.session_date);
          const appEnd = new Date(app.end_date);
          const checkDate = new Date(dateString);
          return checkDate >= appStart && checkDate <= appEnd;
        } else {
          // Single date application
          return app.session_date === dateString;
        }
      }) || null
    );
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Disable dates with existing leave applications
    const existingLeave = getLeaveApplicationForDate(date);
    return !!existingLeave;
  };

  const getDateRangeDays = (): Date[] => {
    if (!startDate || !endDate) return [];
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLeaveStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Leave Approved';
      case 'pending':
        return 'Leave Pending';
      case 'rejected':
        return 'Leave Rejected';
      default:
        return 'Unknown Status';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDateRange) {
      if (!startDate || !endDate) {
        toast.error('Please select both start and end dates');
        return;
      }

      if (startDate > endDate) {
        toast.error('End date must be after start date');
        return;
      }
    } else {
      if (!startDate) {
        toast.error('Please select a date');
        return;
      }
    }

    // Check if there are existing leave applications for any of the selected dates
    const datesToCheck = isDateRange ? getDateRangeDays() : [startDate!];
    for (const date of datesToCheck) {
      const existingLeave = getLeaveApplicationForDate(date);
      if (existingLeave) {
        toast.error(
          `You already have a ${existingLeave.leave_status} leave application for ${format(date, 'MMM dd, yyyy')}`
        );
        return;
      }
    }

    if (!reason || (reason === 'Other' && !customReason.trim())) {
      toast.error('Please provide a reason for leave');
      return;
    }

    // Validate session selection
    if (
      cohortData &&
      cohortData.sessions_per_day > 1 &&
      selectedSessions.length === 0
    ) {
      toast.error('Please select at least one session');
      return;
    }

    const finalReason = reason === 'Other' ? customReason : reason;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedStartDate = new Date(startDate!);
    selectedStartDate.setHours(0, 0, 0, 0);

    if (selectedStartDate < today) {
      toast.error('Cannot apply for leave on a past date');
      return;
    }

    try {
      const leaveData: CreateLeaveApplicationRequest = {
        student_id: studentId,
        cohort_id: cohortId,
        epic_id: epicId,
        session_date: format(startDate!, 'yyyy-MM-dd'),
        end_date: isDateRange ? format(endDate!, 'yyyy-MM-dd') : undefined,
        is_date_range: isDateRange,
        session_number:
          cohortData?.sessions_per_day === 1 ? 1 : selectedSessions[0] || 1,
        reason: finalReason,
      };

      await onSubmit(leaveData);

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setIsDateRange(false);
      setReason('');
      setCustomReason('');
      setSessionNumber(1);
      setSelectedSessions([]);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleReasonChange = (selectedReason: string) => {
    setReason(selectedReason);
    if (selectedReason !== 'Other') {
      setCustomReason('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {/* Date Range Toggle */}
      <div className='flex items-center space-x-2'>
        <Switch
          id='date-range'
          checked={isDateRange}
          onCheckedChange={setIsDateRange}
          disabled={loading}
        />
        <Label htmlFor='date-range'>Apply for multiple days</Label>
      </div>

      {/* Date Selection */}
      <div className='space-y-2'>
        <Label htmlFor='start-date'>
          {isDateRange ? 'Start Date *' : 'Leave Date *'}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
              disabled={loading || loadingLeaveApplications}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {startDate
                ? format(startDate, 'PPP')
                : `Pick ${isDateRange ? 'start' : 'a'} date`}
              {loadingLeaveApplications && (
                <Loader2 className='ml-2 h-4 w-4 animate-spin' />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <TooltipProvider>
              <Calendar
                mode='single'
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                disabled={isDateDisabled}
                components={{
                  Day: ({ date: dayDate, ...props }) => {
                    const existingLeave = getLeaveApplicationForDate(dayDate);
                    const isDisabled = isDateDisabled(dayDate);

                    if (existingLeave) {
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-9 h-9 flex items-center justify-center text-sm rounded-md cursor-not-allowed border',
                                getLeaveStatusColor(existingLeave.leave_status)
                              )}
                            >
                              {dayDate.getDate()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className='text-center'>
                              <div className='font-medium'>
                                {getLeaveStatusText(existingLeave.leave_status)}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                Session {existingLeave.session_number}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {existingLeave.reason}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <div
                        className={cn(
                          'w-9 h-9 flex items-center justify-center text-sm rounded-md',
                          isDisabled
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                        )}
                        onClick={() => !isDisabled && setStartDate(dayDate)}
                      >
                        {dayDate.getDate()}
                      </div>
                    );
                  },
                }}
              />
              <div className='p-3 border-t'>
                <div className='text-xs text-muted-foreground flex items-center justify-center gap-4'>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-sm bg-green-100 border border-green-300'></div>
                    <span>Approved</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300'></div>
                    <span>Pending</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-sm bg-red-100 border border-red-300'></div>
                    <span>Rejected</span>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date Selection (only for date range) */}
      {isDateRange && (
        <div className='space-y-2'>
          <Label htmlFor='end-date'>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
                disabled={loading || loadingLeaveApplications || !startDate}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                {loadingLeaveApplications && (
                  <Loader2 className='ml-2 h-4 w-4 animate-spin' />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={date => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  // Disable past dates
                  if (date < today) return true;

                  // Disable dates before start date
                  if (startDate && date < startDate) return true;

                  // Disable dates with existing leave applications
                  const existingLeave = getLeaveApplicationForDate(date);
                  return !!existingLeave;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Date Range Summary */}
      {isDateRange && startDate && endDate && (
        <div className='p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg'>
          <p className='text-sm text-blue-700 dark:text-blue-300'>
            <strong>Leave Period:</strong> {format(startDate, 'MMM dd, yyyy')}{' '}
            to {format(endDate, 'MMM dd, yyyy')}
            <br />
            <span className='text-xs'>
              Total days: {getDateRangeDays().length} day
              {getDateRangeDays().length !== 1 ? 's' : ''}
            </span>
          </p>
        </div>
      )}

      {/* Session Selection */}
      {!loadingCohort && cohortData && cohortData.sessions_per_day > 1 && (
        <div className='space-y-2'>
          <Label>Select Sessions *</Label>
          <div className='flex flex-wrap gap-2'>
            {Array.from(
              { length: cohortData.sessions_per_day },
              (_, i) => i + 1
            ).map(sessionNum => (
              <Badge
                key={sessionNum}
                variant='outline'
                className={cn(
                  'cursor-pointer transition-colors',
                  sessionColors[(sessionNum - 1) % sessionColors.length],
                  selectedSessions.includes(sessionNum) &&
                    'ring-2 ring-offset-2 ring-blue-500'
                )}
                onClick={() => handleSessionToggle(sessionNum)}
              >
                Session {sessionNum}
              </Badge>
            ))}
          </div>
          <p className='text-xs text-muted-foreground'>
            Click to select/deselect sessions. You can select multiple sessions.
          </p>
        </div>
      )}

      {/* Reason Selection */}
      <div className='space-y-2'>
        <Label>Reason for Leave *</Label>
        <div className='grid grid-cols-2 gap-2'>
          {commonReasons.map(commonReason => (
            <Button
              key={commonReason}
              type='button'
              variant={reason === commonReason ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleReasonChange(commonReason)}
              disabled={loading}
              className='justify-start'
            >
              {commonReason}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Reason */}
      {reason === 'Other' && (
        <div className='space-y-2'>
          <Label htmlFor='custom-reason'>Please specify reason *</Label>
          <Textarea
            id='custom-reason'
            placeholder='Please provide details about your leave request...'
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            disabled={loading}
            rows={3}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-2 pt-4'>
        <Button
          type='submit'
          disabled={
            loading ||
            loadingLeaveApplications ||
            !startDate ||
            (isDateRange && !endDate) ||
            !reason ||
            (reason === 'Other' && !customReason.trim()) ||
            (cohortData &&
              cohortData.sessions_per_day > 1 &&
              selectedSessions.length === 0)
          }
          className='flex-1'
        >
          {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Submit Application
          {isDateRange && startDate && endDate
            ? ` (${getDateRangeDays().length} days)`
            : ''}
        </Button>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
