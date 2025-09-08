import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import DashboardShell from '@/components/DashboardShell';
import { AttendanceOverview } from './components/AttendanceOverview';
import { FeePaymentSection } from './components/FeePaymentSection';
import { useStudentData } from './hooks/useStudentData';
import { useAuth } from '@/hooks/useAuth';
import { StudentApplicationsService } from '@/services/studentApplications.service';
import { Skeleton } from '@/components/ui/skeleton';
import { NoCohortState } from './components/NoCohortState';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';

interface StudentDashboardProps {
  currentRoute?: string;
}

const StudentDashboard = React.memo<StudentDashboardProps>(
  ({ currentRoute }) => {
    const location = useLocation();
    const { profile } = useAuth();
    const { studentData, cohortData, loading, error, noCohort } =
      useStudentData();
    const [hasRegisteredApplications, setHasRegisteredApplications] =
      useState(false);
    const [checkingApplications, setCheckingApplications] = useState(false);

    // Check if student payment dashboard feature flag is enabled
    const { isEnabled: showStudentPaymentDashboard } = useFeatureFlag(
      'student-payment-dashboard',
      {
        defaultValue: false,
      }
    );

    // Check for registered applications when noCohort is true
    useEffect(() => {
      const checkRegisteredApplications = async () => {
        if (!noCohort || !profile?.id) return;

        setCheckingApplications(true);
        try {
          const result =
            await StudentApplicationsService.getRegisteredApplications(
              profile.id
            );
          if (result.success && result.data && result.data.length > 0) {
            setHasRegisteredApplications(true);
          }
        } catch (error) {
          console.error('Error checking registered applications:', error);
        } finally {
          setCheckingApplications(false);
        }
      };

      checkRegisteredApplications();
    }, [noCohort, profile?.id]);

    // Determine which tab to show based on currentRoute prop or URL
    const currentTab = React.useMemo(() => {
      return (currentRoute || location.pathname).includes('fee-payment')
        ? 'fee-payment'
        : 'attendance';
    }, [currentRoute, location.pathname]);

    // Redirect to attendance if trying to access fee-payment but feature flag is disabled
    if (currentTab === 'fee-payment' && !showStudentPaymentDashboard) {
      return <Navigate to='/dashboard' replace />;
    }

    // Show no-cohort state immediately when known
    if (noCohort) {
      return (
        <DashboardShell hideSidebar>
          <NoCohortState />
        </DashboardShell>
      );
    }

    if (loading) {
      return (
        <DashboardShell>
          <div className='space-y-6'>
            <Skeleton className='h-8 w-48' />
            <div className='grid gap-6'>
              <Skeleton className='h-32 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          </div>
        </DashboardShell>
      );
    }

    if (error || !studentData || !cohortData) {
      return (
        <DashboardShell>
          <div className='space-y-6'>
            <div className='text-center py-8'>
              <h1 className='text-2xl font-bold mb-4'>
                Student Data Not Available
              </h1>
              <p className='text-muted-foreground'>
                Unable to load student information.
              </p>
            </div>
          </div>
        </DashboardShell>
      );
    }

    // Debug logging
    console.log('StudentDashboard Debug:', {
      currentTab,
      hasStudentData: !!studentData,
      hasCohortData: !!cohortData,
      studentId: studentData?.id,
      cohortId: cohortData?.id,
    });

    return (
      <DashboardShell>
        <div className='space-y-6 w-full h-full'>
          {currentTab === 'attendance' ? (
            <AttendanceOverview
              studentData={studentData}
              cohortData={cohortData}
            />
          ) : (
            <FeePaymentSection
              studentData={studentData}
              cohortData={cohortData}
            />
          )}
        </div>
      </DashboardShell>
    );
  }
);

StudentDashboard.displayName = 'StudentDashboard';

export default StudentDashboard;
