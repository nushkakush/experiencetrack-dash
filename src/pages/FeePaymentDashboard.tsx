import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import DashboardShell from '@/components/DashboardShell';
import { FeeCollectionSetupModal } from '@/components/fee-collection';
import { FeeFeatureGate } from '@/components/common';
import {
  useDashboardData,
  useDashboardState,
  usePendingVerifications,
} from './fee-payment-dashboard/hooks';
import {
  LoadingState,
  ErrorState,
  CohortHeader,
  PaymentsTab,
} from './fee-payment-dashboard/components';

type FeePaymentDashboardProps = Record<string, never>;

const FeePaymentDashboard: React.FC<FeePaymentDashboardProps> = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { profile } = useAuth();
  const { canSetupFeeStructure } = useFeaturePermissions();

  const {
    isLoading,
    cohortData,
    students,
    feeStructure,
    scholarships,
    loadData,
  } = useDashboardData({ cohortId });

  const {
    settingsModalOpen,
    settingsMode,
    selectedRows,
    setSettingsModalOpen,
    setSettingsMode,
    handleSettingsComplete,
    handleBackClick,
    handleStudentSelect,
    handleCloseStudentDetails,
    handleRowSelection,
    handleSelectAll,
    handleExportSelected,
  } = useDashboardState();

  const {
    pendingCount: pendingVerificationCount,
    refetch: refetchPendingCount,
  } = usePendingVerifications(cohortId);

  const handleVerificationClick = () => {
    // Trigger a refetch
    refetchPendingCount();
  };

  const handleVerificationUpdate = async () => {
    // Refresh both pending count and main dashboard data
    await Promise.all([refetchPendingCount(), loadData()]);
  };

  const handlePendingCountUpdate = async () => {
    // Only refresh pending count, not the entire dashboard state
    // This prevents modal from closing while still updating the UI
    await refetchPendingCount();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!cohortData) {
    return <ErrorState />;
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Back Button */}
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleBackClick}
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Cohorts
          </Button>
        </div>

        {/* Cohort Header */}
        <CohortHeader
          cohortData={cohortData}
          onSettingsClick={mode => {
            setSettingsMode(mode || 'view');
            setSettingsModalOpen(true);
          }}
        />

        {/* Payments Interface */}
        <div className='mt-6'>
          <PaymentsTab
            students={students}
            selectedRows={selectedRows}
            feeStructure={feeStructure}
            onStudentSelect={handleStudentSelect}
            onCloseStudentDetails={handleCloseStudentDetails}
            onRowSelection={handleRowSelection}
            onSelectAll={isSelected => handleSelectAll(isSelected, students)}
            onExportSelected={students => handleExportSelected(students)}
            onVerificationUpdate={handleVerificationUpdate}
            onPendingCountUpdate={handlePendingCountUpdate}
          />
        </div>

        {/* Settings Modal */}
        {cohortData && (
          <FeeFeatureGate action='setup_structure'>
            <FeeCollectionSetupModal
              open={settingsModalOpen}
              onOpenChange={setSettingsModalOpen}
              cohortId={cohortData.id}
              cohortStartDate={cohortData.start_date}
              onSetupComplete={() => handleSettingsComplete(loadData)}
              mode={settingsMode}
              onModeChange={setSettingsMode}
            />
          </FeeFeatureGate>
        )}
      </div>
    </DashboardShell>
  );
};

export default FeePaymentDashboard;
