import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';
import { FeatureKey } from '@/types/features';
import { ROLE_PERMISSIONS } from '@/config/features';

export interface EquipmentPermissions {
  canViewEquipment: boolean;
  canCreateEquipment: boolean;
  canEditEquipment: boolean;
  canDeleteEquipment: boolean;
  canBorrowEquipment: boolean;
  canReturnEquipment: boolean;
  canManageBlacklist: boolean;
  canViewReports: boolean;
  canAccessInventory: boolean;
  canViewBorrowingHistory: boolean;
  canManageEquipment: boolean;
  isLoading: boolean;
}

export function useEquipmentPermissions(): EquipmentPermissions {
  const { profile } = useAuth();

  // Check individual feature flags
  const { isEnabled: canViewEquipment, isLoading: viewLoading } =
    useFeatureFlag('equipment.view', { defaultValue: false });
  const { isEnabled: canCreateEquipment, isLoading: createLoading } =
    useFeatureFlag('equipment.create', { defaultValue: false });
  const { isEnabled: canEditEquipment, isLoading: editLoading } =
    useFeatureFlag('equipment.edit', { defaultValue: false });
  const { isEnabled: canDeleteEquipment, isLoading: deleteLoading } =
    useFeatureFlag('equipment.delete', { defaultValue: false });
  const { isEnabled: canBorrowEquipment, isLoading: borrowLoading } =
    useFeatureFlag('equipment.borrow', { defaultValue: false });
  const { isEnabled: canReturnEquipment, isLoading: returnLoading } =
    useFeatureFlag('equipment.return', { defaultValue: false });
  const { isEnabled: canManageBlacklist, isLoading: blacklistLoading } =
    useFeatureFlag('equipment.manage_blacklist', { defaultValue: false });
  const { isEnabled: canViewReports, isLoading: reportsLoading } =
    useFeatureFlag('equipment.reports', { defaultValue: false });
  const { isEnabled: canAccessInventory, isLoading: inventoryLoading } =
    useFeatureFlag('equipment.inventory', { defaultValue: false });
  const { isEnabled: canViewBorrowingHistory, isLoading: historyLoading } =
    useFeatureFlag('equipment.borrowing_history', { defaultValue: false });
  const { isEnabled: canManageEquipment, isLoading: manageLoading } =
    useFeatureFlag('equipment.manage', { defaultValue: false });

  // Check if any feature flag is still loading
  const isLoading =
    viewLoading ||
    createLoading ||
    editLoading ||
    deleteLoading ||
    borrowLoading ||
    returnLoading ||
    blacklistLoading ||
    reportsLoading ||
    inventoryLoading ||
    historyLoading ||
    manageLoading;

  // Fallback to role-based permissions if feature flags are not configured
  const getRoleBasedPermission = (featureKey: FeatureKey): boolean => {
    if (!profile?.role) return false;

    const rolePermissions = ROLE_PERMISSIONS.find(
      rp => rp.role === profile.role
    );
    if (!rolePermissions) return false;

    return rolePermissions.features.includes(featureKey);
  };

  return {
    canViewEquipment:
      canViewEquipment || getRoleBasedPermission('equipment.view'),
    canCreateEquipment:
      canCreateEquipment || getRoleBasedPermission('equipment.create'),
    canEditEquipment:
      canEditEquipment || getRoleBasedPermission('equipment.edit'),
    canDeleteEquipment:
      canDeleteEquipment || getRoleBasedPermission('equipment.delete'),
    canBorrowEquipment:
      canBorrowEquipment || getRoleBasedPermission('equipment.borrow'),
    canReturnEquipment:
      canReturnEquipment || getRoleBasedPermission('equipment.return'),
    canManageBlacklist:
      canManageBlacklist ||
      getRoleBasedPermission('equipment.manage_blacklist'),
    canViewReports:
      canViewReports || getRoleBasedPermission('equipment.reports'),
    canAccessInventory:
      canAccessInventory || getRoleBasedPermission('equipment.inventory'),
    canViewBorrowingHistory:
      canViewBorrowingHistory ||
      getRoleBasedPermission('equipment.borrowing_history'),
    canManageEquipment:
      canManageEquipment || getRoleBasedPermission('equipment.manage'),
    isLoading,
  };
}

// Hook for checking a specific equipment permission
export function useEquipmentPermission(featureKey: FeatureKey): {
  hasPermission: boolean;
  isLoading: boolean;
} {
  const { profile } = useAuth();
  const { isEnabled, isLoading } = useFeatureFlag(featureKey, {
    defaultValue: false,
  });

  // Fallback to role-based permissions if feature flag is not configured
  const getRoleBasedPermission = (): boolean => {
    if (!profile?.role) return false;

    const rolePermissions = ROLE_PERMISSIONS.find(
      rp => rp.role === profile.role
    );
    if (!rolePermissions) return false;

    return rolePermissions.features.includes(featureKey);
  };

  return {
    hasPermission: isEnabled || getRoleBasedPermission(),
    isLoading,
  };
}
