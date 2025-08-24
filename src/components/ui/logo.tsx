import React from 'react';
import { useTheme } from 'next-themes';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  // Choose logo based on theme
  const logoSrc = theme === 'dark' 
    ? 'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/lit-nav/lit-logo.svg'
    : 'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/lit-nav/lit-logo-dark.svg';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt='LIT Logo'
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span
          className={`font-semibold text-foreground ${textSizeClasses[size]}`}
        >
          LIT Dashboard
        </span>
      )}
    </div>
  );
};
