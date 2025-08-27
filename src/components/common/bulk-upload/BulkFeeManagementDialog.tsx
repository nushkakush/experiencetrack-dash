import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, CreditCard, Upload, Settings, Download } from 'lucide-react';
import BulkScholarshipUploadDialog from './BulkScholarshipUploadDialog';
import BulkPaymentPlanUploadDialog from './BulkPaymentPlanUploadDialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkFeeManagementDialogProps {
  cohortId: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export default function BulkFeeManagementDialog({
  cohortId,
  onSuccess,
  children,
  disabled = false,
}: BulkFeeManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [availableScholarships, setAvailableScholarships] = useState<string[]>(
    []
  );
  const [availablePaymentPlans, setAvailablePaymentPlans] = useState<string[]>(
    []
  );

  const handleSuccess = () => {
    onSuccess?.();
    // Keep dialog open for multiple operations
  };

  const fetchAvailableScholarships = useCallback(async () => {
    try {
      const { data: scholarships, error } = await supabase
        .from('cohort_scholarships')
        .select('name')
        .eq('cohort_id', cohortId)
        .order('name');

      if (error) throw error;
      setAvailableScholarships(scholarships?.map(s => s.name) || []);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      toast.error('Failed to fetch available scholarships');
    }
  }, [cohortId]);

  const fetchAvailablePaymentPlans = useCallback(async () => {
    try {
      // Standard payment plan options
      const paymentPlans = [
        'one_shot',
        'sem_wise',
        'instalment_wise',
        'not_selected',
      ];
      setAvailablePaymentPlans(paymentPlans);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to fetch available payment plans');
    }
  }, []);

  const downloadScholarshipTemplate = async () => {
    try {
      // Fetch students for this cohort
      const { data: students, error } = await supabase
        .from('cohort_students')
        .select('email, first_name, last_name')
        .eq('cohort_id', cohortId)
        .order('first_name');

      if (error) throw error;

      // Create CSV content with student emails pre-filled
      const headers =
        'student_email,scholarship_name,additional_discount_percentage';
      const rows =
        students?.map(student => `${student.email},,0`).join('\n') || '';

      const csvContent = `${headers}\n${rows}`;

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scholarship_template_${cohortId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Scholarship template downloaded successfully');
    } catch (error) {
      console.error('Error downloading scholarship template:', error);
      toast.error('Failed to download template');
    }
  };

  const downloadPaymentPlanTemplate = async () => {
    try {
      // Fetch students for this cohort
      const { data: students, error } = await supabase
        .from('cohort_students')
        .select('email, first_name, last_name')
        .eq('cohort_id', cohortId)
        .order('first_name');

      if (error) throw error;

      // Create CSV content with student emails pre-filled
      const headers = 'student_email,payment_plan';
      const rows =
        students?.map(student => `${student.email},`).join('\n') || '';

      const csvContent = `${headers}\n${rows}`;

      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_plan_template_${cohortId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Payment plan template downloaded successfully');
    } catch (error) {
      console.error('Error downloading payment plan template:', error);
      toast.error('Failed to download template');
    }
  };

  const defaultTrigger = (
    <Button variant='outline' className='gap-2'>
      <Settings className='w-4 h-4' />
      Bulk Fee Management
    </Button>
  );

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && !disabled) {
      fetchAvailableScholarships();
      fetchAvailablePaymentPlans();
    }
  }, [
    open,
    disabled,
    cohortId,
    fetchAvailableScholarships,
    fetchAvailablePaymentPlans,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className='max-w-4xl bg-background border-border'>
        <DialogHeader>
          <DialogTitle>Bulk Fee Management</DialogTitle>
          <DialogDescription>
            {disabled
              ? 'No students found in this cohort. Add students first to manage their fees.'
              : 'Upload CSV files to manage scholarships and payment plans for multiple students at once.'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {disabled ? (
            <div className='text-center py-8'>
              <div className='mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-muted'>
                <Settings className='w-6 h-6 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-medium mb-2'>
                No Students Available
              </h3>
              <p className='text-sm text-muted-foreground mb-4'>
                This cohort doesn't have any students yet. Add students to the
                cohort first, then you can manage their scholarships and payment
                plans.
              </p>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              {/* Upload Tabs */}
              <Tabs defaultValue='scholarships' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='scholarships' className='gap-2'>
                    <Award className='w-4 h-4' />
                    Scholarships
                  </TabsTrigger>
                  <TabsTrigger value='payment-plans' className='gap-2'>
                    <CreditCard className='w-4 h-4' />
                    Payment Plans
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='scholarships' className='space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Award className='w-5 h-5' />
                        Bulk Scholarship Assignment
                      </CardTitle>
                      <CardDescription>
                        Assign scholarships to multiple students using a CSV
                        file. The file should contain student emails and
                        scholarship names.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex gap-2'>
                        <BulkScholarshipUploadDialog
                          cohortId={cohortId}
                          onSuccess={handleSuccess}
                        >
                          <Button className='gap-2'>
                            <Upload className='w-4 h-4' />
                            Upload Scholarship CSV
                          </Button>
                        </BulkScholarshipUploadDialog>
                        <Button
                          variant='outline'
                          className='gap-2'
                          onClick={() => downloadScholarshipTemplate()}
                        >
                          <Download className='w-4 h-4' />
                          Download Template
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className='mt-6 p-4 bg-muted rounded-lg'>
                        <h4 className='font-medium mb-2'>
                          Scholarship Upload Instructions:
                        </h4>
                        <ul className='text-sm space-y-1'>
                          <li>
                            <strong>Required columns:</strong> student_email,
                            scholarship_name
                          </li>
                          <li>
                            <strong>Optional columns:</strong>{' '}
                            additional_discount_percentage
                          </li>
                          <li>
                            <strong>Need based scholarship</strong> must be
                            between 0-100 percentage
                          </li>
                        </ul>

                        {availableScholarships.length > 0 && (
                          <div className='mt-4'>
                            <h5 className='font-medium mb-2'>
                              Available Scholarships:
                            </h5>
                            <div className='flex flex-wrap gap-2'>
                              {availableScholarships.map(
                                (scholarship, index) => (
                                  <Button
                                    key={index}
                                    variant='outline'
                                    size='sm'
                                    className='text-xs'
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        scholarship
                                      );
                                      toast.success(`Copied: ${scholarship}`);
                                    }}
                                  >
                                    {scholarship}
                                  </Button>
                                )
                              )}
                            </div>
                            <p className='text-xs text-muted-foreground mt-2'>
                              Click any scholarship name to copy it to clipboard
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='payment-plans' className='space-y-4'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <CreditCard className='w-5 h-5' />
                        Bulk Payment Plan Assignment
                      </CardTitle>
                      <CardDescription>
                        Assign payment plans to multiple students using a CSV
                        file.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='flex gap-2'>
                        <BulkPaymentPlanUploadDialog
                          cohortId={cohortId}
                          onSuccess={handleSuccess}
                          enableCustomDates={false}
                        >
                          <Button className='gap-2'>
                            <Upload className='w-4 h-4' />
                            Upload Payment Plan CSV
                          </Button>
                        </BulkPaymentPlanUploadDialog>
                        <Button
                          variant='outline'
                          className='gap-2'
                          onClick={() => downloadPaymentPlanTemplate()}
                        >
                          <Download className='w-4 h-4' />
                          Download Template
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className='mt-6 p-4 bg-muted rounded-lg'>
                        <h4 className='font-medium mb-2'>
                          Payment Plan Upload Instructions:
                        </h4>
                        <ul className='text-sm space-y-1'>
                          <li>
                            <strong>Required columns:</strong> student_email,
                            payment_plan
                          </li>
                        </ul>

                        {availablePaymentPlans.length > 0 && (
                          <div className='mt-4'>
                            <h5 className='font-medium mb-2'>
                              Available Payment Plans:
                            </h5>
                            <div className='flex flex-wrap gap-2'>
                              {availablePaymentPlans.map((plan, index) => (
                                <Button
                                  key={index}
                                  variant='outline'
                                  size='sm'
                                  className='text-xs'
                                  onClick={() => {
                                    navigator.clipboard.writeText(plan);
                                    toast.success(`Copied: ${plan}`);
                                  }}
                                >
                                  {plan}
                                </Button>
                              ))}
                            </div>
                            <p className='text-xs text-muted-foreground mt-2'>
                              Click any payment plan to copy it to clipboard
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
