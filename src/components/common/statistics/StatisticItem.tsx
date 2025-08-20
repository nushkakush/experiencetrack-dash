import React from 'react';
import { cn } from '@/lib/utils';

interface StatisticItemProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  success:
    'bg-green-900 border-green-700 dark:bg-green-900/20 dark:border-green-700/50',
  warning:
    'bg-yellow-900 border-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700/50',
  error: 'bg-red-900 border-red-700 dark:bg-red-900/20 dark:border-red-700/50',
  info: 'bg-blue-900 border-blue-700 dark:bg-blue-900/20 dark:border-blue-700/50',
  purple:
    'bg-purple-900 border-purple-700 dark:bg-purple-900/20 dark:border-purple-700/50',
};

const textVariantStyles = {
  default: 'text-gray-900 dark:text-gray-100',
  success: 'text-green-100 dark:text-green-300',
  warning: 'text-yellow-100 dark:text-yellow-300',
  error: 'text-red-100 dark:text-red-300',
  info: 'text-blue-100 dark:text-blue-300',
  purple: 'text-purple-100 dark:text-purple-300',
};

const subtitleVariantStyles = {
  default: 'text-gray-600 dark:text-gray-400',
  success: 'text-green-400 dark:text-green-400',
  warning: 'text-yellow-400 dark:text-yellow-400',
  error: 'text-red-400 dark:text-red-400',
  info: 'text-blue-400 dark:text-blue-400',
  purple: 'text-purple-400 dark:text-purple-400',
};

export const StatisticItem: React.FC<StatisticItemProps> = ({
  icon,
  title,
  value,
  subtitle,
  badge,
  variant = 'default',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col p-4 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2'>
          {icon && (
            <div className={cn('flex-shrink-0', textVariantStyles[variant])}>
              {icon}
            </div>
          )}
          <h3 className={cn('font-medium text-sm', textVariantStyles[variant])}>
            {title}
          </h3>
        </div>
        {badge && <div className='flex-shrink-0'>{badge}</div>}
      </div>

      <div className='flex items-end justify-between'>
        <div className={cn('text-2xl font-bold', textVariantStyles[variant])}>
          {value}
        </div>
      </div>

      {subtitle && (
        <p className={cn('text-xs mt-1', subtitleVariantStyles[variant])}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
