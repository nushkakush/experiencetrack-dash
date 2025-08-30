import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Download, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CustomizedPlanData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  payment_plan: string;
  instalment_wise_dates: {
    semesters: {
      [key: string]: {
        installments: {
          [key: string]: string;
        };
      };
    };
    admission_date: string;
  };
  custom_plan_created: string;
}

interface CohortPlanData {
  total_program_fee: number;
  admission_fee: number;
  number_of_semesters: number;
  instalments_per_semester: number;
  instalment_wise_dates: {
    [key: string]: string;
  };
}

export const CP2CustomizedPlansReport: React.FC = () => {
  const [customizedPlans, setCustomizedPlans] = useState<CustomizedPlanData[]>(
    []
  );
  const [cohortPlan, setCohortPlan] = useState<CohortPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CP2_COHORT_ID = 'a49ab406-f5b1-4557-a1c3-c612e3e9385b';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customized plans
      const { data: customPlans, error: customError } = await supabase
        .from('cohort_students')
        .select(
          `
          id as student_id,
          first_name,
          last_name,
          email,
          student_payments!inner(payment_plan),
          fee_structures!inner(
            structure_type,
            instalment_wise_dates,
            created_at
          )
        `
        )
        .eq('cohort_id', CP2_COHORT_ID)
        .eq('fee_structures.structure_type', 'custom');

      if (customError) throw customError;

      // Fetch cohort plan
      const { data: cohortData, error: cohortError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('cohort_id', CP2_COHORT_ID)
        .eq('structure_type', 'cohort')
        .single();

      if (cohortError) throw cohortError;

      setCustomizedPlans(customPlans || []);
      setCohortPlan(cohortData);
    } catch (err) {
      console.error('Error fetching CP2 data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    if (!customizedPlans.length) return;

    const headers = [
      'Student Name',
      'Email',
      'Payment Plan',
      'Admission Date',
      'Semester 1 - Installment 1',
      'Semester 1 - Installment 2',
      'Semester 1 - Installment 3',
      'Semester 2 - Installment 1',
      'Semester 2 - Installment 2',
      'Semester 2 - Installment 3',
      'Semester 3 - Installment 1',
      'Semester 3 - Installment 2',
      'Semester 3 - Installment 3',
      'Custom Plan Created',
    ];

    const csvData = customizedPlans.map(plan => [
      `${plan.first_name} ${plan.last_name}`,
      plan.email,
      plan.payment_plan,
      formatDate(plan.instalment_wise_dates.admission_date),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_1.installments
          .installment_0
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_1.installments
          .installment_1
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_1.installments
          .installment_2
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_2.installments
          .installment_0
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_2.installments
          .installment_1
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_2.installments
          .installment_2
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_3.installments
          .installment_0
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_3.installments
          .installment_1
      ),
      formatDate(
        plan.instalment_wise_dates.semesters.semester_3.installments
          .installment_2
      ),
      formatDate(plan.custom_plan_created),
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CP2_Customized_Payment_Plans_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-8 w-64' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-48' />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='text-center text-red-600'>
            <p>Error: {error}</p>
            <Button onClick={fetchData} className='mt-4'>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            CP2 Cohort - Customized Payment Plans Report
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            All students with customized payment plans and their applicable
            dates
          </p>
        </div>
        <Button onClick={exportToCSV} className='flex items-center gap-2'>
          <Download className='h-4 w-4' />
          Export to CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-blue-600' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Total Students
                </p>
                <p className='text-2xl font-bold'>{customizedPlans.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-green-600' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Payment Plan
                </p>
                <p className='text-2xl font-bold capitalize'>
                  {customizedPlans[0]?.payment_plan.replace('_', ' ') || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-purple-600' />
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Program Duration
                </p>
                <p className='text-2xl font-bold'>
                  {cohortPlan?.number_of_semesters || 0} Semesters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Plan Reference */}
      {cohortPlan && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Cohort Default Plan (Reference)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Program Fee</p>
                <p className='text-lg font-semibold'>
                  ₹{cohortPlan.total_program_fee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Admission Fee
                </p>
                <p className='text-lg font-semibold'>
                  ₹{cohortPlan.admission_fee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Installments per Semester
                </p>
                <p className='text-lg font-semibold'>
                  {cohortPlan.instalments_per_semester}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customized Plans */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>Customized Payment Plans</h2>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {customizedPlans.map(plan => (
            <Card
              key={plan.student_id}
              className='hover:shadow-lg transition-shadow'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div>
                    <CardTitle className='text-lg'>
                      {plan.first_name} {plan.last_name}
                    </CardTitle>
                    <p className='text-sm text-gray-600 mt-1'>{plan.email}</p>
                  </div>
                  <Badge variant='secondary' className='capitalize'>
                    {plan.payment_plan.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Admission Date
                  </p>
                  <p className='text-sm'>
                    {formatDate(plan.instalment_wise_dates.admission_date)}
                  </p>
                </div>

                <div className='space-y-2'>
                  <p className='text-sm font-medium text-gray-600'>
                    Payment Schedule
                  </p>
                  <div className='space-y-1 text-xs'>
                    <div className='flex justify-between'>
                      <span>Sem 1 - Inst 1:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_1
                            .installments.installment_0
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 1 - Inst 2:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_1
                            .installments.installment_1
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 1 - Inst 3:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_1
                            .installments.installment_2
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 2 - Inst 1:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_2
                            .installments.installment_0
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 2 - Inst 2:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_2
                            .installments.installment_1
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 2 - Inst 3:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_2
                            .installments.installment_2
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 3 - Inst 1:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_3
                            .installments.installment_0
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 3 - Inst 2:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_3
                            .installments.installment_1
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Sem 3 - Inst 3:</span>
                      <span>
                        {formatDate(
                          plan.instalment_wise_dates.semesters.semester_3
                            .installments.installment_2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='pt-2 border-t'>
                  <p className='text-xs text-gray-500'>
                    Custom plan created: {formatDate(plan.custom_plan_created)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
