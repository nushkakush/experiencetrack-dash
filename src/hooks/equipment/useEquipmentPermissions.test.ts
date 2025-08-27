import { renderHook } from '@testing-library/react';
import { useEquipmentPermissions } from './useEquipmentPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';

// Mock the dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/feature-flags/useFeatureFlag');
jest.mock('@/config/features', () => ({
  ROLE_PERMISSIONS: [
    {
      role: 'super_admin',
      features: [
        'equipment.view',
        'equipment.create',
        'equipment.edit',
        'equipment.delete',
        'equipment.borrow',
        'equipment.return',
        'equipment.manage_blacklist',
        'equipment.reports',
        'equipment.inventory',
        'equipment.borrowing_history',
        'equipment.manage',
      ],
    },
    {
      role: 'equipment_manager',
      features: [
        'equipment.view',
        'equipment.create',
        'equipment.edit',
        'equipment.delete',
        'equipment.borrow',
        'equipment.return',
        'equipment.manage_blacklist',
        'equipment.reports',
        'equipment.inventory',
        'equipment.borrowing_history',
        'equipment.manage',
      ],
    },
  ],
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>;

describe('useEquipmentPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all permissions as true for super_admin role', () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      profile: {
        user_id: 'test-user-id',
        role: 'super_admin',
        email: 'admin@litschool.in',
        first_name: 'Admin',
        last_name: 'User',
      },
    } as any);

    // Mock feature flag hook to return false (fallback to role-based permissions)
    mockUseFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      checkFlag: jest.fn(),
    });

    const { result } = renderHook(() => useEquipmentPermissions());

    expect(result.current.canViewEquipment).toBe(true);
    expect(result.current.canCreateEquipment).toBe(true);
    expect(result.current.canEditEquipment).toBe(true);
    expect(result.current.canDeleteEquipment).toBe(true);
    expect(result.current.canBorrowEquipment).toBe(true);
    expect(result.current.canReturnEquipment).toBe(true);
    expect(result.current.canManageBlacklist).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canAccessInventory).toBe(true);
    expect(result.current.canViewBorrowingHistory).toBe(true);
    expect(result.current.canManageEquipment).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return all permissions as true for equipment_manager role', () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      profile: {
        user_id: 'test-user-id',
        role: 'equipment_manager',
        email: 'equipment@litschool.in',
        first_name: 'Equipment',
        last_name: 'Manager',
      },
    } as any);

    // Mock feature flag hook to return false (fallback to role-based permissions)
    mockUseFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      checkFlag: jest.fn(),
    });

    const { result } = renderHook(() => useEquipmentPermissions());

    expect(result.current.canViewEquipment).toBe(true);
    expect(result.current.canCreateEquipment).toBe(true);
    expect(result.current.canEditEquipment).toBe(true);
    expect(result.current.canDeleteEquipment).toBe(true);
    expect(result.current.canBorrowEquipment).toBe(true);
    expect(result.current.canReturnEquipment).toBe(true);
    expect(result.current.canManageBlacklist).toBe(true);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canAccessInventory).toBe(true);
    expect(result.current.canViewBorrowingHistory).toBe(true);
    expect(result.current.canManageEquipment).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return all permissions as false for student role', () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      profile: {
        user_id: 'test-user-id',
        role: 'student',
        email: 'student@example.com',
        first_name: 'Student',
        last_name: 'User',
      },
    } as any);

    // Mock feature flag hook to return false
    mockUseFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
      checkFlag: jest.fn(),
    });

    const { result } = renderHook(() => useEquipmentPermissions());

    expect(result.current.canViewEquipment).toBe(false);
    expect(result.current.canCreateEquipment).toBe(false);
    expect(result.current.canEditEquipment).toBe(false);
    expect(result.current.canDeleteEquipment).toBe(false);
    expect(result.current.canBorrowEquipment).toBe(false);
    expect(result.current.canReturnEquipment).toBe(false);
    expect(result.current.canManageBlacklist).toBe(false);
    expect(result.current.canViewReports).toBe(false);
    expect(result.current.canAccessInventory).toBe(false);
    expect(result.current.canViewBorrowingHistory).toBe(false);
    expect(result.current.canManageEquipment).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should prioritize feature flag over role-based permissions', () => {
    // Mock auth hook for student role
    mockUseAuth.mockReturnValue({
      profile: {
        user_id: 'test-user-id',
        role: 'student',
        email: 'student@example.com',
        first_name: 'Student',
        last_name: 'User',
      },
    } as any);

    // Mock feature flag hook to return true for equipment.view
    mockUseFeatureFlag.mockReturnValue({
      isEnabled: true,
      isLoading: false,
      checkFlag: jest.fn(),
    });

    const { result } = renderHook(() => useEquipmentPermissions());

    // Should be true because feature flag is enabled, even though role doesn't have permission
    expect(result.current.canViewEquipment).toBe(true);
  });

  it('should handle loading state correctly', () => {
    // Mock auth hook
    mockUseAuth.mockReturnValue({
      profile: {
        user_id: 'test-user-id',
        role: 'super_admin',
        email: 'admin@litschool.in',
        first_name: 'Admin',
        last_name: 'User',
      },
    } as any);

    // Mock feature flag hook to return loading state
    mockUseFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: true,
      checkFlag: jest.fn(),
    });

    const { result } = renderHook(() => useEquipmentPermissions());

    expect(result.current.isLoading).toBe(true);
  });
});
