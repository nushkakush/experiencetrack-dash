import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ApplicationData } from '../ApplicationProcess';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface InterviewStepProps {
  data: ApplicationData;
  onComplete: (data: Partial<ApplicationData>) => void;
  onSave: (data: Partial<ApplicationData>) => void;
  saving: boolean;
}

const InterviewStep = ({
  data,
  onComplete,
  onSave,
  saving,
}: InterviewStepProps) => {
  const [formData, setFormData] = useState({
    preferredDate: data.interview?.preferredDate || '',
    preferredTime: data.interview?.preferredTime || '',
    timezone: data.interview?.timezone || 'Asia/Kolkata',
    additionalNotes: data.interview?.additionalNotes || '',
  });

  const [date, setDate] = useState<Date | undefined>(
    data.interview?.preferredDate
      ? new Date(data.interview.preferredDate)
      : undefined
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const timeSlots = [
    { value: '09:00', label: '9:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '17:00', label: '5:00 PM' },
  ];

  const timezones = [
    { value: 'Asia/Kolkata', label: 'IST (UTC+5:30)' },
    { value: 'UTC', label: 'UTC (UTC+0)' },
    { value: 'America/New_York', label: 'EST (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'PST (UTC-8)' },
    { value: 'Europe/London', label: 'GMT (UTC+0)' },
    { value: 'Europe/Berlin', label: 'CET (UTC+1)' },
    { value: 'Asia/Tokyo', label: 'JST (UTC+9)' },
    { value: 'Australia/Sydney', label: 'AEST (UTC+10)' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setFormData(prev => ({
        ...prev,
        preferredDate: selectedDate.toISOString().split('T')[0],
      }));
      setIsDatePickerOpen(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Please select a preferred date';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.preferredDate = 'Please select a future date';
      }
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Please select a preferred time';
    }

    if (!formData.timezone) {
      newErrors.timezone = 'Please select your timezone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    onSave({
      interview: formData,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete({
        interview: formData,
      });
    } else {
      // Show the first validation error or a summary if multiple errors
      const errorKeys = Object.keys(errors);
      if (errorKeys.length === 1) {
        toast.error(errors[errorKeys[0]]);
      } else {
        toast.error(
          `Please fix the following errors: ${errorKeys
            .slice(0, 3)
            .map(key => errors[key])
            .join(', ')}${errorKeys.length > 3 ? '...' : ''}`
        );
      }
    }
  };

  const getError = (field: string) => {
    return errors[field] || '';
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className='space-y-6'>
      {/* Interview Information */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Phone className='h-5 w-5' />
            <span>Interview Scheduling</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <Video className='h-5 w-5 text-blue-600 mt-0.5' />
              <div>
                <h4 className='font-medium text-blue-900'>Interview Details</h4>
                <p className='text-sm text-blue-700 mt-1'>
                  Your interview will be conducted via video call. Please ensure
                  you have a stable internet connection and a quiet environment.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Date Selection */}
            <div className='space-y-2'>
              <Label>Preferred Date *</Label>
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground',
                      getError('preferredDate') && 'border-red-500'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {date ? format(date, 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {getError('preferredDate') && (
                <p className='text-sm text-red-500'>
                  {getError('preferredDate')}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className='space-y-2'>
              <Label>Preferred Time *</Label>
              <Select
                value={formData.preferredTime}
                onValueChange={value =>
                  handleInputChange('preferredTime', value)
                }
              >
                <SelectTrigger
                  className={getError('preferredTime') ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder='Select a time slot' />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      <div className='flex items-center space-x-2'>
                        <Clock className='h-4 w-4' />
                        <span>{slot.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError('preferredTime') && (
                <p className='text-sm text-red-500'>
                  {getError('preferredTime')}
                </p>
              )}
            </div>

            {/* Timezone Selection */}
            <div className='space-y-2'>
              <Label>Your Timezone *</Label>
              <Select
                value={formData.timezone}
                onValueChange={value => handleInputChange('timezone', value)}
              >
                <SelectTrigger
                  className={getError('timezone') ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder='Select your timezone' />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError('timezone') && (
                <p className='text-sm text-red-500'>{getError('timezone')}</p>
              )}
            </div>

            {/* Additional Notes */}
            <div className='space-y-2'>
              <Label htmlFor='additionalNotes'>
                Additional Notes (Optional)
              </Label>
              <Textarea
                id='additionalNotes'
                value={formData.additionalNotes}
                onChange={e =>
                  handleInputChange('additionalNotes', e.target.value)
                }
                rows={4}
                placeholder='Any specific requirements or notes for the interview...'
              />
            </div>

            {/* Interview Guidelines */}
            <Card className='bg-gray-50'>
              <CardContent className='pt-6'>
                <h4 className='font-medium mb-3'>Interview Guidelines</h4>
                <ul className='text-sm text-muted-foreground space-y-2'>
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet, well-lit environment</li>
                  <li>• Test your camera and microphone beforehand</li>
                  <li>• Have your resume and application details ready</li>
                  <li>• Join the call 5 minutes before the scheduled time</li>
                  <li>• Dress professionally for the interview</li>
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className='flex justify-between'>
              <Button
                type='button'
                variant='outline'
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <Button type='submit' disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Continue to LITMUS Test'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewStep;
