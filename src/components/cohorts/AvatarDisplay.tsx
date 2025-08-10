import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarService } from '@/services/avatar.service';

interface AvatarDisplayProps {
  avatarUrl?: string | null;
  studentName: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AvatarDisplay({
  avatarUrl,
  studentName,
  size = 'md',
}: AvatarDisplayProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {avatarUrl ? (
        <AvatarImage 
          src={AvatarService.getAvatarUrl(
            AvatarService.getFileNameFromUrl(avatarUrl),
            { 
              width: size === 'sm' ? 32 : size === 'md' ? 48 : 64, 
              height: size === 'sm' ? 32 : size === 'md' ? 48 : 64, 
              quality: 80 
            }
          )} 
          alt={studentName}
        />
      ) : null}
      <AvatarFallback className="bg-muted text-muted-foreground">
        {getInitials(studentName)}
      </AvatarFallback>
    </Avatar>
  );
}
