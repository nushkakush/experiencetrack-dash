import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MeritoService } from '@/services/merito.service';
import { MeritoLeadData } from '@/types/merito';

export const MeritoTestComponent: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  const [testData, setTestData] = useState<MeritoLeadData>({
    email: 'test@example.com',
    mobile: 9876543210,
    search_criteria: 'email',
    name: 'Test User',
    lead_stage: 'enquiry',
    course_of_interest: 'MBA',
    professional_status: 'Manager',
  });

  const handleTestEnquiry = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const mockEnquiry = {
        email: testData.email,
        phone: testData.mobile?.toString(),
        full_name: testData.name,
        course_of_interest: testData.course_of_interest,
        professional_status: testData.professional_status,
        utm_source: 'test',
        utm_campaign: 'merito_test',
      };

      await MeritoService.syncEnquiry(mockEnquiry);
      
      setResult('✅ Enquiry synced successfully to Merito CRM!');
      toast({
        title: 'Success',
        description: 'Enquiry synced to Merito CRM',
        variant: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Failed to sync enquiry: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestApplication = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const mockApplication = {
        profile: {
          email: testData.email,
          phone: testData.mobile?.toString(),
          first_name: testData.name?.split(' ')[0] || 'Test',
          last_name: testData.name?.split(' ')[1] || 'User',
        },
        status: 'application_initiated',
        cohort_id: 'test-cohort-123',
        registration_source: 'direct',
      };

      await MeritoService.syncApplication(mockApplication);
      
      setResult('✅ Application synced successfully to Merito CRM!');
      toast({
        title: 'Success',
        description: 'Application synced to Merito CRM',
        variant: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Failed to sync application: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDirect = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      await MeritoService.createOrUpdateLeadWithRetry(testData);
      
      setResult('✅ Lead created/updated successfully in Merito CRM!');
      toast({
        title: 'Success',
        description: 'Lead synced to Merito CRM',
        variant: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMessage}`);
      toast({
        title: 'Error',
        description: `Failed to sync lead: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = () => {
    const isEnabled = MeritoService.isEnabled();
    setResult(`Merito Integration Status: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Merito CRM Integration Test</CardTitle>
          <CardDescription>
            Test the Merito CRM integration with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={testData.email}
                onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="number"
                value={testData.mobile || ''}
                onChange={(e) => setTestData({ ...testData, mobile: parseInt(e.target.value) || undefined })}
                placeholder="9876543210"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={testData.name || ''}
              onChange={(e) => setTestData({ ...testData, name: e.target.value })}
              placeholder="Test User"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="course">Course of Interest</Label>
              <Input
                id="course"
                value={testData.course_of_interest || ''}
                onChange={(e) => setTestData({ ...testData, course_of_interest: e.target.value })}
                placeholder="MBA"
              />
            </div>
            <div>
              <Label htmlFor="status">Professional Status</Label>
              <Input
                id="status"
                value={testData.professional_status || ''}
                onChange={(e) => setTestData({ ...testData, professional_status: e.target.value })}
                placeholder="Manager"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleTestEnquiry} 
              disabled={isLoading}
              variant="default"
            >
              Test Enquiry Sync
            </Button>
            <Button 
              onClick={handleTestApplication} 
              disabled={isLoading}
              variant="default"
            >
              Test Application Sync
            </Button>
            <Button 
              onClick={handleTestDirect} 
              disabled={isLoading}
              variant="outline"
            >
              Test Direct Lead
            </Button>
            <Button 
              onClick={handleCheckStatus} 
              disabled={isLoading}
              variant="secondary"
            >
              Check Status
            </Button>
          </div>

          {result && (
            <div className="mt-4">
              <Label>Result</Label>
              <Textarea
                value={result}
                readOnly
                className="mt-2 min-h-[100px]"
                placeholder="Test results will appear here..."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
