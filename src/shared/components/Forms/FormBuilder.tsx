/**
 * Dynamic Form Builder Component
 * Creates forms from configuration objects with validation
 */

import React from 'react';
import { useForm, Controller, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useFeatureFlag } from '@/lib/feature-flags';

export interface FormFieldConfig {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'date';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodType<any>;
  description?: string;
  defaultValue?: any;
  colSpan?: 1 | 2 | 3;
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
}

export interface FormBuilderProps<T extends FieldValues> {
  sections: FormSection[];
  onSubmit: (data: T) => void | Promise<void>;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  defaultValues?: Partial<T>;
  validationSchema?: z.ZodType<T>;
  className?: string;
  columns?: 1 | 2 | 3;
}

export function FormBuilder<T extends FieldValues>({
  sections,
  onSubmit,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  defaultValues,
  validationSchema,
  className = '',
  columns = 1,
}: FormBuilderProps<T>) {
  const form = useForm<T>({
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    defaultValues,
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const renderField = (field: FormFieldConfig) => {
    const fieldName = field.name as Path<T>;

    return (
      <FormField
        key={field.name}
        control={control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem className={`col-span-${field.colSpan || 1}`}>
            <FormLabel>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </FormLabel>
            <FormControl>{renderFieldInput(field, formField)}</FormControl>
            {field.description && (
              <p className='text-sm text-muted-foreground'>
                {field.description}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderFieldInput = (field: FormFieldConfig, formField: any) => {
    const baseProps = {
      ...formField,
      disabled: field.disabled || loading,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'date':
        return <Input {...baseProps} type={field.type} />;

      case 'number':
        return <Input {...baseProps} type='number' step='any' />;

      case 'textarea':
        return <Textarea {...baseProps} rows={4} />;

      case 'select':
        return (
          <Select value={formField.value} onValueChange={formField.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className='flex items-center space-x-2'>
            <Checkbox
              checked={formField.value}
              onCheckedChange={formField.onChange}
              disabled={field.disabled || loading}
            />
            <Label>{field.label}</Label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={formField.value}
            onValueChange={formField.onChange}
          >
            {field.options?.map(option => (
              <div key={option.value} className='flex items-center space-x-2'>
                <RadioGroupItem value={option.value} />
                <Label>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'file':
        return (
          <Input
            type='file'
            onChange={e => formField.onChange(e.target.files?.[0])}
            disabled={field.disabled || loading}
          />
        );

      default:
        return <Input {...baseProps} />;
    }
  };

  const handleFormSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={`space-y-6 ${className}`}
    >
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          {(section.title || section.description) && (
            <CardHeader>
              {section.title && <CardTitle>{section.title}</CardTitle>}
              {section.description && (
                <p className='text-sm text-muted-foreground'>
                  {section.description}
                </p>
              )}
            </CardHeader>
          )}
          <CardContent>
            <div className={`grid grid-cols-${columns} gap-6`}>
              {section.fields.map(renderField)}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className='flex justify-end space-x-4'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        <Button type='submit' disabled={loading || isSubmitting}>
          {(loading || isSubmitting) && (
            <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          )}
          {submitText}
        </Button>
      </div>
    </form>
  );
}

// Function to get payment form config with feature flag support
export const getPaymentFormConfig = () => {
  // This would need to be called within a component that has access to the feature flag hook
  // For now, we'll create a static version and update it when needed
  return [
    {
      title: 'Payment Details',
      fields: [
        {
          name: 'amount',
          label: 'Amount',
          type: 'number' as const,
          required: true,
          placeholder: 'Enter amount',
        },
        {
          name: 'paymentMethod',
          label: 'Payment Method',
          type: 'select' as const,
          required: true,
          options: [
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'upi', label: 'UPI' },
            { value: 'card', label: 'Card' },
            // Cash option will be filtered out by the feature flag in components
          ],
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea' as const,
          placeholder: 'Add any notes about this payment',
          colSpan: 2,
        },
        {
          name: 'receipt',
          label: 'Payment Receipt',
          type: 'file' as const,
          description: 'Upload payment receipt (optional)',
        },
      ],
    },
  ];
};

// Pre-built form configurations for common use cases
export const paymentFormConfig: FormSection[] = getPaymentFormConfig();

export const studentFormConfig: FormSection[] = [
  {
    title: 'Student Information',
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name',
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'Enter email address',
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'text',
        placeholder: 'Enter phone number',
      },
      {
        name: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
      },
    ],
  },
];

export const cohortFormConfig: FormSection[] = [
  {
    title: 'Cohort Details',
    fields: [
      {
        name: 'name',
        label: 'Cohort Name',
        type: 'text',
        required: true,
        placeholder: 'Enter cohort name',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter cohort description',
        colSpan: 2,
      },
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true,
      },
      {
        name: 'endDate',
        label: 'End Date',
        type: 'date',
      },
      {
        name: 'maxStudents',
        label: 'Maximum Students',
        type: 'number',
        placeholder: 'Enter maximum number of students',
      },
    ],
  },
];
