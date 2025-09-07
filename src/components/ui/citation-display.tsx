/**
 * Citation Display Component
 * Displays citations from Perplexity responses with improved UX
 */

import React from 'react';
import { ExternalLink, Calendar, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Citation {
  index: number;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  domain?: string;
}

interface CitationDisplayProps {
  citations: Citation[];
  className?: string;
  showSnippets?: boolean;
  maxCitations?: number;
}

export const CitationDisplay: React.FC<CitationDisplayProps> = ({
  citations,
  className = '',
  showSnippets = true,
  maxCitations = 10
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  const displayCitations = citations.slice(0, maxCitations);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getDomainColor = (domain?: string) => {
    if (!domain) return 'secondary';
    
    // Color coding for common domains
    if (domain.includes('edu')) return 'blue';
    if (domain.includes('gov')) return 'green';
    if (domain.includes('org')) return 'purple';
    if (domain.includes('com')) return 'orange';
    return 'secondary';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Sources ({displayCitations.length})</span>
      </div>
      
      <div className="grid gap-2">
        {displayCitations.map((citation) => (
          <Card key={citation.index} className="border-l-4 border-l-primary/20">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {citation.index}
                    </Badge>
                    {citation.domain && (
                      <Badge variant="secondary" className="text-xs">
                        {citation.domain}
                      </Badge>
                    )}
                    {citation.publishedDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(citation.publishedDate)}</span>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                    {citation.title}
                  </h4>
                  
                  {showSnippets && citation.snippet && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {citation.snippet}
                    </p>
                  )}
                  
                  <div className="text-xs text-muted-foreground truncate">
                    {citation.url}
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={() => window.open(citation.url, '_blank', 'noopener,noreferrer')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open source</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {citations.length > maxCitations && (
        <div className="text-xs text-muted-foreground text-center py-2">
          +{citations.length - maxCitations} more sources
        </div>
      )}
    </div>
  );
};

export default CitationDisplay;
