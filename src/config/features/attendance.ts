import { FeatureKey, FeatureMetadata } from '@/types/features';

export const ATTENDANCE_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'attendance.view': {
    key: 'attendance.view',
    name: 'View Attendance',
    description: 'View attendance records',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.mark': {
    key: 'attendance.mark',
    name: 'Mark Attendance',
    description: 'Mark student attendance',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.edit': {
    key: 'attendance.edit',
    name: 'Edit Attendance',
    description: 'Modify attendance records',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.delete': {
    key: 'attendance.delete',
    name: 'Delete Attendance',
    description: 'Delete attendance records',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.export': {
    key: 'attendance.export',
    name: 'Export Attendance',
    description: 'Export attendance data',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.leaderboard': {
    key: 'attendance.leaderboard',
    name: 'Attendance Leaderboard',
    description: 'View attendance leaderboards',
    category: 'attendance',
    requiresAuthentication: true,
  },
  'attendance.statistics': {
    key: 'attendance.statistics',
    name: 'Attendance Statistics',
    description: 'View attendance analytics and statistics',
    category: 'attendance',
    requiresAuthentication: true,
  },
} as const;

export const ATTENDANCE_FEATURE_KEYS = Object.keys(ATTENDANCE_FEATURES) as FeatureKey[];
