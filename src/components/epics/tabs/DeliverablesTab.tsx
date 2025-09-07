import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Upload, Link as LinkIcon, FileText, CheckCircle } from 'lucide-react';
import type { Deliverable } from '@/types/experience';

interface DeliverablesTabProps {
  groupedContent: {
    [challengeTitle: string]: {
      lectures: any[];
      deliverables: Deliverable[];
    };
  };
}

export const DeliverablesTab: React.FC<DeliverablesTabProps> = ({ groupedContent }) => {
  const hasDeliverables = Object.values(groupedContent).some(group => group.deliverables.length > 0);

  if (!hasDeliverables) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Package className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No deliverables available for this epic</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDeliverableIcon = (type: string) => {
    switch (type) {
      case 'file_upload':
        return <Upload className="h-4 w-4" />;
      case 'url':
        return <LinkIcon className="h-4 w-4" />;
      case 'text_submission':
        return <FileText className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getDeliverableTypeLabel = (type: string) => {
    switch (type) {
      case 'file_upload':
        return 'File Upload';
      case 'url':
        return 'URL Submission';
      case 'text_submission':
        return 'Text Submission';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedContent).map(([challengeTitle, { deliverables }]) => {
        if (deliverables.length === 0) return null;

        return (
          <div key={challengeTitle} className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="text-xl font-semibold text-foreground">{challengeTitle}</h3>
            </div>
            <div className="space-y-6">
              {deliverables.map((deliverable) => (
                <div key={deliverable.id} className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        {getDeliverableIcon(deliverable.type)}
                        <h4 className="text-lg font-medium text-foreground">{deliverable.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {getDeliverableTypeLabel(deliverable.type)}
                        </Badge>
                        {deliverable.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{deliverable.description}</p>
                    </div>
                  </div>


                  {/* File URL or URL */}
                  {(deliverable.file_url || deliverable.url) && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Reference:</h5>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-foreground">
                          {deliverable.file_url ? 'File available' : 'URL provided'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ID: {deliverable.id}</span>
                    {deliverable.required && (
                      <span className="text-destructive font-medium">Required for completion</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
