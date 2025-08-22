/**
 * Shared Dialog Components
 * Export all dialog components for easy importing
 */

export { BaseDialog } from './BaseDialog';
export type { BaseDialogProps } from './BaseDialog';

export { ConfirmationDialog } from './ConfirmationDialog';
export type { ConfirmationDialogProps } from './ConfirmationDialog';

// Re-export UI dialog components for backward compatibility
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
