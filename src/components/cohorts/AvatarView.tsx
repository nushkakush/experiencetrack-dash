import AvatarDisplay from './AvatarDisplay';
import { useAvatarPermissions } from '@/hooks/useAvatarPermissions';

interface AvatarViewProps {
  avatarUrl?: string | null;
  studentName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarView({
  avatarUrl,
  studentName,
  size = 'md',
}: AvatarViewProps) {
  const { canView } = useAvatarPermissions();

  // If user can't view avatars, don't render anything
  if (!canView) {
    return null;
  }

  return (
    <AvatarDisplay
      avatarUrl={avatarUrl}
      studentName={studentName}
      size={size}
    />
  );
}
