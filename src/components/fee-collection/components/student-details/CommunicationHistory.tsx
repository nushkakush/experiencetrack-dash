import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Bell } from 'lucide-react';
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
      {communications.length > 0 ? (
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
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Communication History</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            No communication has been sent to this student yet. Communication history will appear here once emails, notifications, or other messages are sent.
          </p>
          
          {/* Communication Types Preview */}
          <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Payment reminders and updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium">Payment Confirmations</p>
                <p className="text-xs text-muted-foreground">Receipts and confirmations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Bell className="h-5 w-5 text-orange-600" />
              <div className="text-left">
                <p className="text-sm font-medium">System Notifications</p>
                <p className="text-xs text-muted-foreground">Important announcements</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
