import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Eye } from 'lucide-react';
import { SystemFeatureGate } from '@/components/common';

export const SystemAdministrationSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Administration
        </CardTitle>
        <CardDescription>
          Examples of system administration feature gates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <SystemFeatureGate action="settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </Button>
          </SystemFeatureGate>
          
          <SystemFeatureGate action="analytics">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Analytics
            </Button>
          </SystemFeatureGate>
          
          <SystemFeatureGate action="reports">
            <Button variant="outline" size="sm" className="gap-2">
              Download
              Generate Reports
            </Button>
          </SystemFeatureGate>
          
          <SystemFeatureGate action="logs">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Logs
            </Button>
          </SystemFeatureGate>
        </div>
      </CardContent>
    </Card>
  );
};
