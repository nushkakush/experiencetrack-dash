// Predefined SEO configurations for common pages
export const PageSEO = {
  // Auth pages
  login: {
    title: 'Sign In',
    description:
      'Sign in to your LIT OS account to access your experiential learning dashboard. Secure authentication for students, teachers, and administrators.',
    keywords:
      'sign in, login, LIT OS, authentication, student portal, teacher login, admin login',
    type: 'website' as const,
  },

  resetPassword: {
    title: 'Reset Password',
    description:
      'Reset your LIT OS account password securely. Follow the secure process to regain access to your experiential learning dashboard.',
    keywords:
      'reset password, forgot password, LIT OS, authentication, password recovery',
    type: 'website' as const,
  },

  // Dashboard pages
  dashboard: {
    title: 'Dashboard',
    description:
      'Access your personalized LIT OS dashboard for managing experiential learning activities. Track progress, manage cohorts, and monitor student performance.',
    keywords:
      'dashboard, LIT OS, learning management, student portal, teacher dashboard, admin dashboard',
    type: 'website' as const,
  },

  // Cohort pages
  cohorts: {
    title: 'Cohorts',
    description:
      'Manage and view all cohorts in the LIT OS experiential learning system. Create, edit, and monitor student groups for effective learning management.',
    keywords:
      'cohorts, cohort management, LIT OS, learning groups, student management, class management',
    type: 'website' as const,
  },

  cohortDetails: {
    title: 'Cohort Details',
    description:
      'View detailed information about a specific cohort in the LIT OS system. Monitor student progress, attendance, and performance metrics.',
    keywords:
      'cohort details, cohort information, LIT OS, learning management, student progress, class details',
    type: 'website' as const,
  },

  // Attendance pages
  attendance: {
    title: 'Attendance Management',
    description:
      'Track and manage student attendance for experiential learning sessions. Monitor participation, generate reports, and maintain attendance records.',
    keywords:
      'attendance, attendance tracking, LIT OS, student attendance, attendance management, participation tracking',
    type: 'website' as const,
  },

  // Fee collection pages
  feeCollection: {
    title: 'Fee Collection',
    description:
      'Manage fee collection and payment processing for LIT OS programs. Track payments, manage scholarships, and generate financial reports.',
    keywords:
      'fee collection, payments, LIT OS, financial management, payment processing, scholarship management',
    type: 'website' as const,
  },

  // Profile pages
  profile: {
    title: 'Profile',
    description:
      'Manage your LIT OS account profile and preferences. Update personal information, change settings, and customize your dashboard experience.',
    keywords:
      'profile, account settings, LIT OS, user profile, personal information, account management',
    type: 'profile' as const,
  },

  // Public pages
  leaderboard: {
    title: 'Leaderboard',
    description:
      'View the latest leaderboard rankings for LIT OS experiential learning programs. Track student performance, attendance, and achievements in real-time.',
    keywords:
      'leaderboard, rankings, LIT OS, student performance, attendance leaderboard, performance tracking',
    type: 'website' as const,
  },

  invitation: {
    title: 'Join LIT OS',
    description:
      'Accept your invitation to join the LIT OS experiential learning platform. Set up your account and start your learning journey with personalized guidance.',
    keywords:
      'invitation, join, LIT OS, signup, student registration, platform access',
    type: 'website' as const,
  },

  // Error pages
  notFound: {
    title: 'Page Not Found',
    description:
      'The page you are looking for could not be found on LIT OS. Please check the URL or return to the main dashboard.',
    keywords: '404, page not found, LIT OS, error, not found',
    noindex: true,
    type: 'website' as const,
  },

  // Additional specialized pages
  studentDashboard: {
    title: 'Student Dashboard',
    description:
      'Your personalized student dashboard in LIT OS. View your progress, track attendance, manage payments, and access learning resources.',
    keywords:
      'student dashboard, LIT OS, student portal, progress tracking, learning resources',
    type: 'website' as const,
  },

  teacherDashboard: {
    title: 'Teacher Dashboard',
    description:
      'Comprehensive teacher dashboard for managing classes, tracking student progress, and facilitating experiential learning in LIT OS.',
    keywords:
      'teacher dashboard, LIT OS, class management, student progress, teaching tools',
    type: 'website' as const,
  },

  adminDashboard: {
    title: 'Admin Dashboard',
    description:
      'Administrative dashboard for managing the LIT OS platform. Oversee users, cohorts, system settings, and generate comprehensive reports.',
    keywords:
      'admin dashboard, LIT OS, system administration, user management, platform management',
    type: 'website' as const,
  },

  // Public leaderboard variations
  publicLeaderboard: {
    title: 'Public Leaderboard',
    description:
      'Public leaderboard showcasing student achievements and performance in LIT OS experiential learning programs. Real-time rankings and statistics.',
    keywords:
      'public leaderboard, student achievements, LIT OS, performance rankings, real-time statistics',
    type: 'website' as const,
  },

  combinedLeaderboard: {
    title: 'Combined Leaderboards',
    description:
      'View combined leaderboards across multiple cohorts in LIT OS. Compare performance across different learning groups and programs.',
    keywords:
      'combined leaderboards, multi-cohort rankings, LIT OS, performance comparison, cross-cohort analysis',
    type: 'website' as const,
  },

  // Equipment pages
  equipment: {
    title: 'Equipment Management',
    description:
      'Manage equipment borrowing and returns for LIT OS experiential learning programs. Track equipment status, manage reservations, and monitor usage.',
    keywords:
      'equipment management, equipment borrowing, LIT OS, learning resources, equipment tracking, resource management',
    type: 'website' as const,
  },

  error: {
    title: 'Error',
    description:
      'An error has occurred. Please try again or contact LIT OS support for assistance with your experiential learning platform.',
    keywords: 'error, LIT OS, technical issue, support, help, troubleshooting',
    type: 'website' as const,
  },
} as const;

export type PageSEOKey = keyof typeof PageSEO;
