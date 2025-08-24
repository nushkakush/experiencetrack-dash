import { useAuth } from '@/hooks/useAuth';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRoles?: string[];
  targetCohorts?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  cohortId?: string;
  environment?: 'development' | 'staging' | 'production';
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  private constructor() {
    this.initializeFlags();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Initialize default feature flags
   */
  private initializeFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        id: 'new-payment-ui',
        name: 'New Payment UI',
        description: 'Enable the new modular payment interface',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['student', 'admin'],
      },
      {
        id: 'payment-calculations-v2',
        name: 'Payment Calculations V2',
        description: 'Use the new payment calculation engine',
        enabled: true,
        rolloutPercentage: 50,
        targetRoles: ['admin'],
      },
      {
        id: 'attendance-analytics',
        name: 'Attendance Analytics',
        description: 'Enable advanced attendance analytics',
        enabled: false,
        rolloutPercentage: 0,
        targetRoles: ['admin', 'teacher'],
      },
      {
        id: 'bulk-operations',
        name: 'Bulk Operations',
        description: 'Enable bulk payment and attendance operations',
        enabled: true,
        rolloutPercentage: 25,
        targetRoles: ['admin'],
      },
      {
        id: 'real-time-notifications',
        name: 'Real-time Notifications',
        description: 'Enable real-time payment and attendance notifications',
        enabled: false,
        rolloutPercentage: 0,
        targetRoles: ['student', 'admin'],
      },
      {
        id: 'advanced-reporting',
        name: 'Advanced Reporting',
        description: 'Enable advanced reporting features',
        enabled: true,
        rolloutPercentage: 10,
        targetRoles: ['admin'],
      },
      // Role-based access control flags
      {
        id: 'fee-collection-access',
        name: 'Fee Collection Access',
        description: 'Control access to fee collection features',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['fee_collector', 'super_admin'],
      },
      {
        id: 'attendance-access',
        name: 'Attendance Access',
        description: 'Control access to attendance management features',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['program_manager', 'super_admin'],
      },
      {
        id: 'cohort-details-access',
        name: 'Cohort Details Access',
        description: 'Control access to cohort details and management',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin'],
      },
      {
        id: 'student-payment-dashboard',
        name: 'Student Payment Dashboard',
        description: 'Enable payment dashboard navigation for students',
        enabled: false,
        rolloutPercentage: 0,
        targetRoles: ['student'],
      },
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
  }

  /**
   * Set context for feature flag evaluation
   */
  setContext(context: FeatureFlagContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Check if a feature flag is enabled for the current context
   */
  isEnabled(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) {
      console.warn(`Feature flag '${flagId}' not found`);
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check date range
    if (flag.startDate && new Date() < new Date(flag.startDate)) {
      return false;
    }

    if (flag.endDate && new Date() > new Date(flag.endDate)) {
      return false;
    }

    // Check target users
    if (flag.targetUsers && this.context.userId) {
      if (!flag.targetUsers.includes(this.context.userId)) {
        return false;
      }
    }

    // Check target roles
    if (flag.targetRoles && this.context.userRole) {
      if (!flag.targetRoles.includes(this.context.userRole)) {
        return false;
      }
    }

    // Check target cohorts
    if (flag.targetCohorts && this.context.cohortId) {
      if (!flag.targetCohorts.includes(this.context.cohortId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(this.context.userId || 'anonymous');
      const percentage = hash % 100;
      if (percentage >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get feature flag metadata
   */
  getMetadata(flagId: string): Record<string, unknown> | null {
    const flag = this.flags.get(flagId);
    return flag?.metadata || null;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Toggle a feature flag for testing purposes
   */
  toggleFlag(flagId: string): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = !flag.enabled;
      console.log(
        `Feature flag '${flagId}' ${flag.enabled ? 'enabled' : 'disabled'}`
      );
      return flag.enabled;
    }
    console.warn(`Feature flag '${flagId}' not found`);
    return false;
  }

  /**
   * Set feature flag state for testing purposes
   */
  setFlagState(flagId: string, enabled: boolean): boolean {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = enabled;
      console.log(
        `Feature flag '${flagId}' ${enabled ? 'enabled' : 'disabled'}`
      );
      return true;
    }
    console.warn(`Feature flag '${flagId}' not found`);
    return false;
  }

  /**
   * Add or update a feature flag
   */
  setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagId: string): boolean {
    return this.flags.delete(flagId);
  }

  /**
   * Enable a feature flag
   */
  enableFlag(flagId: string): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = true;
      this.flags.set(flagId, flag);
    }
  }

  /**
   * Disable a feature flag
   */
  disableFlag(flagId: string): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.enabled = false;
      this.flags.set(flagId, flag);
    }
  }

  /**
   * Update rollout percentage
   */
  updateRolloutPercentage(flagId: string, percentage: number): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags.set(flagId, flag);
    }
  }

  /**
   * Simple hash function for consistent user assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature flag statistics
   */
  getFlagStats(flagId: string): {
    totalUsers: number;
    enabledUsers: number;
    percentage: number;
  } {
    const flag = this.flags.get(flagId);
    if (!flag) {
      return { totalUsers: 0, enabledUsers: 0, percentage: 0 };
    }

    // This is a simplified implementation
    // In a real application, you would track actual usage
    const totalUsers = 1000; // Mock total users
    const enabledUsers = Math.floor(
      (totalUsers * flag.rolloutPercentage) / 100
    );
    const percentage = flag.rolloutPercentage;

    return {
      totalUsers,
      enabledUsers,
      percentage,
    };
  }
}

// Export singleton instance
export const featureFlagService = FeatureFlagService.getInstance();
