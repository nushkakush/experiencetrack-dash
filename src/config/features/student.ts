import { FeatureKey, FeatureMetadata } from '@/types/features';

export const STUDENT_FEATURES: Record<FeatureKey, FeatureMetadata> = {
  'student.progress': {
    key: 'student.progress',
    name: 'Student Progress',
    description: 'View student progress information',
    category: 'student',
    requiresAuthentication: true,
  },
  'student.assignments': {
    key: 'student.assignments',
    name: 'Student Assignments',
    description: 'View and manage student assignments',
    category: 'student',
    requiresAuthentication: true,
  },
  'student.programs': {
    key: 'student.programs',
    name: 'Student Programs',
    description: 'View student program information',
    category: 'student',
    requiresAuthentication: true,
  },
  'student.attendance_view': {
    key: 'student.attendance_view',
    name: 'View Own Attendance',
    description: 'View personal attendance records',
    category: 'student',
    requiresAuthentication: true,
  },
  'student.avatar_upload': {
    key: 'student.avatar_upload',
    name: 'Upload Student Avatars',
    description: 'Upload and manage student profile avatars',
    category: 'student',
    requiresAuthentication: true,
  },
} as const;

export const STUDENT_FEATURE_KEYS = Object.keys(STUDENT_FEATURES) as FeatureKey[];
