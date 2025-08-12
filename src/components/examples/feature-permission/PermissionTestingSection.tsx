import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PermissionTestingSectionProps {
  testPermission: (feature: string) => void;
  getRolePermissions: () => string[];
}

export const PermissionTestingSection: React.FC<PermissionTestingSectionProps> = ({
  testPermission,
  getRolePermissions
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Testing</CardTitle>
        <CardDescription>
          Test specific permissions and see the results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Quick Permission Tests</h4>
            <div className="flex flex-wrap gap-2">
              {['cohorts.view', 'attendance.mark', 'fees.collect', 'users.create'].map(feature => (
                <Button
                  key={feature}
                  size="sm"
                  variant="outline"
                  onClick={() => testPermission(feature)}
                >
                  {feature}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Current Permissions</h4>
            <div className="flex flex-wrap gap-1">
              {getRolePermissions().map(permission => (
                <Badge key={permission} variant="secondary" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
