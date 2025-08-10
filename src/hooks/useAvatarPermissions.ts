import { useFeaturePermissions } from './useFeaturePermissions';
import { useAuth } from './useAuth';

interface UseAvatarPermissionsReturn {
  canUpload: boolean;
  canView: boolean;
  isSuperAdmin: boolean;
}

/**
 * Custom hook for avatar-specific permissions
 * - Super admins can upload and view avatars
 * - All other roles can view avatars but cannot upload
 */
export const useAvatarPermissions = (): UseAvatarPermissionsReturn => {
  const { hasPermission } = useFeaturePermissions();
  const { profile } = useAuth();

  // Check if user has the avatar upload permission (super admin only)
  const canUpload = hasPermission('student.avatar_upload') && profile?.role === 'super_admin';
  
  // Check if user can view avatars (all roles that have access to the page)
  const canView = hasPermission('student.avatar_upload');
  
  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'super_admin';

  return {
    canUpload,
    canView,
    isSuperAdmin,
  };
};
