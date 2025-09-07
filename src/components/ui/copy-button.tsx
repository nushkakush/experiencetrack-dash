import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyButtonProps {
  data: any;
  label?: string;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  showIcon?: boolean;
}

/**
 * Reusable copy button component for copying any data to clipboard
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  data,
  label = 'Copy',
  successMessage = 'Data copied to clipboard!',
  errorMessage = 'Failed to copy data',
  className = '',
  size = 'sm',
  variant = 'outline',
  showIcon = true
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) {
      toast.error('No data to copy');
      return;
    }

    try {
      const textToCopy = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(successMessage, {
        description: 'You can now paste it into a document for analysis',
        duration: 3000
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error(errorMessage, {
        description: 'Please try again or manually copy the text',
        duration: 3000
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`flex items-center gap-2 ${className}`}
    >
      {showIcon && (
        copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )
      )}
      {copied ? 'Copied!' : label}
    </Button>
  );
};

export default CopyButton;
