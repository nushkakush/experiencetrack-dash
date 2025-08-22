import { featureFlagService } from '@/lib/feature-flags/FeatureFlagService';

/**
 * Utility functions for managing feature flags during development
 * These functions are exposed globally for easy console access
 */

// Expose feature flag service methods globally for development
if (process.env.NODE_ENV === 'development') {
  (window as any).featureFlags = {
    /**
     * Toggle the student payment dashboard feature flag
     */
    toggleStudentPaymentDashboard: () => {
      const result = featureFlagService.toggleFlag('student-payment-dashboard');
      console.log(`Student Payment Dashboard: ${result ? 'ENABLED' : 'DISABLED'}`);
      // Force a page reload to see the changes
      window.location.reload();
      return result;
    },

    /**
     * Enable the student payment dashboard feature flag
     */
    enableStudentPaymentDashboard: () => {
      const result = featureFlagService.setFlagState('student-payment-dashboard', true);
      console.log('Student Payment Dashboard: ENABLED');
      window.location.reload();
      return result;
    },

    /**
     * Disable the student payment dashboard feature flag
     */
    disableStudentPaymentDashboard: () => {
      const result = featureFlagService.setFlagState('student-payment-dashboard', false);
      console.log('Student Payment Dashboard: DISABLED');
      window.location.reload();
      return result;
    },

    /**
     * Get the current state of the student payment dashboard feature flag
     */
    getStudentPaymentDashboardState: () => {
      const flag = featureFlagService.getAllFlags().find(f => f.id === 'student-payment-dashboard');
      return flag?.enabled || false;
    },

    /**
     * Toggle any feature flag by ID
     */
    toggle: (flagId: string) => {
      const result = featureFlagService.toggleFlag(flagId);
      console.log(`Feature flag '${flagId}': ${result ? 'ENABLED' : 'DISABLED'}`);
      window.location.reload();
      return result;
    },

    /**
     * Set any feature flag state by ID
     */
    set: (flagId: string, enabled: boolean) => {
      const result = featureFlagService.setFlagState(flagId, enabled);
      console.log(`Feature flag '${flagId}': ${enabled ? 'ENABLED' : 'DISABLED'}`);
      window.location.reload();
      return result;
    },

    /**
     * List all feature flags and their states
     */
    list: () => {
      const flags = featureFlagService.getAllFlags();
      console.table(flags.map(f => ({
        id: f.id,
        name: f.name,
        enabled: f.enabled,
        rolloutPercentage: f.rolloutPercentage,
        targetRoles: f.targetRoles?.join(', ') || 'all'
      })));
      return flags;
    },

    /**
     * Show help information
     */
    help: () => {
      console.log(`
🚩 Feature Flag Utilities (Development Only)

Available commands:
- featureFlags.toggleStudentPaymentDashboard() - Toggle student payment dashboard
- featureFlags.enableStudentPaymentDashboard() - Enable student payment dashboard  
- featureFlags.disableStudentPaymentDashboard() - Disable student payment dashboard
- featureFlags.getStudentPaymentDashboardState() - Get current state
- featureFlags.toggle('flag-id') - Toggle any flag by ID
- featureFlags.set('flag-id', true/false) - Set any flag state
- featureFlags.list() - List all flags
- featureFlags.help() - Show this help

Example:
  featureFlags.enableStudentPaymentDashboard()
      `);
    }
  };

  // Show help on first load
  console.log('🚩 Feature flags utilities loaded. Type featureFlags.help() for usage.');
}
