import React from 'react';
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
import { Switch } from '@/components/ui/switch';
import { SectionProps, months, years, qualifications } from './types';

const EducationInformationSection: React.FC<SectionProps> = ({
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
          Education Information
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
          Tell us about your educational background
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Qualification - First Field */}
          <div className='space-y-2'>
            <Label htmlFor='highest_education_level'>Qualification *</Label>
            <Select
              value={formData.highest_education_level}
              onValueChange={value =>
                onInputChange('highest_education_level', value)
              }
            >
              <SelectTrigger
                tabIndex={14}
                className={
                  getError('highest_education_level') ? 'border-red-500' : ''
                }
              >
                <SelectValue placeholder='Select your qualification' />
              </SelectTrigger>
              <SelectContent>
                {qualifications.map(qual => (
                  <SelectItem key={qual} value={qual}>
                    {qual}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getError('highest_education_level') && (
              <p className='text-sm text-red-500'>
                {getError('highest_education_level')}
              </p>
            )}
          </div>

          {/* Field of Study */}
          <div className='space-y-2'>
            <Label htmlFor='field_of_study'>Field of Study</Label>
            <Input
              id='field_of_study'
              value={formData.field_of_study}
              onChange={e => onInputChange('field_of_study', e.target.value)}
              onBlur={() => onInputBlur('field_of_study')}
              tabIndex={15}
              placeholder='e.g., Computer Science, Engineering, etc.'
            />
          </div>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Institution Name - First field in right column */}
          <div className='space-y-2'>
            <Label htmlFor='institution_name'>Institution Name *</Label>
            <Input
              id='institution_name'
              value={formData.institution_name}
              onChange={e => onInputChange('institution_name', e.target.value)}
              onBlur={() => onInputBlur('institution_name')}
              tabIndex={16}
              className={getError('institution_name') ? 'border-red-500' : ''}
              placeholder='Enter your institution name'
            />
            {getError('institution_name') && (
              <p className='text-sm text-red-500'>
                {getError('institution_name')}
              </p>
            )}
          </div>

          {/* Graduation Month and Year */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='graduation_month'>Graduation Month</Label>
              <Select
                value={formData.graduation_month}
                onValueChange={value =>
                  onInputChange('graduation_month', value)
                }
              >
                <SelectTrigger tabIndex={17}>
                  <SelectValue placeholder='Select month' />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='graduation_year'>Graduation Year *</Label>
              <Select
                value={formData.graduation_year?.toString() || ''}
                onValueChange={value =>
                  onInputChange('graduation_year', parseInt(value))
                }
              >
                <SelectTrigger
                  tabIndex={18}
                  className={
                    getError('graduation_year') ? 'border-red-500' : ''
                  }
                >
                  <SelectValue placeholder='Select year' />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError('graduation_year') && (
                <p className='text-sm text-red-500'>
                  {getError('graduation_year')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Experience Section */}
      <div className='space-y-4'>
        <div className='flex items-center space-x-2'>
          <Switch
            id='has_work_experience'
            checked={formData.has_work_experience}
            onCheckedChange={checked =>
              onInputChange('has_work_experience', checked)
            }
            tabIndex={19}
          />
          <Label htmlFor='has_work_experience'>
            Do you have work experience?
          </Label>
        </div>

        {formData.has_work_experience && (
          <div className='space-y-6 pl-4 border-l-2 border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column */}
              <div className='space-y-6'>
                {/* Work Experience Type */}
                <div className='space-y-2'>
                  <Label htmlFor='work_experience_type'>
                    Work Experience Type *
                  </Label>
                  <Select
                    value={formData.work_experience_type}
                    onValueChange={value =>
                      onInputChange('work_experience_type', value)
                    }
                    onOpenChange={open =>
                      !open && onInputBlur('work_experience_type')
                    }
                  >
                    <SelectTrigger
                      tabIndex={20}
                      className={
                        getError('work_experience_type') ? 'border-red-500' : ''
                      }
                    >
                      <SelectValue placeholder='Select work experience type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Employee'>Employee</SelectItem>
                      <SelectItem value='Freelancer'>Freelancer</SelectItem>
                      <SelectItem value='Intern'>Intern</SelectItem>
                      <SelectItem value='Contract'>Contract</SelectItem>
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {getError('work_experience_type') && (
                    <p className='text-sm text-red-500'>
                      {getError('work_experience_type')}
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div className='space-y-2'>
                  <Label htmlFor='company_name'>Company Name *</Label>
                  <Input
                    id='company_name'
                    value={formData.company_name}
                    onChange={e =>
                      onInputChange('company_name', e.target.value)
                    }
                    onBlur={() => onInputBlur('company_name')}
                    tabIndex={21}
                    className={getError('company_name') ? 'border-red-500' : ''}
                    placeholder='Enter company name'
                  />
                  {getError('company_name') && (
                    <p className='text-sm text-red-500'>
                      {getError('company_name')}
                    </p>
                  )}
                </div>

                {/* Work Start Date */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='work_start_month'>Start Month</Label>
                    <Select
                      value={formData.work_start_month}
                      onValueChange={value =>
                        onInputChange('work_start_month', value)
                      }
                      onOpenChange={open =>
                        !open && onInputBlur('work_start_month')
                      }
                    >
                      <SelectTrigger tabIndex={22}>
                        <SelectValue placeholder='Select month' />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='work_start_year'>Start Year</Label>
                    <Select
                      value={formData.work_start_year?.toString() || ''}
                      onValueChange={value =>
                        onInputChange('work_start_year', parseInt(value))
                      }
                      onOpenChange={open =>
                        !open && onInputBlur('work_start_year')
                      }
                    >
                      <SelectTrigger tabIndex={23}>
                        <SelectValue placeholder='Select year' />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className='space-y-6'>
                {/* Job Description */}
                <div className='space-y-2'>
                  <Label htmlFor='job_description'>Job Description</Label>
                  <Textarea
                    id='job_description'
                    value={formData.job_description}
                    onChange={e =>
                      onInputChange('job_description', e.target.value)
                    }
                    onBlur={() => onInputBlur('job_description')}
                    tabIndex={24}
                    placeholder='Describe your role and responsibilities'
                    rows={3}
                  />
                </div>

                {/* Work End Date */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='work_end_month'>End Month</Label>
                    <Select
                      value={formData.work_end_month}
                      onValueChange={value =>
                        onInputChange('work_end_month', value)
                      }
                      onOpenChange={open =>
                        !open && onInputBlur('work_end_month')
                      }
                    >
                      <SelectTrigger tabIndex={25}>
                        <SelectValue placeholder='Select month' />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='work_end_year'>End Year</Label>
                    <Select
                      value={formData.work_end_year?.toString() || ''}
                      onValueChange={value =>
                        onInputChange('work_end_year', parseInt(value))
                      }
                      onOpenChange={open =>
                        !open && onInputBlur('work_end_year')
                      }
                    >
                      <SelectTrigger tabIndex={26}>
                        <SelectValue placeholder='Select year' />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationInformationSection;
