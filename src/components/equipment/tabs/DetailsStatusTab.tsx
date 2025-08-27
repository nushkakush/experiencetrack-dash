import React from 'react';
import { Control } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateEquipmentFormData } from '@/domains/equipment/types';

interface DetailsStatusTabProps {
  control: Control<CreateEquipmentFormData>;
}

export const DetailsStatusTab: React.FC<DetailsStatusTabProps> = ({
  control,
}) => {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='purchase_date'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Date</FormLabel>
              <FormControl>
                <Input type='date' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='purchase_cost'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Cost</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='0.01'
                  placeholder='0.00'
                  {...field}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={control}
          name='condition_status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='excellent'>Excellent</SelectItem>
                  <SelectItem value='good'>Good</SelectItem>
                  <SelectItem value='poor'>Poor</SelectItem>
                  <SelectItem value='damaged'>Damaged</SelectItem>
                  <SelectItem value='under_repair'>Under Repair</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='availability_status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='available'>Available</SelectItem>
                  <SelectItem value='maintenance'>Maintenance</SelectItem>
                  <SelectItem value='retired'>Retired</SelectItem>
                  <SelectItem value='lost'>Lost</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name='condition_notes'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condition Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Any additional notes about the equipment condition...'
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
