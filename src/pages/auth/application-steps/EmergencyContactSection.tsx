import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionProps } from './types';

const EmergencyContactSection: React.FC<SectionProps> = ({
  formData,
  errors,
  onInputChange,
  onInputBlur,
  getError,
}) => {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 dark:border-gray-700 pb-4'>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Emergency Contact Details
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
          Please provide an emergency contact person
        </p>
      </div>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='emergency_first_name'>
              Emergency Contact First Name *
            </Label>
            <Input
              id='emergency_first_name'
              value={formData.emergency_first_name}
              onChange={e =>
                onInputChange('emergency_first_name', e.target.value)
              }
              onBlur={() => onInputBlur('emergency_first_name')}
              tabIndex={37}
              className={
                getError('emergency_first_name') ? 'border-red-500' : ''
              }
              placeholder='Enter emergency contact first name'
            />
            {getError('emergency_first_name') && (
              <p className='text-sm text-red-500'>
                {getError('emergency_first_name')}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='emergency_last_name'>
              Emergency Contact Last Name *
            </Label>
            <Input
              id='emergency_last_name'
              value={formData.emergency_last_name}
              onChange={e =>
                onInputChange('emergency_last_name', e.target.value)
              }
              onBlur={() => onInputBlur('emergency_last_name')}
              tabIndex={38}
              className={
                getError('emergency_last_name') ? 'border-red-500' : ''
              }
              placeholder='Enter emergency contact last name'
            />
            {getError('emergency_last_name') && (
              <p className='text-sm text-red-500'>
                {getError('emergency_last_name')}
              </p>
            )}
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='emergency_contact_no'>
              Emergency Contact Number *
            </Label>
            <Input
              id='emergency_contact_no'
              type='tel'
              value={formData.emergency_contact_no}
              onChange={e =>
                onInputChange('emergency_contact_no', e.target.value)
              }
              onBlur={() => onInputBlur('emergency_contact_no')}
              tabIndex={39}
              className={
                getError('emergency_contact_no') ? 'border-red-500' : ''
              }
              placeholder='+91 00000 00000'
            />
            {getError('emergency_contact_no') && (
              <p className='text-sm text-red-500'>
                {getError('emergency_contact_no')}
              </p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='emergency_relationship'>Relationship *</Label>
            <Select
              value={formData.emergency_relationship}
              onValueChange={value =>
                onInputChange('emergency_relationship', value)
              }
            >
              <SelectTrigger
                tabIndex={40}
                className={
                  getError('emergency_relationship') ? 'border-red-500' : ''
                }
              >
                <SelectValue placeholder='Select relationship' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Parent'>Parent</SelectItem>
                <SelectItem value='Sibling'>Sibling</SelectItem>
                <SelectItem value='Spouse'>Spouse</SelectItem>
                <SelectItem value='Guardian'>Guardian</SelectItem>
                <SelectItem value='Friend'>Friend</SelectItem>
                <SelectItem value='Other'>Other</SelectItem>
              </SelectContent>
            </Select>
            {getError('emergency_relationship') && (
              <p className='text-sm text-red-500'>
                {getError('emergency_relationship')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactSection;
