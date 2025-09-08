import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, Phone, TestTube } from 'lucide-react';
import { SEO, PageSEO } from '@/components/common';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';

// Import step components (we'll create these)
import ApplicationStep from './application-steps/ApplicationStep';
import InterviewStep from './application-steps/InterviewStep';
import LitmusTestStep from './application-steps/LitmusTestStep';
import DynamicApplicationForm from '@/components/experiences/DynamicApplicationForm';

export interface ApplicationData {
  // Step 1: Registration
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  education?: {
    qualification: string;
    institution: string;
    yearOfPassing: string;
    percentage: string;
  };
  experience?: {
    hasExperience: boolean;
    yearsOfExperience?: string;
    currentCompany?: string;
    currentRole?: string;
    previousExperience?: string;
  };
  motivation?: {
    whyJoin: string;
    careerGoals: string;
    expectations: string;
  };

  // Step 2: Application Form (Dynamic form created by admin)
  applicationForm?: {
    answers: Record<string, any>;
    submittedAt?: string;
  };

  // Step 3: Interview
  interview?: {
    preferredDate: string;
    preferredTime: string;
    timezone: string;
    additionalNotes?: string;
  };

  // Step 4: LITMUS Test
  litmusTest?: {
    completed: boolean;
    score?: number;
    answers?: Record<string, any>;
  };
}

const ApplicationProcess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileId, setProfileId] = useState<string>('');
  const [cohortName, setCohortName] = useState<string>('');
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [cohortId, setCohortId] = useState<string>('');
  const [studentApplicationId, setStudentApplicationId] = useState<string>('');

  const steps = [
    {
      id: 1,
      title: 'Registration',
      description: cohortName
        ? `Complete your registration for ${cohortName}`
        : 'Complete your registration',
      icon: FileText,
      status: 'pending' as const,
    },
    {
      id: 2,
      title: 'Application Form',
      description: 'Fill out the application form',
      icon: FileText,
      status: 'pending' as const,
    },
    {
      id: 3,
      title: 'Interview Call',
      description: 'Schedule your interview',
      icon: Phone,
      status: 'pending' as const,
    },
    {
      id: 4,
      title: 'LITMUS Test',
      description: 'Take the assessment test',
      icon: TestTube,
      status: 'pending' as const,
    },
  ];

  useEffect(() => {
    loadApplicationData();
  }, []);

  const loadCohortName = async (cohortId: string) => {
    try {
      const { data: cohort, error } = await supabase
        .from('cohorts')
        .select('name')
        .eq('id', cohortId)
        .single();

      if (error) {
        console.error('Error loading cohort name:', error);
        return;
      }

      if (cohort) {
        setCohortName(cohort.name);
        console.log('Cohort name loaded directly:', cohort.name);
      }
    } catch (error) {
      console.error('Error in loadCohortName:', error);
    }
  };

  const loadExistingFormAnswers = async (applicationId: string) => {
    try {
      const answers =
        await ApplicationConfigurationService.getFormAnswers(applicationId);
      if (Object.keys(answers).length > 0) {
        setApplicationData(prev => ({
          ...prev,
          applicationForm: {
            answers,
          },
        }));
      }
    } catch (error) {
      console.error('Error loading existing form answers:', error);
    }
  };

  const loadApplicationData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth/login');
        return;
      }
      setUser(user);

      // First, get the profile ID for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        Logger.getInstance().error('Failed to load profile', {
          error: profileError,
        });
        toast.error('Failed to load profile data');
        return;
      }

      setProfileId(profile.id);

      // Load existing application data
      const { data: application, error } = await supabase
        .from('student_applications')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.getInstance().error('Failed to load application data', {
          error,
        });
        toast.error('Failed to load application data');
        return;
      }

      if (application) {
        console.log('Application data:', application);
        setApplicationData(application.application_data || {});
        setApplicationStatus(application.status);
        setCohortId(application.cohort_id);
        setStudentApplicationId(application.id);
        // Load cohort name for display
        if (application.cohort_id) {
          console.log(
            'Loading cohort name for cohort_id:',
            application.cohort_id
          );
          loadCohortName(application.cohort_id);
        } else {
          console.log('No cohort_id found in application');
        }
        // Determine current step based on completed data and application status
        determineCurrentStep(
          application.application_data || {},
          application.status
        );

        // Load existing form answers if available
        if (application.id) {
          loadExistingFormAnswers(application.id);
        }
      }
    } catch (error) {
      Logger.getInstance().error('Error loading application data', { error });
      toast.error('An error occurred while loading your application');
    } finally {
      setLoading(false);
    }
  };

  const determineCurrentStep = (data: ApplicationData, status?: string) => {
    // If status is registration_paid, user should be on step 2 (Application Form)
    if (status === 'registration_paid') {
      setCurrentStep(2);
      return;
    }

    // Check if we have application data to determine current step
    if (
      data.personalInfo &&
      data.education &&
      data.experience &&
      data.motivation
    ) {
      // Registration form completed, check if application form is filled
      if (data.applicationForm) {
        // Application form completed, check interview
        if (data.interview) {
          // Interview scheduled, check LITMUS test
          if (data.litmusTest?.completed) {
            setCurrentStep(4);
          } else {
            setCurrentStep(4);
          }
        } else {
          setCurrentStep(3);
        }
      } else {
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(1);
    }
  };

  const updateApplicationData = async (stepData: Partial<ApplicationData>) => {
    setSaving(true);
    try {
      if (!profileId) return;

      const updatedData = { ...applicationData, ...stepData };
      setApplicationData(updatedData);

      // Save to database
      const { error } = await supabase
        .from('student_applications')
        .update({
          application_data: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId);

      if (error) {
        Logger.getInstance().error('Failed to save application data', {
          error,
        });
        toast.error('Failed to save application data');
        return;
      }

      toast.success('Application data saved successfully');
    } catch (error) {
      Logger.getInstance().error('Error saving application data', { error });
      toast.error('An error occurred while saving your application');
    } finally {
      setSaving(false);
    }
  };

  const handleStepComplete = (stepData: Partial<ApplicationData>) => {
    updateApplicationData(stepData);

    // Move to next step
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepStatus = (stepId: number) => {
    // If status is registration_paid or beyond, step 1 (Registration) is completed
    if (
      stepId === 1 &&
      (applicationStatus === 'registration_paid' ||
        applicationStatus === 'application_initiated' ||
        applicationStatus === 'application_accepted' ||
        applicationStatus === 'application_rejected' ||
        applicationStatus === 'application_on_hold' ||
        applicationStatus === 'interview_scheduled' ||
        applicationStatus === 'interview_selected' ||
        applicationStatus === 'interview_rejected' ||
        applicationStatus === 'enrolled')
    ) {
      return 'completed';
    }

    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const getProgressPercentage = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ApplicationStep
            data={applicationData}
            profileId={profileId}
            onComplete={handleStepComplete}
            onSave={updateApplicationData}
            saving={saving}
            onPaymentInitiated={() => setSaving(true)}
            onPaymentCompleted={() => setSaving(false)}
          />
        );
      case 2:
        return cohortId ? (
          <DynamicApplicationForm
            cohortId={cohortId}
            onComplete={async answers => {
              try {
                // Save answers to database
                if (studentApplicationId) {
                  const success =
                    await ApplicationConfigurationService.saveFormAnswers(
                      studentApplicationId,
                      answers
                    );
                  if (!success) {
                    toast.error('Failed to save form answers');
                    return;
                  }
                }

                const updatedData = {
                  ...applicationData,
                  applicationForm: {
                    answers,
                    submittedAt: new Date().toISOString(),
                  },
                };
                handleStepComplete(updatedData);
              } catch (error) {
                console.error('Error saving form answers:', error);
                toast.error('Failed to save form answers');
              }
            }}
            onSave={async answers => {
              try {
                // Save answers to database
                if (studentApplicationId) {
                  const success =
                    await ApplicationConfigurationService.saveFormAnswers(
                      studentApplicationId,
                      answers
                    );
                  if (!success) {
                    toast.error('Failed to save form answers');
                    return;
                  }
                }

                const updatedData = {
                  ...applicationData,
                  applicationForm: {
                    answers,
                  },
                };
                updateApplicationData(updatedData);
              } catch (error) {
                console.error('Error saving form answers:', error);
                toast.error('Failed to save form answers');
              }
            }}
            initialAnswers={applicationData.applicationForm?.answers || {}}
            saving={saving}
          />
        ) : (
          <div className='p-8 text-center min-h-[400px] flex flex-col justify-center bg-card'>
            <h3 className='text-xl font-semibold mb-4'>Application Form</h3>
            <p className='text-muted-foreground mb-6'>
              Loading application form configuration...
            </p>
          </div>
        );
      case 3:
        return (
          <InterviewStep
            data={applicationData}
            onComplete={handleStepComplete}
            onSave={updateApplicationData}
            saving={saving}
          />
        );
      case 4:
        return (
          <LitmusTestStep
            data={applicationData}
            onComplete={handleStepComplete}
            onSave={updateApplicationData}
            saving={saving}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO {...PageSEO.applicationProcess} />
      <div className='bg-background min-h-screen'>
        {/* Header - Fixed */}
        <div className='fixed top-0 left-0 right-0 z-30 border-b bg-card shadow-sm backdrop-blur-sm'>
          <div className='container mx-auto px-4 py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-foreground'>
                  {cohortName
                    ? `Application Process - ${cohortName}`
                    : 'Application Process'}
                </h1>
                <p className='text-muted-foreground mt-1'>
                  Complete your application in {steps.length} simple steps
                </p>
              </div>
              <div className='text-right'>
                <div className='text-sm text-muted-foreground'>Progress</div>
                <div className='text-lg font-semibold'>
                  Step {currentStep} of {steps.length}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className='mt-4'>
              <Progress value={getProgressPercentage()} className='h-2' />
            </div>
          </div>
        </div>

        <div className='container mx-auto px-4 py-8 pb-16 pt-36'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Steps Sidebar - Sticky */}
            <div className='lg:col-span-1'>
              <div
                className='sticky top-8 z-20 max-h-[calc(100vh-120px)] overflow-y-auto'
                style={{
                  position: 'sticky',
                  top: '2rem',
                  zIndex: 20,
                }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>Application Steps</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {steps.map(step => {
                      const status = getStepStatus(step.id);
                      const Icon = step.icon;

                      return (
                        <div
                          key={step.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                            status === 'current'
                              ? 'bg-primary/10 border border-primary/20'
                              : status === 'completed'
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-muted/50'
                          }`}
                        >
                          <div className='flex-shrink-0 mt-0.5'>
                            {status === 'completed' ? (
                              <CheckCircle className='h-5 w-5 text-green-600' />
                            ) : status === 'current' ? (
                              <Clock className='h-5 w-5 text-primary' />
                            ) : (
                              <Icon className='h-5 w-5 text-muted-foreground' />
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center space-x-2'>
                              <p
                                className={`text-sm font-medium ${
                                  status === 'current'
                                    ? 'text-primary'
                                    : status === 'completed'
                                      ? 'text-green-800'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {step.title}
                              </p>
                            </div>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className='lg:col-span-3'>
              <Card className='min-h-[600px]'>
                <CardHeader className='sticky top-8 z-20 bg-card border-b shadow-sm backdrop-blur-sm'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <CardTitle className='text-xl'>
                        {steps[currentStep - 1].title}
                      </CardTitle>
                      <p className='text-muted-foreground mt-1'>
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                    {currentStep > 1 && (
                      <Button
                        variant='outline'
                        onClick={handlePreviousStep}
                        disabled={saving}
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='bg-card'>
                  {renderCurrentStep()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplicationProcess;
