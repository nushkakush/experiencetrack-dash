import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CommunicationHistory } from '@/types/fee';

interface CommunicationHistoryProps {
  communications: CommunicationHistory[];
}

export const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({ communications }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div>
      <h4 className="font-semibold mb-4 text-foreground">Communication History</h4>
      <div className="space-y-3">
        {communications.map((comm) => (
          <div key={comm.id} className="border border-border rounded-lg p-3 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-muted text-muted-foreground border-border text-xs">
                {comm.type}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDate(comm.sent_at)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{comm.subject}</p>
            <p className="text-xs text-foreground">{comm.message}</p>
          </div>
        ))}
        {communications.length === 0 && (
          <p className="text-xs text-muted-foreground">No communication history</p>
        )}
      </div>
    </div>
  );
};
