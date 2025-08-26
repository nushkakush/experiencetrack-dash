import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NewFeeStructureInput, PaymentPlan } from '@/types/fee';

interface Step1FeeStructureProps {
  data: NewFeeStructureInput;
  onChange: (data: NewFeeStructureInput) => void;
  errors?: Record<string, string>;
  isReadOnly?: boolean;
  selectedPaymentPlan?: PaymentPlan;
  isStudentCustomMode?: boolean;
}

export default function Step1FeeStructure({
  data,
  onChange,
  errors,
  isReadOnly = false,
  selectedPaymentPlan,
  isStudentCustomMode = false,
}: Step1FeeStructureProps) {
  const handleChange = (
    field: keyof NewFeeStructureInput,
    value: string | number | boolean
  ) => {
    if (isReadOnly) {
      console.log('🔧 [handleChange] Blocked - isReadOnly is true');
      return; // Prevent changes in read-only mode
    }

    let processedValue: number;

    if (typeof value === 'string') {
      // Remove commas and convert to number
      const cleanValue = value.replace(/,/g, '');
      processedValue = parseFloat(cleanValue) || 0;
    } else {
      processedValue = value;
    }

    const newData = {
      ...data,
      [field]: processedValue,
    };

    onChange(newData);
  };

  const formatIndianNumber = (value: number): string => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const ReadOnlyField = ({
    label,
    value,
    suffix = '',
  }: {
    label: string;
    value: string | number;
    suffix?: string;
  }) => (
    <div className='space-y-2'>
      <Label className='text-sm font-medium text-muted-foreground'>
        {label}
      </Label>
      <div className='p-3 bg-muted/50 rounded-md border'>
        <span className='text-lg font-semibold'>
          {value}
          {suffix}
        </span>
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Title and description removed to avoid duplication with modal header */}

      <div className='grid gap-8'>
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {isReadOnly ? (
              <>
                <ReadOnlyField
                  label='Admission Fee'
                  value={`₹${formatIndianNumber(data.admission_fee)}`}
                />
                <ReadOnlyField
                  label='Total Program Fee'
                  value={`₹${formatIndianNumber(data.total_program_fee)}`}
                />
              </>
            ) : (
              <>
                <div className='space-y-2'>
                  <Label htmlFor='admission_fee'>Admission Fee (₹)</Label>
                  <Input
                    id='admission_fee'
                    type='text'
                    value={formatIndianNumber(data.admission_fee)}
                    onChange={e =>
                      handleChange('admission_fee', e.target.value)
                    }
                    placeholder='0.00'
                    className={errors?.admission_fee ? 'border-red-500' : ''}
                  />
                  {errors?.admission_fee && (
                    <p className='text-sm text-red-500'>
                      {errors.admission_fee}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='total_program_fee'>
                    Total Program Fee (₹)
                  </Label>
                  <Input
                    id='total_program_fee'
                    type='text'
                    value={formatIndianNumber(data.total_program_fee)}
                    onChange={e =>
                      handleChange('total_program_fee', e.target.value)
                    }
                    placeholder='0.00'
                    className={
                      errors?.total_program_fee ? 'border-red-500' : ''
                    }
                  />
                  {errors?.total_program_fee && (
                    <p className='text-sm text-red-500'>
                      {errors.total_program_fee}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {isReadOnly ? (
              <>
                <ReadOnlyField
                  label='Number of Semesters'
                  value={data.number_of_semesters}
                />
                <ReadOnlyField
                  label='Instalments per Semester'
                  value={data.instalments_per_semester}
                />
              </>
            ) : (
              <>
                <div className='space-y-2'>
                  <Label htmlFor='number_of_semesters'>
                    Number of Semesters
                  </Label>
                  <Input
                    id='number_of_semesters'
                    type='number'
                    min='1'
                    max='12'
                    value={data.number_of_semesters}
                    onChange={e =>
                      handleChange('number_of_semesters', e.target.value)
                    }
                    placeholder='4'
                    className={
                      errors?.number_of_semesters ? 'border-red-500' : ''
                    }
                  />
                  {errors?.number_of_semesters && (
                    <p className='text-sm text-red-500'>
                      {errors.number_of_semesters}
                    </p>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='instalments_per_semester'>
                    Instalments per Semester
                  </Label>
                  <Input
                    id='instalments_per_semester'
                    type='number'
                    min='1'
                    max='12'
                    value={data.instalments_per_semester}
                    onChange={e =>
                      handleChange('instalments_per_semester', e.target.value)
                    }
                    placeholder='3'
                    className={
                      errors?.instalments_per_semester ? 'border-red-500' : ''
                    }
                  />
                  {errors?.instalments_per_semester && (
                    <p className='text-sm text-red-500'>
                      {errors.instalments_per_semester}
                    </p>
                  )}
                  <p className='text-sm text-muted-foreground'>
                    This setting is used for "Instalment-wise Payment" plan. For
                    "Semester-wise Payment", there will be only 1 payment per
                    semester.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Configuration */}
        <div className='space-y-6'>
          {/* One-Shot Payment Discount */}
          {(!isStudentCustomMode || selectedPaymentPlan === 'one_shot') && (
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <Label
                  htmlFor='one_shot_discount_percentage'
                  className='text-base font-medium'
                >
                  One-Shot Payment Discount
                </Label>
                <p className='text-sm text-muted-foreground'>
                  Discount applied when students pay the entire program fee
                  upfront
                </p>
              </div>
              {isReadOnly ? (
                <div className='text-sm font-medium'>
                  {data.one_shot_discount_percentage}%
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  <Input
                    id='one_shot_discount_percentage'
                    type='number'
                    min='0'
                    max='100'
                    step='0.01'
                    value={data.one_shot_discount_percentage}
                    onChange={e =>
                      handleChange(
                        'one_shot_discount_percentage',
                        e.target.value
                      )
                    }
                    placeholder='0'
                    className={`w-20 text-center ${errors?.one_shot_discount_percentage ? 'border-red-500' : ''}`}
                  />
                  <span className='text-sm text-muted-foreground'>%</span>
                </div>
              )}
            </div>
          )}

          {/* GST Inclusion Toggle */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label
                htmlFor='program_fee_includes_gst'
                className='text-base font-medium'
              >
                Program Fee Includes GST
              </Label>
              <p className='text-sm text-muted-foreground'>
                When enabled, the total program fee includes GST
              </p>
            </div>
            {isReadOnly ? (
              <div className='text-sm font-medium'>
                {data.program_fee_includes_gst ? 'Yes' : 'No'}
              </div>
            ) : (
              <Switch
                id='program_fee_includes_gst'
                checked={data.program_fee_includes_gst}
                onCheckedChange={checked =>
                  handleChange('program_fee_includes_gst', checked)
                }
                disabled={isReadOnly}
              />
            )}
          </div>

          {/* Scholarship Distribution Toggle */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Label
                htmlFor='scholarship_distribution_method'
                className='text-base font-medium'
              >
                Equal Scholarship Distribution
              </Label>
              <p className='text-sm text-muted-foreground'>
                When enabled, scholarships are distributed equally across all
                semesters
              </p>
            </div>
            {isReadOnly ? (
              <div className='text-sm font-medium'>
                {data.equal_scholarship_distribution ? 'Yes' : 'No'}
              </div>
            ) : (
              <Switch
                id='equal_scholarship_distribution'
                checked={data.equal_scholarship_distribution}
                onCheckedChange={checked => {
                  handleChange('equal_scholarship_distribution', checked);
                }}
                disabled={isReadOnly}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
