import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  Shield, 
  CheckCircle, 
  XCircle,
  Eye,
  Edit,
  Trash,
  Plus
} from 'lucide-react';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { 
  FeatureGate, 
  CohortFeatureGate, 
  AttendanceFeatureGate, 
  FeeFeatureGate,
  UserFeatureGate,
  SystemFeatureGate,
  FeaturePermissionDebug
} from '@/components/common';
import { toast } from 'sonner';

/**
 * Example component demonstrating the feature permission system
 * This shows various ways to use the permission system in practice
 */
export const FeaturePermissionExample: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageCohorts,
    canManageAttendance,
    canManageFees,
    canManageUsers,
    canAccessSystem,
    getRolePermissions,
  } = useFeaturePermissions();

  const handleAction = (action: string, feature: string) => {
    toast.success(`${action} action performed`, {
      description: `Feature: ${feature}`,
    });
  };

  const testPermission = (feature: string) => {
    const hasAccess = hasPermission(feature as any);
    toast(
      hasAccess ? 'Permission granted' : 'Permission denied',
      {
        description: `Testing: ${feature}`,
        icon: hasAccess ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Permission System Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates the scalable and maintainable feature permission system
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDebug(!showDebug)}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            {showDebug ? 'Hide' : 'Show'} Debug Panel
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <FeaturePermissionDebug show={showDebug} onClose={() => setShowDebug(false)} />
      )}

      {/* Permission Overview */}
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

      {/* Cohort Management Section */}
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

      {/* Attendance Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Management
          </CardTitle>
          <CardDescription>
            Examples of attendance-related feature gates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <AttendanceFeatureGate action="view">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Attendance
              </Button>
            </AttendanceFeatureGate>
            
            <AttendanceFeatureGate action="mark">
              <Button variant="outline" size="sm" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Mark Attendance
              </Button>
            </AttendanceFeatureGate>
            
            <AttendanceFeatureGate action="edit">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Attendance
              </Button>
            </AttendanceFeatureGate>
            
            <AttendanceFeatureGate action="export">
              <Button variant="outline" size="sm" className="gap-2">
                Download
                Export Data
              </Button>
            </AttendanceFeatureGate>
          </div>
        </CardContent>
      </Card>

      {/* Fee Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Management
          </CardTitle>
          <CardDescription>
            Examples of fee-related feature gates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <FeeFeatureGate action="view">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Fees
              </Button>
            </FeeFeatureGate>
            
            <FeeFeatureGate action="collect">
              <Button variant="outline" size="sm" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Collect Fees
              </Button>
            </FeeFeatureGate>
            
            <FeeFeatureGate action="waive">
              <Button variant="outline" size="sm" className="gap-2">
                <XCircle className="h-4 w-4" />
                Waive Fees
              </Button>
            </FeeFeatureGate>
            
            <FeeFeatureGate action="reports">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                View Reports
              </Button>
            </FeeFeatureGate>
          </div>
        </CardContent>
      </Card>

      {/* System Administration Section */}
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

      {/* Permission Testing Section */}
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
    </div>
  );
};
