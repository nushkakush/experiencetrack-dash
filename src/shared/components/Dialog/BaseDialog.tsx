/**
 * Reusable Dialog Component
 * This replaces the 27 different dialog implementations throughout the app
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface BaseDialogProps {
  /** Whether the dialog is open */
  open?: boolean;
  /** Called when the dialog should close */
  onOpenChange?: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional dialog description */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Trigger element for the dialog */
  trigger?: React.ReactNode;
  /** Footer content - if not provided, no footer will be shown */
  footer?: React.ReactNode;
  /** Primary action button config */
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  /** Secondary action button config */
  secondaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  /** Additional action buttons */
  additionalActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }>;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether the dialog can be closed by clicking outside or pressing escape */
  dismissible?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Custom class name for the dialog content */
  className?: string;
  /** Loading state for the entire dialog */
  loading?: boolean;
  /** Error state */
  error?: string | null;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-full sm:max-h-full',
};

export const BaseDialog: React.FC<BaseDialogProps> = React.memo(({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  footer,
  primaryAction,
  secondaryAction,
  additionalActions = [],
  size = 'md',
  dismissible = true,
  showCloseButton = true,
  className = '',
  loading = false,
  error,
}) => {
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  const handlePrimaryAction = async () => {
    if (!primaryAction?.onClick) return;
    
    try {
      setIsActionLoading(true);
      await primaryAction.onClick();
    } catch (err) {
      console.error('Primary action failed:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSecondaryAction = async () => {
    if (!secondaryAction?.onClick) return;
    
    try {
      await secondaryAction.onClick();
    } catch (err) {
      console.error('Secondary action failed:', err);
    }
  };

  const handleAdditionalAction = async (action: typeof additionalActions[0]) => {
    try {
      await action.onClick();
    } catch (err) {
      console.error('Additional action failed:', err);
    }
  };

  const defaultFooter = (primaryAction || secondaryAction || additionalActions.length > 0) && (
    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      {/* Additional actions */}
      {additionalActions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          onClick={() => handleAdditionalAction(action)}
          disabled={action.disabled || loading || isActionLoading}
        >
          {action.label}
        </Button>
      ))}
      
      {/* Secondary action */}
      {secondaryAction && (
        <Button
          variant={secondaryAction.variant || 'outline'}
          onClick={handleSecondaryAction}
          disabled={secondaryAction.disabled || loading || isActionLoading}
        >
          {secondaryAction.label}
        </Button>
      )}
      
      {/* Primary action */}
      {primaryAction && (
        <Button
          variant={primaryAction.variant || 'default'}
          onClick={handlePrimaryAction}
          disabled={primaryAction.disabled || loading}
          className="min-w-[100px]"
        >
          {(primaryAction.loading || isActionLoading) && (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {primaryAction.label}
        </Button>
      )}
    </DialogFooter>
  );

  const content = (
    <DialogContent 
      className={`${sizeClasses[size]} ${className}`}
      onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
      onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
    >
      {showCloseButton && dismissible && (
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {children}
        </div>
      )}
      
      {footer || defaultFooter}
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
});

BaseDialog.displayName = 'BaseDialog';
