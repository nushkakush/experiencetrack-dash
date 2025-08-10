import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { FeatureKey } from '@/types/features';
import { toast } from 'sonner';

interface FeatureListProps {
  features: FeatureKey[];
  onTestPermission: (feature: FeatureKey) => void;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  onTestPermission,
}) => {
  const { 
    hasPermission, 
    getFeatureMetadata,
    isFeatureDeprecated,
    isFeatureExperimental,
  } = useFeaturePermissions();

  return (
    <div className="grid gap-4">
      {features.map(feature => {
        const metadata = getFeatureMetadata(feature);
        const hasAccess = hasPermission(feature);
        const isDeprecated = isFeatureDeprecated(feature);
        const isExperimental = isFeatureExperimental(feature);
        
        return (
          <Card key={feature}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{metadata?.name}</h3>
                    {hasAccess ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {isDeprecated && (
                      <Badge variant="destructive" className="text-xs">Deprecated</Badge>
                    )}
                    {isExperimental && (
                      <Badge variant="secondary" className="text-xs">Experimental</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{metadata?.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <code className="bg-muted px-2 py-1 rounded">{feature}</code>
                    <span>Category: {metadata?.category}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTestPermission(feature)}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
