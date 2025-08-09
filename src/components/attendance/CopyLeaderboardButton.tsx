import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyLeaderboardButtonProps {
  cohortId: string;
  epicId: string;
  cohortName?: string;
  epicName?: string;
}

export const CopyLeaderboardButton: React.FC<CopyLeaderboardButtonProps> = ({
  cohortId,
  epicId,
  cohortName,
  epicName,
}) => {
  const [copied, setCopied] = useState(false);

  const generatePublicLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/leaderboard/${cohortId}/${epicId}`;
  };

  const handleCopyLink = async () => {
    try {
      const publicLink = generatePublicLink();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(publicLink);
      
      setCopied(true);
      toast.success('Leaderboard link copied to clipboard!', {
        description: 'Share this link to show real-time attendance rankings',
      });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link', {
        description: 'Please try again or copy the URL manually',
      });
    }
  };

  const handleOpenInNewTab = () => {
    const publicLink = generatePublicLink();
    window.open(publicLink, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Public Link
          </>
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenInNewTab}
        className="flex items-center gap-2"
        title="Open in new tab"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};
