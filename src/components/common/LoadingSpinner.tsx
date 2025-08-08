/**
 * Reusable loading spinner component with variants
 * Enterprise-level loading states with consistent design
 */

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  'animate-spin rounded-full border-2 border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary',
        secondary: 'text-secondary-foreground',
        muted: 'text-muted-foreground',
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  className,
  size,
  variant,
  label = 'Loading...',
  fullScreen = false,
  ...props
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'min-h-screen bg-background',
        !fullScreen && 'p-4',
        className
      )}
      {...props}
    >
      <div className="text-center space-y-2">
        <div className={cn(spinnerVariants({ size, variant }), 'mx-auto')} />
        {label && (
          <p className="text-sm text-muted-foreground">{label}</p>
        )}
      </div>
    </div>
  );

  return spinner;
}

// Specific loading components for common use cases
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return <LoadingSpinner fullScreen label={message} size="lg" />;
}

export function InlineLoader({ message }: { message?: string }) {
  return <LoadingSpinner label={message} size="sm" className="py-2" />;
}

export function ButtonLoader() {
  return <LoadingSpinner size="sm" className="p-0" label="" />;
}