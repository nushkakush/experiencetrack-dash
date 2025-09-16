import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { MeritoService } from '@/services/merito.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function MeritoExtendedRegistrationTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [credentials, setCredentials] = useState<{
    secretKey: string | null;
    accessKey: string | null;
    status: 'checking' | 'valid' | 'invalid';
  }>({
    secretKey: null,
    accessKey: null,
    status: 'checking'
  });

  const updateResult = (step: string, status: TestResult['status'], message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { step, status, message, data }];
      }
    });
  };

  const checkCredentials = async () => {
    setCredentials(prev => ({ ...prev, status: 'checking' }));
    
    try {
      const { data: secretKey, error: secretError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_SECRET_KEY'
      });

      const { data: accessKey, error: accessError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_ACCESS_KEY'
      });

      if (secretError || accessError || !secretKey || !accessKey) {
        setCredentials({
          secretKey: null,
          accessKey: null,
          status: 'invalid'
        });
        return false;
      }

      setCredentials({
        secretKey: secretKey.substring(0, 8) + '...',
        accessKey: accessKey.substring(0, 8) + '...',
        status: 'valid'
      });
      return true;
    } catch (error) {
      console.error('Credential check failed:', error);
      setCredentials(prev => ({ ...prev, status: 'invalid' }));
      return false;
    }
  };

  const testMeritoSync = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Step 1: Check credentials
      updateResult('credentials', 'pending', 'Checking Merito credentials...');
      const hasCredentials = await checkCredentials();
      
      if (!hasCredentials) {
        updateResult('credentials', 'error', 'Merito credentials not found in Supabase secrets');
        toast.error('Merito credentials not configured');
        return;
      }
      updateResult('credentials', 'success', 'Merito credentials found');

      // Step 2: Check if service is enabled
      updateResult('enabled', 'pending', 'Checking if Merito service is enabled...');
      const isEnabled = await MeritoService.isEnabled();
      
      if (!isEnabled) {
        updateResult('enabled', 'error', 'Merito service is not enabled');
        return;
      }
      updateResult('enabled', 'success', 'Merito service is enabled');

      // Step 3: Get test user data
      updateResult('user_data', 'pending', 'Fetching test user data...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        updateResult('user_data', 'error', 'No authenticated user found');
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        updateResult('user_data', 'error', 'User profile not found');
        return;
      }

      // Get user application
      const { data: application, error: appError } = await supabase
        .from('student_applications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appError || !application) {
        updateResult('user_data', 'error', 'User application not found');
        return;
      }

      updateResult('user_data', 'success', `Found user: ${profile.email}`);

      // Step 4: Test basic registration sync
      updateResult('basic_sync', 'pending', 'Testing basic registration sync...');
      try {
        await MeritoService.syncApplication(application);
        updateResult('basic_sync', 'success', 'Basic registration synced successfully');
      } catch (error) {
        updateResult('basic_sync', 'error', `Basic sync failed: ${error.message}`);
        throw error;
      }

      // Step 5: Test extended registration sync (if extended profile exists)
      updateResult('extended_sync', 'pending', 'Checking for extended profile...');
      const { data: extendedProfile } = await supabase
        .from('profile_extended')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (extendedProfile) {
        updateResult('extended_sync', 'pending', 'Testing extended registration sync...');
        try {
          await MeritoService.syncExtendedRegistration(profile.id, application, extendedProfile);
          updateResult('extended_sync', 'success', 'Extended registration synced successfully');
        } catch (error) {
          updateResult('extended_sync', 'error', `Extended sync failed: ${error.message}`);
        }
      } else {
        updateResult('extended_sync', 'success', 'No extended profile found (this is normal)');
      }

      toast.success('Merito sync test completed!');

    } catch (error) {
      console.error('Test failed:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500">Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  React.useEffect(() => {
    checkCredentials();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Merito Extended Registration Test</CardTitle>
          <CardDescription>
            Test the Merito CRM integration for registration and extended profile sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credentials Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Merito Credentials</h4>
              <p className="text-sm text-gray-500">
                Secret Key: {credentials.secretKey || 'Not found'} | 
                Access Key: {credentials.accessKey || 'Not found'}
              </p>
            </div>
            {getStatusBadge(credentials.status)}
          </div>

          {credentials.status === 'invalid' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Merito credentials not found. Please add MERITO_SECRET_KEY and MERITO_ACCESS_KEY to your Supabase secrets.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={testMeritoSync} 
            disabled={testing || credentials.status !== 'valid'}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Merito Sync...
              </>
            ) : (
              'Test Merito Sync'
            )}
          </Button>

          {/* Test Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results</h4>
              {results.map((result, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium capitalize">{result.step.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-500">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}