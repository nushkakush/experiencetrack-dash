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
  userEmail?: string;
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
        rolloutPercentage: 100,
        targetRoles: ['student'],
      },
      {
        id: 'dashboard-access-control',
        name: 'Dashboard Access Control',
        description:
          'Control dashboard access based on email domains - restrict non-student roles to @litschool.in',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: [
          'super_admin',
          'program_manager',
          'fee_collector',
          'partnerships_head',
          'placement_coordinator',
        ],
        metadata: {
          allowedDomains: ['litschool.in'],
          restrictedDomains: [],
          accessLevel: 'domain-based',
          studentExemption: true,
        },
      },
      {
        id: 'cash-payment-disabled',
        name: 'Cash Payment Disabled',
        description:
          'Temporarily disable cash payment method for both students and admins',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['student', 'admin', 'super_admin', 'fee_collector'],
      },
      {
        id: 'equipment-create-super-admin-only',
        name: 'Equipment Create - Super Admin Only',
        description: 'Restrict equipment creation to Super Admin users only',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin'],
      },
      // Equipment feature flags
      {
        id: 'equipment.view',
        name: 'View Equipment',
        description: 'View equipment inventory and details',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.create',
        name: 'Create Equipment',
        description: 'Add new equipment items to inventory',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin'],
      },
      {
        id: 'equipment.edit',
        name: 'Edit Equipment',
        description: 'Modify equipment details and information',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.delete',
        name: 'Delete Equipment',
        description: 'Remove equipment items from inventory',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin'],
      },
      {
        id: 'equipment.borrow',
        name: 'Borrow Equipment',
        description: 'Borrow equipment items',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['student', 'super_admin', 'admin'],
      },
      {
        id: 'equipment.return',
        name: 'Return Equipment',
        description: 'Process equipment returns',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.manage_blacklist',
        name: 'Manage Blacklist',
        description: 'Manage student blacklist for equipment borrowing',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.reports',
        name: 'Equipment Reports',
        description: 'Generate equipment reports and analytics',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.inventory',
        name: 'Equipment Inventory',
        description: 'Access equipment inventory management',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.borrowing_history',
        name: 'Borrowing History',
        description: 'View equipment borrowing history and records',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
      },
      {
        id: 'equipment.manage',
        name: 'Manage Equipment',
        description: 'Full equipment management capabilities',
        enabled: true,
        rolloutPercentage: 100,
        targetRoles: ['super_admin', 'admin'],
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

    // Special handling for dashboard-access-control flag
    if (flagId === 'dashboard-access-control') {
      // Ensure we have the required context for evaluation
      if (!this.context.userEmail || !this.context.userRole) {
        console.log(
          '⚠️ Dashboard access control: Missing context - userEmail or userRole not set'
        );
        return false; // Default to restricted when context is incomplete
      }

      const userEmail = this.context.userEmail.toLowerCase();
      const allowedDomains = (flag.metadata?.allowedDomains as string[]) || [
        'litschool.in',
      ];
      const restrictedDomains =
        (flag.metadata?.restrictedDomains as string[]) || [];
      const studentExemption =
        (flag.metadata?.studentExemption as boolean) || false;

      console.log('🔍 Feature Flag Debug (dashboard-access-control):', {
        flagId,
        userEmail,
        userRole: this.context.userRole,
        allowedDomains,
        restrictedDomains,
        studentExemption,
        isLitschoolEmail: userEmail.endsWith('@litschool.in'),
        isStudent: this.context.userRole === 'student',
        targetRoles: flag.targetRoles,
      });

      // Check if user's role is in target roles (admin roles)
      const isTargetRole =
        flag.targetRoles &&
        flag.targetRoles.includes(this.context.userRole || '');

      // If user is not a target role (i.e., is a student), allow access
      if (!isTargetRole) {
        console.log('✅ Not a target role (student) - allowing access');
        return true;
      }

      // If user is a student and student exemption is enabled, allow access
      if (studentExemption && this.context.userRole === 'student') {
        console.log('✅ Student exemption - allowing access');
        return true; // Students can use any email domain
      }

      // For target roles (admin roles), check email domain
      console.log(
        '🔍 Checking email domain for admin role:',
        this.context.userRole
      );

      // Check if user's email domain is in restricted domains
      if (restrictedDomains.some(domain => userEmail.endsWith(`@${domain}`))) {
        console.log('❌ Email domain is restricted');
        return false;
      }

      // Check if user's email domain is in allowed domains
      if (allowedDomains.length > 0) {
        const hasAllowedDomain = allowedDomains.some(domain =>
          userEmail.endsWith(`@${domain}`)
        );
        console.log('🔍 Domain check result:', {
          hasAllowedDomain,
          allowedDomains,
          userEmail,
        });
        return hasAllowedDomain;
      }

      // If no allowed domains specified, deny access
      console.log('❌ No allowed domains specified - denying access');
      return false;
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
