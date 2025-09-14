import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, TestTube } from 'lucide-react';

interface TestFormData {
  formName: string;
  fullName: string;
  email: string;
  phone: string;
  age?: number;
  professionalStatus: string;
  location?: string;
  careerGoals?: string;
  courseOfInterest?: string;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
}

export default function WebflowWebhookTestComponent() {
  const [testData, setTestData] = useState<TestFormData>({
    formName: 'Contact Form',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    age: 25,
    professionalStatus: 'student',
    location: 'New York',
    careerGoals: 'Become a software engineer',
    courseOfInterest: 'Full Stack Development',
    utmSource: 'google',
    utmCampaign: 'test-campaign',
    utmMedium: 'cpc',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    field: keyof TestFormData,
    value: string | number
  ) => {
    setTestData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateWebhookPayload = (): Record<string, unknown> => {
    const formId =
      testData.formName === 'Contact Form'
        ? 'contact-form-123'
        : testData.formName === 'Program files-Brochure'
          ? 'program-brochure-456'
          : 'email-form-789';

    const basePayload = {
      name: 'Form Submission',
      site: 'your-site-id',
      data: {
        id: `submission-${Date.now()}`,
        formId: formId,
        siteId: 'your-site-id',
        formResponse: {},
        dateSubmitted: new Date().toISOString(),
      },
      createdOn: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Map form data based on form type
    if (testData.formName === 'Program files-Brochure') {
      basePayload.data.formResponse = {
        'First Name': testData.fullName,
        Email: testData.email,
        Phone: testData.phone,
        Age: testData.age?.toString() || '',
        'You are currently a': testData.professionalStatus,
      };
    } else if (testData.formName === 'Email Form') {
      basePayload.data.formResponse = {
        Email: testData.email,
        utm_source: testData.utmSource,
        utm_campaign: testData.utmCampaign,
        utm_medium: testData.utmMedium,
      };
    } else {
      // Contact Form
      basePayload.data.formResponse = {
        name: testData.fullName,
        email: testData.email,
        phone: testData.phone,
        age: testData.age?.toString() || '',
        'i-am-a': testData.professionalStatus,
        location: testData.location,
        'Career-Goals': testData.careerGoals,
        'Course of Interest': testData.courseOfInterest,
        utm_source: testData.utmSource,
        utm_campaign: testData.utmCampaign,
        utm_medium: testData.utmMedium,
      };
    }

    return basePayload;
  };

  const testWebhook = async () => {
    setIsLoading(true);

    try {
      const payload = generateWebhookPayload();

      console.log('Testing webhook with payload:', payload);

      const response = await fetch(
        'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-enquiry-webhook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(
          'Webhook test successful! Check the enquiries page to see the new enquiry.'
        );
        console.log('Webhook response:', result);
      } else {
        toast.error(`Webhook test failed: ${result.error || 'Unknown error'}`);
        console.error('Webhook error:', result);
      }
    } catch (error) {
      toast.error(`Webhook test failed: ${error.message}`);
      console.error('Webhook test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TestTube className='h-5 w-5' />
          Webflow Webhook Test
        </CardTitle>
        <CardDescription>
          Test the webhook functionality by sending sample form submissions
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='formName'>Form Type</Label>
            <Select
              value={testData.formName}
              onValueChange={value => handleInputChange('formName', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Contact Form'>Contact Form</SelectItem>
                <SelectItem value='Program files-Brochure'>
                  Program files-Brochure
                </SelectItem>
                <SelectItem value='Email Form'>Email Form</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='fullName'>Full Name</Label>
            <Input
              id='fullName'
              value={testData.fullName}
              onChange={e => handleInputChange('fullName', e.target.value)}
              placeholder='Enter full name'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={testData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              placeholder='Enter email'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              value={testData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              placeholder='Enter phone number'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='age'>Age</Label>
            <Input
              id='age'
              type='number'
              value={testData.age || ''}
              onChange={e =>
                handleInputChange('age', parseInt(e.target.value) || 0)
              }
              placeholder='Enter age'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='professionalStatus'>Professional Status</Label>
            <Select
              value={testData.professionalStatus}
              onValueChange={value =>
                handleInputChange('professionalStatus', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='student'>Student</SelectItem>
                <SelectItem value='A Working Professional'>
                  Working Professional
                </SelectItem>
                <SelectItem value='In Between Jobs'>In Between Jobs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Input
              id='location'
              value={testData.location || ''}
              onChange={e => handleInputChange('location', e.target.value)}
              placeholder='Enter location'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='careerGoals'>Career Goals</Label>
            <Input
              id='careerGoals'
              value={testData.careerGoals || ''}
              onChange={e => handleInputChange('careerGoals', e.target.value)}
              placeholder='Enter career goals'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='courseOfInterest'>Course of Interest</Label>
            <Input
              id='courseOfInterest'
              value={testData.courseOfInterest || ''}
              onChange={e =>
                handleInputChange('courseOfInterest', e.target.value)
              }
              placeholder='Enter course of interest'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='utmSource'>UTM Source</Label>
            <Input
              id='utmSource'
              value={testData.utmSource || ''}
              onChange={e => handleInputChange('utmSource', e.target.value)}
              placeholder='Enter UTM source'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='utmCampaign'>UTM Campaign</Label>
            <Input
              id='utmCampaign'
              value={testData.utmCampaign || ''}
              onChange={e => handleInputChange('utmCampaign', e.target.value)}
              placeholder='Enter UTM campaign'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='utmMedium'>UTM Medium</Label>
            <Input
              id='utmMedium'
              value={testData.utmMedium || ''}
              onChange={e => handleInputChange('utmMedium', e.target.value)}
              placeholder='Enter UTM medium'
            />
          </div>
        </div>

        <div className='pt-4'>
          <Button onClick={testWebhook} disabled={isLoading} className='w-full'>
            <Send className='h-4 w-4 mr-2' />
            {isLoading ? 'Testing Webhook...' : 'Test Webhook'}
          </Button>
        </div>

        <div className='text-sm text-muted-foreground'>
          <p>
            <strong>Webhook URL:</strong>{' '}
            https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-enquiry-webhook
          </p>
          <p>
            <strong>Note:</strong> This will create a real enquiry in your
            database. Check the enquiries page after testing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
