import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormActionsProps {
  onSubmit?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  showCancel?: boolean;
  showReset?: boolean;
  className?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  cancelVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  resetVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const FormActions = React.memo<FormActionsProps>(({
  onSubmit,
  onCancel,
  onReset,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  resetLabel = 'Reset',
  loading = false,
  disabled = false,
  showCancel = true,
  showReset = false,
  className,
  submitVariant = 'default',
  cancelVariant = 'outline',
  resetVariant = 'ghost',
}) => {
  return (
    <div className={cn('flex items-center gap-2 justify-end', className)}>
      {showReset && onReset && (
        <Button
          type="button"
          variant={resetVariant}
          onClick={onReset}
          disabled={loading || disabled}
        >
          {resetLabel}
        </Button>
      )}
      
      {showCancel && onCancel && (
        <Button
          type="button"
          variant={cancelVariant}
          onClick={onCancel}
          disabled={loading || disabled}
        >
          {cancelLabel}
        </Button>
      )}
      
      {onSubmit && (
        <Button
          type="submit"
          variant={submitVariant}
          onClick={onSubmit}
          disabled={loading || disabled}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      )}
    </div>
  );
});

FormActions.displayName = 'FormActions';
