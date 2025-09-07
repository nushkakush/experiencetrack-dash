/**
 * Expansion Citations Component
 * Displays citations from Perplexity expansion responses in experience context
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, Calendar, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ExpansionCitation {
  index: number;
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  domain?: string;
}

interface ExpansionCitationsProps {
  citations: ExpansionCitation[];
  brandName?: string;
  briefTitle?: string;
  className?: string;
}

export const ExpansionCitations: React.FC<ExpansionCitationsProps> = ({
  citations,
  brandName,
  briefTitle,
  className = ''
}) => {
  if (!citations || citations.length === 0) {
    return null;
  }

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

  const getDomainType = (domain?: string) => {
    if (!domain) return { type: 'other', color: 'secondary' };
    
    if (domain.includes('.edu')) return { type: 'academic', color: 'blue' };
    if (domain.includes('.gov')) return { type: 'government', color: 'green' };
    if (domain.includes('.org')) return { type: 'organization', color: 'purple' };
    if (domain.includes('news') || domain.includes('times') || domain.includes('post')) {
      return { type: 'news', color: 'orange' };
    }
    return { type: 'commercial', color: 'secondary' };
  };

  const groupedCitations = citations.reduce((acc, citation) => {
    const domainInfo = getDomainType(citation.domain);
    if (!acc[domainInfo.type]) {
      acc[domainInfo.type] = [];
    }
    acc[domainInfo.type].push({ ...citation, domainColor: domainInfo.color });
    return acc;
  }, {} as Record<string, Array<ExpansionCitation & { domainColor: string }>>);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Research Sources
          {brandName && (
            <Badge variant="outline" className="ml-2">
              {brandName}
            </Badge>
          )}
        </CardTitle>
        {briefTitle && (
          <p className="text-sm text-muted-foreground">
            Sources used for expanding: <span className="font-medium">{briefTitle}</span>
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe2 className="h-4 w-4" />
            <span>{citations.length} sources</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Real-time research</span>
          </div>
        </div>

        <Separator />

        {Object.entries(groupedCitations).map(([type, typeCitations]) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {type} Sources ({typeCitations.length})
              </Badge>
            </div>

            <div className="grid gap-2">
              {typeCitations.map((citation) => (
                <Card 
                  key={citation.index} 
                  className="border-l-4 border-l-primary/30 cursor-pointer hover:shadow-md hover:border-l-primary/60 transition-all duration-200 group"
                  onClick={() => window.open(citation.url, '_blank', 'noopener,noreferrer')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            [{citation.index}]
                          </Badge>
                          
                          {citation.domain && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-1.5 py-0.5 bg-${citation.domainColor}-100 text-${citation.domainColor}-800`}
                            >
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
                        
                        <h4 className="font-medium text-sm leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {citation.title}
                        </h4>
                        
                        {citation.snippet && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-2 leading-relaxed">
                            {citation.snippet}
                          </p>
                        )}
                        
                        <div className="text-xs text-muted-foreground truncate group-hover:text-primary/80 transition-colors">
                          {citation.url}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <Separator />

        <div className="text-xs text-muted-foreground text-center py-2">
          <div className="flex items-center justify-center gap-1">
            <span>Powered by</span>
            <Badge variant="outline" className="text-xs">
              Perplexity Sonar Pro
            </Badge>
            <span>• Real-time web research</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpansionCitations;
