import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarService } from '@/services/avatar.service';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  userId?: string | null; // Optional: if provided, will fetch avatar from profile
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  className = '',
  userId,
}) => {
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  // Fetch avatar from profile if userId is provided and no avatarUrl is given
  useEffect(() => {
    if (userId && !avatarUrl) {
      AvatarService.getAvatarUrlForUser(userId).then(result => {
        if (result.success) {
          setProfileAvatarUrl(result.data);
        }
      });
    }
  }, [userId, avatarUrl]);

  // Use profile avatar if available, otherwise use provided avatarUrl
  const finalAvatarUrl = profileAvatarUrl || avatarUrl;
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const avatarSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {finalAvatarUrl ? (
        <AvatarImage 
          src={AvatarService.getAvatarUrl(
            AvatarService.getFileNameFromUrl(finalAvatarUrl),
            avatarSizes[size]
          )} 
          alt={name}
        />
      ) : null}
      <AvatarFallback className={`bg-muted text-muted-foreground ${textSizes[size]}`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
