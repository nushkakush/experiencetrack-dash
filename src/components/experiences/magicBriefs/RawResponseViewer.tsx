/**
 * Raw Response Viewer Component
 * Shows the raw Perplexity response for debugging and analysis
 */

import React from 'react';
import { Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CopyButton } from '@/components/ui/copy-button';

interface RawResponseViewerProps {
  rawResponse?: any;
  briefTitle?: string;
  className?: string;
}

export const RawResponseViewer: React.FC<RawResponseViewerProps> = ({
  rawResponse,
  briefTitle,
  className = ''
}) => {
  if (!rawResponse) {
    return null;
  }

  const formatResponse = (response: any) => {
    if (typeof response === 'string') {
      return response;
    }
    return JSON.stringify(response, null, 2);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${className} border-dashed border-purple-300 text-purple-700 hover:bg-purple-50`}
        >
          <Code2 className="h-4 w-4 mr-2" />
          Raw Response
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Raw Perplexity Response
            {briefTitle && (
              <Badge variant="outline" className="ml-2">
                {briefTitle}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Complete raw response from Perplexity API for debugging and analysis
            </div>
        <CopyButton
          data={rawResponse}
          label="Copy JSON"
          successMessage="Raw response copied to clipboard!"
          errorMessage="Failed to copy response"
          className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
          size="sm"
        />
          </div>

          <ScrollArea className="h-[60vh] w-full border rounded-lg">
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
              {formatResponse(rawResponse)}
            </pre>
          </ScrollArea>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Debug Info:</strong> This shows the complete raw response from Perplexity, including all citations, search results, and metadata. Use this to verify that citations are being properly extracted and connected to the content.
            <br /><br />
            <strong>💡 Tip:</strong> Click "Copy JSON" above to copy the raw data to your clipboard for analysis in external tools.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RawResponseViewer;
