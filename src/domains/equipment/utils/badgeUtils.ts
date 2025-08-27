/**
 * Shared utility functions for equipment badge variants
 * Eliminates code duplication across equipment components
 */

export const getStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'available':
      return 'default';
    case 'borrowed':
      return 'secondary';
    case 'maintenance':
      return 'destructive';
    case 'retired':
      return 'outline';
    case 'lost':
      return 'destructive';
    case 'decommissioned':
      return 'outline';
    default:
      return 'default';
  }
};

export const getConditionBadgeVariant = (
  condition: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (condition) {
    case 'excellent':
      return 'default';
    case 'good':
      return 'secondary';

    case 'poor':
      return 'destructive';
    case 'damaged':
      return 'destructive';
    case 'under_repair':
      return 'secondary';
    case 'decommissioned':
      return 'outline';
    default:
      return 'default';
  }
};

export const getBorrowingStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'active':
      return 'secondary';
    case 'returned':
      return 'default';
    case 'overdue':
      return 'destructive';
    case 'cancelled':
      return 'outline';
    default:
      return 'default';
  }
};

export const getDamageStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'reported':
      return 'secondary';
    case 'under_review':
      return 'outline';
    case 'repair_approved':
      return 'secondary';
    case 'repair_completed':
      return 'default';
    case 'replacement_approved':
      return 'secondary';
    case 'resolved':
      return 'default';
    default:
      return 'default';
  }
};
