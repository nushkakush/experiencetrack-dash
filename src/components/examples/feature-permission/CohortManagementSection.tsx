import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Eye, Plus, Edit, Trash, CheckCircle, XCircle } from 'lucide-react';
import { CohortFeatureGate } from '@/components/common';
import { toast } from 'sonner';

interface CohortManagementSectionProps {
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

export const CohortManagementSection: React.FC<CohortManagementSectionProps> = ({
  hasAllPermissions,
  hasAnyPermission
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Cohort Management
        </CardTitle>
        <CardDescription>
          Examples of cohort-related feature gates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <CohortFeatureGate action="view">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View Cohorts
            </Button>
          </CohortFeatureGate>
          
          <CohortFeatureGate action="create">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Cohort
            </Button>
          </CohortFeatureGate>
          
          <CohortFeatureGate action="edit">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Cohort
            </Button>
          </CohortFeatureGate>
          
          <CohortFeatureGate action="delete">
            <Button variant="outline" size="sm" className="gap-2">
              <Trash className="h-4 w-4" />
              Delete Cohort
            </Button>
          </CohortFeatureGate>
        </div>

        {/* Advanced permission check */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Advanced Permission Check</h4>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const canViewAndCreate = hasAllPermissions(['cohorts.view', 'cohorts.create']);
                toast(
                  canViewAndCreate ? 'Can view and create cohorts' : 'Cannot view and create cohorts',
                  {
                    description: 'Testing multiple permissions',
                    icon: canViewAndCreate ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />,
                  }
                );
              }}
            >
              Test: View + Create
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                const canViewOrCreate = hasAnyPermission(['cohorts.view', 'cohorts.create']);
                toast(
                  canViewOrCreate ? 'Can view OR create cohorts' : 'Cannot view or create cohorts',
                  {
                    description: 'Testing any permission',
                    icon: canViewOrCreate ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />,
                  }
                );
              }}
            >
              Test: View OR Create
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
