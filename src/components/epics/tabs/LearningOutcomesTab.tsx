import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

interface LearningOutcomesTabProps {
  outcomes: string[];
}

export const LearningOutcomesTab: React.FC<LearningOutcomesTabProps> = ({ outcomes }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!outcomes || outcomes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Target className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No learning outcomes defined for this epic</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayOutcomes = isExpanded ? outcomes : outcomes.slice(0, 3);
  const hasMoreOutcomes = outcomes.length > 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Learning Outcomes</span>
            <span className="text-sm text-muted-foreground">({outcomes.length})</span>
          </div>
          {hasMoreOutcomes && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All
                </>
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {displayOutcomes.map((outcome, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span className="text-foreground leading-relaxed">{outcome}</span>
            </li>
          ))}
        </ul>
        {!isExpanded && hasMoreOutcomes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              +{outcomes.length - 3} more outcomes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
