import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeMerittoSync } from '@/hooks/useRealtimeMerittoSync';
import { cn } from '@/lib/utils';

interface RealtimeSyncInputProps {
  profileId: string;
  applicationId?: string;
  field: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
  syncType?: 'realtime' | 'extended' | 'registration';
  syncDebounceMs?: number;
}

export const RealtimeSyncInput: React.FC<RealtimeSyncInputProps> = ({
  profileId,
  applicationId,
  field,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  options = [],
  className,
  disabled = false,
  required = false,
  syncType = 'realtime',
  syncDebounceMs = 2000,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isSyncing, setIsSyncing] = useState(false);

  const { syncProfileData, syncExtendedProfile, isSyncing: hookIsSyncing } = useRealtimeMerittoSync({
    debounceMs: syncDebounceMs,
    enabled: true,
  });

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Update syncing state
  useEffect(() => {
    setIsSyncing(hookIsSyncing);
  }, [hookIsSyncing]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleBlur = useCallback(async (newValue: string) => {
    if (onBlur) {
      onBlur(newValue);
    }

    // Trigger real-time sync on blur
    try {
      console.log(`🔄 [FORM INPUT] Triggering sync on blur for field: ${field}`, {
        profileId,
        applicationId,
        field,
        value: newValue,
        syncType
      });

      if (syncType === 'extended') {
        await syncExtendedProfile(profileId, applicationId, { [field]: newValue });
      } else {
        await syncProfileData(profileId, applicationId, { [field]: newValue });
      }
    } catch (error) {
      console.error(`❌ [FORM INPUT] Real-time sync failed for field ${field}:`, {
        error,
        profileId,
        applicationId,
        field,
        value: newValue,
        syncType
      });
    }
  }, [onBlur, syncType, profileId, applicationId, field, syncProfileData, syncExtendedProfile]);

  const renderInput = () => {
    const commonProps = {
      value: localValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(e.target.value),
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => handleBlur(e.target.value),
      placeholder,
      disabled,
      required,
      className: cn(className, isSyncing && 'opacity-75'),
    };

    switch (type) {
      case 'textarea':
        return <Textarea {...commonProps} />;
      
      case 'select':
        return (
          <Select
            value={localValue}
            onValueChange={handleChange}
            disabled={disabled}
            required={required}
          >
            <SelectTrigger className={cn(className, isSyncing && 'opacity-75')}>
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
      
      default:
        return <Input {...commonProps} type={type} />;
    }
  };

  return (
    <div className="relative">
      {renderInput()}
      {isSyncing && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default RealtimeSyncInput;
