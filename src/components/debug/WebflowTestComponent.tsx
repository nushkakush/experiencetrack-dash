import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { EnquiriesService } from '@/services/enquiries.service';
import { supabase } from '@/integrations/supabase/client';
import {
  Cloud,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface WebflowForm {
  id: string;
  displayName: string;
  siteId: string;
  createdOn: string;
  lastUpdated: string;
}

interface WebflowFormSubmission {
  id: string;
  form: string;
  site: string;
  data: {
    name: string;
    email: string;
    [key: string]: string | number | boolean | undefined;
  };
  submittedAt: string;
}

export default function WebflowTestComponent() {
  const [forms, setForms] = useState<WebflowForm[]>([]);
  const [submissions, setSubmissions] = useState<WebflowFormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configStatus, setConfigStatus] = useState<
    'checking' | 'valid' | 'invalid'
  >('checking');

  const checkConfiguration = async () => {
    try {
      // Test if we can access the secrets from Supabase
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'get_secret',
        { secret_key: 'webflow_api_token' }
      );

      const { data: siteIdData, error: siteIdError } = await supabase.rpc(
        'get_secret',
        { secret_key: 'webflow_site_id' }
      );

      if (tokenError || siteIdError || !tokenData || !siteIdData) {
        setConfigStatus('invalid');
        return false;
      }

      setConfigStatus('valid');
      return true;
    } catch (error) {
      console.error('Configuration check failed:', error);
      setConfigStatus('invalid');
      return false;
    }
  };

  const testWebflowConnection = async () => {
    if (!(await checkConfiguration())) {
      toast.error(
        'Webflow API configuration is missing. Please check your Supabase secrets.'
      );
      return;
    }

    try {
      setLoading(true);
      const formsData = await EnquiriesService.getWebflowForms();
      setForms(formsData);
      toast.success(
        `Successfully connected to Webflow! Found ${formsData.length} forms.`
      );
    } catch (error) {
      console.error('Webflow connection test failed:', error);
      toast.error(
        'Failed to connect to Webflow. Please check your API token and site ID.'
      );
    } finally {
      setLoading(false);
    }
  };

  const testFormSubmissions = async (formId: string) => {
    try {
      setLoading(true);
      const submissionsData = await EnquiriesService.getWebflowFormSubmissions(
        formId,
        10
      );
      setSubmissions(submissionsData);
      toast.success(`Found ${submissionsData.length} form submissions.`);
    } catch (error) {
      console.error('Failed to fetch form submissions:', error);
      toast.error('Failed to fetch form submissions.');
    } finally {
      setLoading(false);
    }
  };

  const testSync = async () => {
    if (!(await checkConfiguration())) {
      toast.error('Webflow API configuration is missing.');
      return;
    }

    try {
      setTesting(true);
      const result = await EnquiriesService.syncFromWebflow();

      if (result.synced > 0) {
        toast.success(`Successfully synced ${result.synced} new enquiries!`);
      } else {
        toast.info('No new enquiries to sync.');
      }

      if (result.errors > 0) {
        toast.warning(`${result.errors} submissions had errors.`);
      }
    } catch (error) {
      console.error('Sync test failed:', error);
      toast.error('Sync test failed. Check console for details.');
    } finally {
      setTesting(false);
    }
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  const getConfigStatusIcon = () => {
    switch (configStatus) {
      case 'checking':
        return <RefreshCw className='h-4 w-4 animate-spin' />;
      case 'valid':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'invalid':
        return <XCircle className='h-4 w-4 text-red-500' />;
    }
  };

  const getConfigStatusText = () => {
    switch (configStatus) {
      case 'checking':
        return 'Checking configuration...';
      case 'valid':
        return 'Configuration valid';
      case 'invalid':
        return 'Configuration invalid - missing environment variables';
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Cloud className='h-5 w-5' />
            Webflow API Test
          </CardTitle>
          <CardDescription>
            Test your Webflow API integration and form submission sync
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Configuration Status */}
          <div className='flex items-center gap-2 p-3 bg-muted rounded-lg'>
            {getConfigStatusIcon()}
            <span className='text-sm font-medium'>{getConfigStatusText()}</span>
          </div>

          {/* Test Buttons */}
          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={testWebflowConnection}
              disabled={loading || configStatus === 'invalid'}
              variant='outline'
            >
              {loading ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Cloud className='h-4 w-4 mr-2' />
                  Test Connection
                </>
              )}
            </Button>

            <Button
              onClick={testSync}
              disabled={testing || configStatus === 'invalid'}
              variant='outline'
            >
              {testing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Testing Sync...
                </>
              ) : (
                <>
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Test Sync
                </>
              )}
            </Button>
          </div>

          {/* Forms List */}
          {forms.length > 0 && (
            <div className='space-y-2'>
              <h4 className='font-medium'>Available Forms ({forms.length})</h4>
              <div className='space-y-2'>
                {forms.map(form => (
                  <div
                    key={form.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div>
                      <div className='font-medium'>{form.displayName}</div>
                      <div className='text-sm text-muted-foreground'>
                        ID: {form.id}
                      </div>
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => testFormSubmissions(form.id)}
                      disabled={loading}
                    >
                      Test Submissions
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions List */}
          {submissions.length > 0 && (
            <div className='space-y-2'>
              <h4 className='font-medium'>
                Recent Submissions ({submissions.length})
              </h4>
              <div className='space-y-2 max-h-60 overflow-y-auto'>
                {submissions.map(submission => (
                  <div key={submission.id} className='p-3 border rounded-lg'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='font-medium'>
                        {submission.data.name ||
                          submission.data['First-Name'] ||
                          'Unknown Name'}
                      </div>
                      <Badge variant='outline'>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Email:{' '}
                      {submission.data.email || submission.data.Email || 'N/A'}
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Form ID: {submission.form}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Help */}
          {configStatus === 'invalid' && (
            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='h-5 w-5 text-yellow-600 mt-0.5' />
                <div>
                  <h4 className='font-medium text-yellow-800'>
                    Configuration Required
                  </h4>
                  <p className='text-sm text-yellow-700 mt-1'>
                    Webflow API credentials are stored in Supabase secrets. The
                    following secrets should be configured:
                  </p>
                  <div className='mt-2 space-y-1'>
                    <div className='text-xs font-mono bg-yellow-100 p-2 rounded'>
                      webflow_api_token:
                      bb820986c89e77774d958937b69a0288d8a1ce5ba7321f3e81ae21d8f1fc57b5
                    </div>
                    <div className='text-xs font-mono bg-yellow-100 p-2 rounded'>
                      webflow_site_id: 6888a19a605a393e917b7dc5
                    </div>
                  </div>
                  <p className='text-xs text-yellow-600 mt-2'>
                    These secrets have been automatically configured in your
                    Supabase database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
