import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';

describe('Equipment Create Feature Flag', () => {
  beforeEach(() => {
    // Reset the service context before each test
    featureFlagService.setContext({});
  });

  describe('equipment-create-super-admin-only', () => {
    it('should be enabled for super_admin role', () => {
      featureFlagService.setContext({
        userRole: 'super_admin',
        userId: 'test-user-1',
        userEmail: 'admin@litschool.in',
        environment: 'development',
      });

      const isEnabled = featureFlagService.isEnabled(
        'equipment-create-super-admin-only'
      );
      expect(isEnabled).toBe(true);
    });

    it('should be disabled for equipment_manager role', () => {
      featureFlagService.setContext({
        userRole: 'equipment_manager',
        userId: 'test-user-2',
        userEmail: 'equipment@litschool.in',
        environment: 'development',
      });

      const isEnabled = featureFlagService.isEnabled(
        'equipment-create-super-admin-only'
      );
      expect(isEnabled).toBe(false);
    });

    it('should be disabled for other roles', () => {
      const otherRoles = [
        'student',
        'program_manager',
        'fee_collector',
        'partnerships_head',
        'placement_coordinator',
      ];

      otherRoles.forEach(role => {
        featureFlagService.setContext({
          userRole: role,
          userId: `test-user-${role}`,
          userEmail: `${role}@litschool.in`,
          environment: 'development',
        });

        const isEnabled = featureFlagService.isEnabled(
          'equipment-create-super-admin-only'
        );
        expect(isEnabled).toBe(false);
      });
    });

    it('should be disabled when no user role is provided', () => {
      featureFlagService.setContext({
        userId: 'test-user-no-role',
        userEmail: 'test@litschool.in',
        environment: 'development',
      });

      const isEnabled = featureFlagService.isEnabled(
        'equipment-create-super-admin-only'
      );
      expect(isEnabled).toBe(false);
    });

    it('should be disabled when no context is provided', () => {
      const isEnabled = featureFlagService.isEnabled(
        'equipment-create-super-admin-only'
      );
      expect(isEnabled).toBe(false);
    });
  });
});
