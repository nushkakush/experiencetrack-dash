/**
 * Confirmation Dialog Component
 * Specialized dialog for confirmation actions (delete, etc.)
 */

import React from 'react';
import { BaseDialog, BaseDialogProps } from './BaseDialog';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export interface ConfirmationDialogProps extends Omit<BaseDialogProps, 'primaryAction' | 'secondaryAction'> {
  /** Type of confirmation - affects styling and icon */
  type?: 'danger' | 'warning' | 'info' | 'success';
  /** Confirmation message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Called when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Called when user cancels */
  onCancel?: () => void;
  /** Whether the confirm action is loading */
  confirmLoading?: boolean;
}

const typeConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-500',
    confirmVariant: 'destructive' as const,
    defaultConfirmLabel: 'Delete',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    confirmVariant: 'default' as const,
    defaultConfirmLabel: 'Confirm',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    confirmVariant: 'default' as const,
    defaultConfirmLabel: 'Confirm',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    confirmVariant: 'default' as const,
    defaultConfirmLabel: 'Confirm',
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = React.memo(({
  type = 'danger',
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmLoading = false,
  ...props
}) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleCancel = () => {
    onCancel?.();
    props.onOpenChange?.(false);
  };

  return (
    <BaseDialog
      {...props}
      size="sm"
      primaryAction={{
        label: confirmLabel || config.defaultConfirmLabel,
        onClick: onConfirm,
        variant: config.confirmVariant,
        loading: confirmLoading,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: handleCancel,
        variant: 'outline',
      }}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`h-6 w-6 flex-shrink-0 ${config.iconColor}`} />
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </BaseDialog>
  );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';
