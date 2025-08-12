import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { FeaturePermissionDebug } from '@/components/common';
import { toast } from 'sonner';
import {
  PermissionOverview,
  CohortManagementSection,
  AttendanceManagementSection,
  FeeManagementSection,
  SystemAdministrationSection,
  PermissionTestingSection
} from './feature-permission';

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
        icon: hasAccess ? '✅' : '❌',
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
      <PermissionOverview
        canManageCohorts={canManageCohorts}
        canManageAttendance={canManageAttendance}
        canManageFees={canManageFees}
        canManageUsers={canManageUsers}
        canAccessSystem={canAccessSystem}
      />

      {/* Cohort Management Section */}
      <CohortManagementSection
        hasAllPermissions={hasAllPermissions}
        hasAnyPermission={hasAnyPermission}
      />

      {/* Attendance Management Section */}
      <AttendanceManagementSection />

      {/* Fee Management Section */}
      <FeeManagementSection />

      {/* System Administration Section */}
      <SystemAdministrationSection />

      {/* Permission Testing Section */}
      <PermissionTestingSection
        testPermission={testPermission}
        getRolePermissions={getRolePermissions}
      />
    </div>
  );
};
