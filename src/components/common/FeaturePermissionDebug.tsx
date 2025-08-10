import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  XCircle,
  Copy,
  Download,
} from 'lucide-react';
import { FeatureKey } from '@/types/features';
import { FEATURE_GROUPS, FEATURE_METADATA } from '@/config/featurePermissions';
import { toast } from 'sonner';
import { PermissionOverview, FeatureList, FeatureFilters } from './debug';

interface FeaturePermissionDebugProps {
  show?: boolean;
  onClose?: () => void;
}

/**
 * Debug component for viewing and testing feature permissions
 * Only shows in development mode
 */
export const FeaturePermissionDebug: React.FC<FeaturePermissionDebugProps> = ({
  show = false,
  onClose,
}) => {
  const { profile } = useAuth();
  const { 
    hasPermission, 
    getRolePermissions,
    getFeatureMetadata,
    isFeatureDeprecated,
    isFeatureExperimental,
  } = useFeaturePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeprecated, setShowDeprecated] = useState(true);
  const [showExperimental, setShowExperimental] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Only show in development
  if (process.env.NODE_ENV !== 'development' && !show) {
    return null;
  }

  const allFeatures = Object.keys(FEATURE_METADATA) as FeatureKey[];
  const userPermissions = getRolePermissions();
  
  const filteredFeatures = allFeatures.filter(feature => {
    const metadata = getFeatureMetadata(feature);
    if (!metadata) return false;
    
    const matchesSearch = metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         metadata.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isDeprecated = isFeatureDeprecated(feature);
    const isExperimental = isFeatureExperimental(feature);
    
    return matchesSearch && 
           (showDeprecated || !isDeprecated) && 
           (showExperimental || !isExperimental);
  });

  const copyPermissionsToClipboard = () => {
    const permissionsData = {
      user: {
        name: `${profile?.first_name} ${profile?.last_name}`,
        role: profile?.role,
        email: profile?.email,
      },
      permissions: userPermissions,
    };

    navigator.clipboard.writeText(JSON.stringify(permissionsData, null, 2));
    toast.success('Permissions copied to clipboard');
  };

  const downloadPermissions = () => {
    const permissionsData = {
      user: {
        name: `${profile?.first_name} ${profile?.last_name}`,
        role: profile?.role,
        email: profile?.email,
      },
      permissions: userPermissions,
      features: filteredFeatures.map(feature => ({
        feature,
        metadata: getFeatureMetadata(feature),
        hasPermission: hasPermission(feature),
        isDeprecated: isFeatureDeprecated(feature),
        isExperimental: isFeatureExperimental(feature),
      })),
    };

    const blob = new Blob([JSON.stringify(permissionsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permissions-${profile?.role}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Permissions downloaded');
  };

  const testPermission = (feature: FeatureKey) => {
    const hasAccess = hasPermission(feature);
    toast(
      hasAccess ? 'Permission granted' : 'Permission denied',
      {
        description: `Testing: ${feature}`,
        icon: hasAccess ? '✅' : '❌',
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto p-4 h-full overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Feature Permissions Debug
                </CardTitle>
                <CardDescription>
                  Debug and test feature permissions for {profile?.first_name} {profile?.last_name} ({profile?.role})
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyPermissionsToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPermissions}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {onClose && (
                  <Button variant="outline" size="sm" onClick={onClose}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">All Features</TabsTrigger>
                <TabsTrigger value="groups">By Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <PermissionOverview
                  onCopyPermissions={copyPermissionsToClipboard}
                  onDownloadPermissions={downloadPermissions}
                />
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Filter Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeatureFilters
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      showDeprecated={showDeprecated}
                      onShowDeprecatedChange={setShowDeprecated}
                      showExperimental={showExperimental}
                      onShowExperimentalChange={setShowExperimental}
                      filteredCount={filteredFeatures.length}
                      totalCount={allFeatures.length}
                    />
                  </CardContent>
                </Card>

                <FeatureList
                  features={filteredFeatures}
                  onTestPermission={testPermission}
                />
              </TabsContent>

              <TabsContent value="groups" className="space-y-4">
                <div className="grid gap-4">
                  {FEATURE_GROUPS.map(group => {
                    const groupFeatures = group.features.filter(feature => 
                      filteredFeatures.includes(feature)
                    );
                    
                    if (groupFeatures.length === 0) return null;
                    
                    return (
                      <Card key={group.category}>
                        <CardHeader>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <FeatureList
                            features={groupFeatures}
                            onTestPermission={testPermission}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
