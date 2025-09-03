import React from 'react';
import { Calendar, Building2, Expand, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MagicBrief } from '@/types/magicBrief';
import { formatSources } from '@/utils/sourceFormatting';

interface MagicBriefCardProps {
  brief: MagicBrief;
  onExpand: (brief: MagicBrief) => void;
  onDelete: (brief: MagicBrief) => void;
  onPreview: (brief: MagicBrief) => void;
}

/**
 * Individual magic brief card component
 * Displays brief info and actions
 */
export const MagicBriefCard: React.FC<MagicBriefCardProps> = ({
  brief,
  onExpand,
  onDelete,
  onPreview
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3" onClick={() => onPreview(brief)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                #{brief.challenge_order}
              </Badge>
              <CardTitle className="text-lg line-clamp-2">
                {brief.title}
              </CardTitle>
            </div>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              {brief.brand_name}
            </CardDescription>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {brief.skill_focus}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {brief.expanded && (
              <Badge variant="secondary" className="text-xs">
                Expanded
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3" onClick={() => onPreview(brief)}>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {formatSources(truncateText(brief.challenge_statement))}
        </p>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(brief.created_at)}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onExpand(brief);
              }}
            >
              <Expand className="h-4 w-4 mr-1" />
              {brief.expanded ? 'Expand Again' : 'Expand'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(brief);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
