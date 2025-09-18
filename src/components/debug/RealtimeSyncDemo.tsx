import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeMerittoSync } from '@/hooks/useRealtimeMerittoSync';
import { useToast } from '@/hooks/use-toast';
import { RealtimeSyncInput } from '@/components/common/RealtimeSyncInput';
import { consoleFilters } from '@/utils/consoleFilters';

export const RealtimeSyncDemo: React.FC = () => {
  const { toast } = useToast();
  const [profileId, setProfileId] = useState('test-profile-123');
  const [applicationId, setApplicationId] = useState('test-application-456');
  
  const {
    syncProfileData,
    syncExtendedProfile,
    forceSync,
    isSyncing
  } = useRealtimeMerittoSync({
    enabled: true,
    debounceMs: 2000,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentAddress: '',
    careerGoals: '',
    workExperience: '',
  });

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Trigger real-time sync for profile fields
    if (['firstName', 'lastName', 'email', 'phone'].includes(field)) {
      syncProfileData(profileId, applicationId, { [field]: value });
    }
    
    // Trigger real-time sync for extended profile fields
    if (['currentAddress', 'careerGoals', 'workExperience'].includes(field)) {
      syncExtendedProfile(profileId, applicationId, { [field]: value });
    }
  };

  const handleForceSync = async () => {
    try {
      await forceSync(profileId, applicationId, 'realtime');
      toast({
        title: 'Success',
        description: 'Force sync completed',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Force sync failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Real-time Meritto Sync Demo</CardTitle>
          <CardDescription>
            This demo shows how real-time sync works with form field changes.
            Data is automatically synced to Meritto as you type (with debouncing).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔍 Console Debugging Tips:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Open browser console (F12) to see detailed sync logs</p>
              <p>• All sync logs are prefixed with [REALTIME SYNC], [AUTO-SAVE], [FORM INPUT], or [PROFILE EXTENDED]</p>
              <p>• Use these console commands to filter logs:</p>
              <div className="ml-4 space-y-1 font-mono text-xs">
                <p><code>filterRealtimeSyncLogs()</code> - Show only sync-related logs</p>
                <p><code>showOnlyMerittoLogs()</code> - Show only Meritto-related logs</p>
                <p><code>showOnlyErrors()</code> - Show only error logs</p>
                <p><code>resetConsoleFilters()</code> - Reset to show all logs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Console Filter Controls</CardTitle>
          <CardDescription>
            Use these buttons to filter console logs for easier debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => {
                consoleFilters.filterRealtimeSyncLogs();
                toast({ title: 'Console filter activated', description: 'Only showing sync-related logs' });
              }}
              variant="outline"
            >
              Filter Sync Logs
            </Button>
            <Button 
              onClick={() => {
                consoleFilters.showOnlyMerittoLogs();
                toast({ title: 'Console filter activated', description: 'Only showing Meritto-related logs' });
              }}
              variant="outline"
            >
              Filter Meritto Logs
            </Button>
            <Button 
              onClick={() => {
                consoleFilters.showOnlyErrors();
                toast({ title: 'Console filter activated', description: 'Only showing error logs' });
              }}
              variant="outline"
            >
              Show Only Errors
            </Button>
            <Button 
              onClick={() => {
                consoleFilters.resetConsoleFilters();
                toast({ title: 'Console filters reset', description: 'Showing all logs' });
              }}
              variant="outline"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form with Real-time Sync</CardTitle>
          <CardDescription>
            These fields automatically sync to Meritto as you type (with 2-second debounce).
            The sync indicator shows when data is being synced.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="profileId">Profile ID</Label>
              <Input
                id="profileId"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                placeholder="Enter profile ID"
              />
            </div>
            <div>
              <Label htmlFor="applicationId">Application ID</Label>
              <Input
                id="applicationId"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="Enter application ID"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleForceSync} disabled={isSyncing}>
              {isSyncing ? 'Syncing...' : 'Force Sync Now'}
            </Button>
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Syncing to Meritto...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form with Real-time Sync</CardTitle>
          <CardDescription>
            These fields automatically sync to Meritto as you type (with 2-second debounce).
            The sync indicator shows when data is being synced.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name (Profile Field)</Label>
              <RealtimeSyncInput
                profileId={profileId}
                applicationId={applicationId}
                field="first_name"
                value={formData.firstName}
                onChange={(value) => handleFieldChange('firstName', value)}
                placeholder="Enter first name"
                syncType="realtime"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name (Profile Field)</Label>
              <RealtimeSyncInput
                profileId={profileId}
                applicationId={applicationId}
                field="last_name"
                value={formData.lastName}
                onChange={(value) => handleFieldChange('lastName', value)}
                placeholder="Enter last name"
                syncType="realtime"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email (Profile Field)</Label>
              <RealtimeSyncInput
                profileId={profileId}
                applicationId={applicationId}
                field="email"
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                placeholder="Enter email"
                type="email"
                syncType="realtime"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Profile Field)</Label>
              <RealtimeSyncInput
                profileId={profileId}
                applicationId={applicationId}
                field="phone"
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                placeholder="Enter phone"
                type="tel"
                syncType="realtime"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="currentAddress">Current Address (Extended Profile Field)</Label>
            <RealtimeSyncInput
              profileId={profileId}
              applicationId={applicationId}
              field="current_address"
              value={formData.currentAddress}
              onChange={(value) => handleFieldChange('currentAddress', value)}
              placeholder="Enter current address"
              type="textarea"
              syncType="extended"
            />
          </div>

          <div>
            <Label htmlFor="careerGoals">Career Goals (Extended Profile Field)</Label>
            <RealtimeSyncInput
              profileId={profileId}
              applicationId={applicationId}
              field="career_goals"
              value={formData.careerGoals}
              onChange={(value) => handleFieldChange('careerGoals', value)}
              placeholder="Describe your career goals"
              type="textarea"
              syncType="extended"
            />
          </div>

          <div>
            <Label htmlFor="workExperience">Work Experience (Extended Profile Field)</Label>
            <RealtimeSyncInput
              profileId={profileId}
              applicationId={applicationId}
              field="work_experience_type"
              value={formData.workExperience}
              onChange={(value) => handleFieldChange('workExperience', value)}
              placeholder="Select work experience type"
              type="select"
              options={[
                { value: 'fresher', label: 'Fresher' },
                { value: '1-2-years', label: '1-2 Years' },
                { value: '3-5-years', label: '3-5 Years' },
                { value: '5-plus-years', label: '5+ Years' },
              ]}
              syncType="extended"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Form Data</CardTitle>
          <CardDescription>
            This shows the current state of the form data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeSyncDemo;
