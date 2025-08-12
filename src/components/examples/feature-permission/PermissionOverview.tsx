import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

interface PermissionOverviewProps {
  canManageCohorts: boolean;
  canManageAttendance: boolean;
  canManageFees: boolean;
  canManageUsers: boolean;
  canAccessSystem: boolean;
}

export const PermissionOverview: React.FC<PermissionOverviewProps> = ({
  canManageCohorts,
  canManageAttendance,
  canManageFees,
  canManageUsers,
  canAccessSystem
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Current Permissions Overview
        </CardTitle>
        <CardDescription>
          Your current role-based capabilities and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {canManageCohorts ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">Manage Cohorts</span>
          </div>
          <div className="flex items-center gap-2">
            {canManageAttendance ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">Manage Attendance</span>
          </div>
          <div className="flex items-center gap-2">
            {canManageFees ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">Manage Fees</span>
          </div>
          <div className="flex items-center gap-2">
            {canManageUsers ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">Manage Users</span>
          </div>
          <div className="flex items-center gap-2">
            {canAccessSystem ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm">System Access</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
