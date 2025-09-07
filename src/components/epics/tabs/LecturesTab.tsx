import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, FileText, Video, Link as LinkIcon, ChevronDown, ChevronUp, Package, Upload, CheckCircle } from 'lucide-react';
import type { LectureModule, Deliverable } from '@/types/experience';

interface LecturesTabProps {
  groupedContent: {
    [challengeTitle: string]: {
      lectures: LectureModule[];
      deliverables: Deliverable[];
    };
  };
}

interface ExpandableLectureDetailsProps {
  learningOutcomes: string[];
  connectedDeliverables: Deliverable[];
  canvaDeckLinks?: string[];
  canvaNotesLinks?: string[];
}

const ExpandableLectureDetails: React.FC<ExpandableLectureDetailsProps> = ({ 
  learningOutcomes,
  connectedDeliverables, 
  canvaDeckLinks = [], 
  canvaNotesLinks = [] 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalContent = learningOutcomes.length + connectedDeliverables.length + canvaDeckLinks.length + canvaNotesLinks.length;
  const hasContent = totalContent > 0;
  
  if (!hasContent) return null;

  const getDeliverableIcon = (type: string) => {
    switch (type) {
      case 'file_upload':
        return <Upload className="h-3 w-3" />;
      case 'url':
        return <LinkIcon className="h-3 w-3" />;
      case 'text_submission':
        return <FileText className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-muted-foreground">
          Details ({totalContent} items)
        </h5>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 px-2 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show Details
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {/* Learning Outcomes */}
          {learningOutcomes.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-muted-foreground">Learning Outcomes:</h6>
              <ul className="space-y-1">
                {learningOutcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-foreground">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connected Deliverables */}
          {connectedDeliverables.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-muted-foreground">Connected Deliverables:</h6>
              <div className="space-y-3">
                {connectedDeliverables.map((deliverable) => (
                  <div key={deliverable.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start space-x-2">
                      {getDeliverableIcon(deliverable.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h7 className="text-sm font-medium text-foreground">{deliverable.title}</h7>
                          <Badge variant="secondary" className="text-xs">
                            {getDeliverableTypeLabel(deliverable.type)}
                          </Badge>
                          {deliverable.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{deliverable.description}</p>
                        {deliverable.brand_context && (
                          <p className="text-xs text-blue-600 font-medium">{deliverable.brand_context}</p>
                        )}
                        {(deliverable.file_url || deliverable.url) && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              {deliverable.file_url ? 'File available' : 'URL provided'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canva Links */}
          {(canvaDeckLinks.length > 0 || canvaNotesLinks.length > 0) && (
            <div className="space-y-2">
              <h6 className="text-sm font-medium text-muted-foreground">Presentation Materials:</h6>
              <div className="flex flex-wrap gap-2">
                {canvaDeckLinks.map((link, index) => (
                  <Button
                    key={`deck-${index}`}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    asChild
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="text-xs">Deck {index + 1}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
                {canvaNotesLinks.map((link, index) => (
                  <Button
                    key={`notes-${index}`}
                    variant="outline"
                    size="sm"
                    className="h-8"
                    asChild
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="text-xs">Notes {index + 1}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const LecturesTab: React.FC<LecturesTabProps> = ({ groupedContent }) => {
  const hasLectures = Object.values(groupedContent).some(group => group.lectures.length > 0);

  if (!hasLectures) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No lectures available for this epic</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to get connected deliverables for a lecture
  const getConnectedDeliverables = (lecture: LectureModule, allDeliverables: Deliverable[]): Deliverable[] => {
    if (!lecture.connected_deliverables || lecture.connected_deliverables.length === 0) {
      return [];
    }
    
    return allDeliverables.filter(deliverable => 
      lecture.connected_deliverables!.includes(deliverable.id)
    );
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedContent).map(([challengeTitle, { lectures, deliverables }]) => {
        if (lectures.length === 0) return null;

        return (
          <div key={challengeTitle} className="space-y-6">
            <div className="border-b pb-2">
              <h3 className="text-xl font-semibold text-foreground">{challengeTitle}</h3>
            </div>
            <div className="space-y-6">
              {lectures
                .sort((a, b) => a.order - b.order)
                .map((lecture) => {
                  const connectedDeliverables = getConnectedDeliverables(lecture, deliverables);
                  
                  return (
                    <div key={lecture.id} className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-lg font-medium text-foreground">{lecture.title}</h4>
                          {lecture.description && (
                            <p className="text-muted-foreground">{lecture.description}</p>
                          )}
                        </div>
                        <Badge variant="outline">
                          Session {lecture.order}
                        </Badge>
                      </div>

                      {/* Expandable Learning Outcomes and Connected Deliverables */}
                      <ExpandableLectureDetails
                        learningOutcomes={lecture.learning_outcomes || []}
                        connectedDeliverables={connectedDeliverables}
                        canvaDeckLinks={lecture.canva_deck_links || []}
                        canvaNotesLinks={lecture.canva_notes_links || []}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
