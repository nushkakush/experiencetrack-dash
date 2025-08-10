import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Copy, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { toast } from 'sonner';

interface PermissionOverviewProps {
  onCopyPermissions: () => void;
  onDownloadPermissions: () => void;
}

export const PermissionOverview: React.FC<PermissionOverviewProps> = ({
  onCopyPermissions,
  onDownloadPermissions,
}) => {
  const { profile } = useAuth();
  const { 
    canManageCohorts,
    canManageAttendance,
    canManageFees,
    canManageUsers,
    canAccessSystem,
    canManagePartnerships,
    canManagePlacements,
    canManageHolidays,
  } = useFeaturePermissions();

  const capabilities = [
    { name: 'Cohorts', value: canManageCohorts },
    { name: 'Attendance', value: canManageAttendance },
    { name: 'Fees', value: canManageFees },
    { name: 'Users', value: canManageUsers },
    { name: 'System', value: canAccessSystem },
    { name: 'Partnerships', value: canManagePartnerships },
    { name: 'Placements', value: canManagePlacements },
    { name: 'Holidays', value: canManageHolidays },
  ];

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>User Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Role</p>
              <Badge variant="secondary">{profile?.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Role Capabilities</CardTitle>
          <CardDescription>
            High-level permissions based on your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {capabilities.map((capability) => (
              <div key={capability.name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{capability.name}</span>
                {capability.value ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
          <CardDescription>
            Export or copy permission data for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyPermissions}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPermissions}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
