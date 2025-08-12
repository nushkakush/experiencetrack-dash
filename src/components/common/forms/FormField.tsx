import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  FormFieldProps,
  FormFieldValue,
  FormFieldOption
} from '@/types/components/FormFieldTypes';



export const FormField = React.memo<FormFieldProps>(({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  options = [],
  className,
  rows = 3,
  min,
  max,
  step,
}) => {
  const handleChange = (newValue: FormFieldValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            placeholder={placeholder}
            value={value as string || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            rows={rows}
            className={cn(error && 'border-red-500', className)}
          />
        );

      case 'select':
        return (
          <Select
            value={value as string || ''}
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn(error && 'border-red-500', className)}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            id={name}
            name={name}
            checked={value as boolean || false}
            onCheckedChange={handleChange}
            disabled={disabled}
            className={cn(error && 'border-red-500', className)}
          />
        );

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value as string || ''}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            className={cn(error && 'border-red-500', className)}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={cn(error && 'text-red-500')}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
