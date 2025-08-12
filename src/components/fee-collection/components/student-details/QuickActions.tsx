import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, Award, UserX } from 'lucide-react';

export const QuickActions: React.FC = () => {
  return (
    <>
      <div>
        <h4 className="font-semibold mb-4 text-foreground">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="text-xs h-9 bg-background border-border hover:bg-muted">
            <Calendar className="h-3 w-3 mr-1" />
            Schedule Present
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9 bg-background border-border hover:bg-muted">
            <Download className="h-3 w-3 mr-1" />
            Download Files
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9 bg-background border-border hover:bg-muted">
            <Award className="h-3 w-3 mr-1" />
            Award Scholarship
          </Button>
          <Button variant="destructive" size="sm" className="text-xs h-9">
            <UserX className="h-3 w-3 mr-1" />
            Mark as Dropped
          </Button>
        </div>
      </div>
      <Separator className="bg-border" />
    </>
  );
};
