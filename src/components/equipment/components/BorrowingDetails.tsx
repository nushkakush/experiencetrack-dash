import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { IssuanceFormData } from '../schemas/issuanceFormSchema';

interface BorrowingDetailsProps {
  form: UseFormReturn<IssuanceFormData>;
}

export const BorrowingDetails: React.FC<BorrowingDetailsProps> = ({ form }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='reason'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Purpose of Borrowing *</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Describe the purpose for borrowing this equipment...'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='expected_return_date'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Date *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type='button'
                      variant='outline'
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        (() => {
                          try {
                            return format(new Date(field.value), 'PPP');
                          } catch {
                            return 'Invalid Date';
                          }
                        })()
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={date => {
                      setSelectedDate(date);
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    disabled={date => {
                      // Allow today's date but not past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='expected_return_time'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Time *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select time' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={hour} value={`${hour}:00`}>
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='notes'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Any additional notes or special instructions...'
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
