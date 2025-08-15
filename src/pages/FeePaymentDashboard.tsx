import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import DashboardShell from "@/components/DashboardShell";
import { FeeCollectionSetupModal } from "@/components/fee-collection";
import { FeeFeatureGate } from "@/components/common";
import { 
  useDashboardData, 
  useDashboardState 
} from './fee-payment-dashboard/hooks';
import { 
  LoadingState, 
  ErrorState, 
  CohortHeader, 
  PaymentsTab, 
  CommunicationTab 
} from './fee-payment-dashboard/components';

interface FeePaymentDashboardProps {}

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
    loadData
  } = useDashboardData({ cohortId });

  const {
    settingsModalOpen,
    selectedRows,
    activeTab,
    setSettingsModalOpen,
    setActiveTab,
    handleSettingsComplete,
    handleBackClick,
    handleStudentSelect,
    handleCloseStudentDetails,
    handleRowSelection,
    handleSelectAll,
    handleExportSelected
  } = useDashboardState();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!cohortData) {
    return <ErrorState />;
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cohorts
          </Button>
        </div>

        {/* Cohort Header */}
        <CohortHeader 
          cohortData={cohortData} 
          onSettingsClick={() => setSettingsModalOpen(true)} 
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-6">
            <PaymentsTab
              students={students}
              selectedRows={selectedRows}
              feeStructure={feeStructure}
              onStudentSelect={handleStudentSelect}
              onCloseStudentDetails={handleCloseStudentDetails}
              onRowSelection={handleRowSelection}
              onSelectAll={(isSelected) => handleSelectAll(isSelected, students)}
              onExportSelected={(students) => handleExportSelected(students)}
            />
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <CommunicationTab students={students} />
          </TabsContent>
        </Tabs>

        {/* Settings Modal */}
        {cohortData && (
          <FeeFeatureGate action="setup_structure">
            <FeeCollectionSetupModal
              open={settingsModalOpen}
              onOpenChange={setSettingsModalOpen}
              cohortId={cohortData.id}
              cohortStartDate={cohortData.start_date}
              onSetupComplete={() => handleSettingsComplete(loadData)}
            />
          </FeeFeatureGate>
        )}
      </div>
    </DashboardShell>
  );
};

export default FeePaymentDashboard;
