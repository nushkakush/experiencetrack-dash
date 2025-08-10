import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Calendar, Trophy } from "lucide-react";
import { useCohorts } from "@/hooks/useCohorts";
import { useAuth } from "@/hooks/useAuth";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import CohortWizard from "@/components/cohorts/CohortWizard";
import CohortEditWizard from "@/components/cohorts/CohortEditWizard";
import CohortCard from "@/components/cohorts/CohortCard";
import DashboardShell from "@/components/DashboardShell";
import { GlobalHolidayManagementDialog } from "@/components/holidays/GlobalHolidayManagementDialog";
import { CombinedLeaderboard } from "@/components/attendance";
import { FeeCollectionSetupModal } from "@/components/fee-collection";
import { FeeStructureService } from "@/services/feeStructure.service";
import { CohortWithCounts } from "@/types/cohort";
import { CohortFeatureGate, HolidayFeatureGate, FeeFeatureGate } from "@/components/common";
import { toast } from "sonner";

const CohortsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [selectedCohortForEdit, setSelectedCohortForEdit] = useState<CohortWithCounts | null>(null);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);
  const [combinedLeaderboardOpen, setCombinedLeaderboardOpen] = useState(false);
  const [feeCollectionModalOpen, setFeeCollectionModalOpen] = useState(false);
  const [selectedCohortForFee, setSelectedCohortForFee] = useState<CohortWithCounts | null>(null);
  const { cohorts, isLoading, refetch } = useCohorts();
  const { canManageCohorts, canCreateCohorts, canViewCohorts, canSetupFeeStructure } = useFeaturePermissions();

  // Redirect if user can't view cohorts
  if (!canViewCohorts) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You don't have permission to view cohorts.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const handleCohortClick = (cohortId: string) => {
    navigate(`/cohorts/${cohortId}`);
  };

  const handleFeeCollectionClick = async (cohort: CohortWithCounts) => {
    // Navigate to the fee payment dashboard
    navigate(`/cohorts/${cohort.id}/fee-payment`);
  };

  const handleFeeSetupComplete = () => {
    refetch(); // Refresh cohorts list
  };

  const handleEditClick = (cohort: CohortWithCounts) => {
    setSelectedCohortForEdit(cohort);
    setEditWizardOpen(true);
  };

  const handleEditComplete = () => {
    refetch(); // Refresh cohorts list
    setEditWizardOpen(false);
    setSelectedCohortForEdit(null);
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cohorts</h1>
            <p className="text-muted-foreground">
              {canManageCohorts 
                ? "Manage your training cohorts and student enrollments"
                : "View training cohorts and student information"
              }
            </p>
          </div>
          <div className="flex gap-2">
            <HolidayFeatureGate action="global_manage">
              <Button 
                variant="outline" 
                onClick={() => setHolidaysDialogOpen(true)} 
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Mark Global Holidays
              </Button>
            </HolidayFeatureGate>
            <Button 
              variant="outline" 
              onClick={() => setCombinedLeaderboardOpen(true)} 
              className="gap-2"
              disabled={!cohorts || cohorts.length === 0}
            >
              <Trophy className="h-4 w-4" />
              Combined Leaderboards
            </Button>
            <CohortFeatureGate action="create">
              <Button onClick={() => setWizardOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Cohort
              </Button>
            </CohortFeatureGate>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cohorts && cohorts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((cohort) => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onClick={() => handleCohortClick(cohort.id)}
                onFeeCollectionClick={() => handleFeeCollectionClick(cohort)}
                onEditClick={() => handleEditClick(cohort)}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle>No cohorts found</CardTitle>
                <CardDescription>
                  {canManageCohorts 
                    ? "Get started by creating your first cohort."
                    : "No cohorts are available to view at this time."
                  }
                </CardDescription>
              </CardHeader>
              <CohortFeatureGate action="create">
                <CardContent className="text-center">
                  <Button onClick={() => setWizardOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Cohort
                  </Button>
                </CardContent>
              </CohortFeatureGate>
            </Card>
          </div>
        )}

        <CohortFeatureGate action="create">
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogContent className="max-w-4xl">
              <CohortWizard
                onCreated={() => {
                  refetch();
                  setWizardOpen(false);
                }}
                onClose={() => setWizardOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CohortFeatureGate>

        {selectedCohortForEdit && (
          <CohortFeatureGate action="edit">
            <Dialog open={editWizardOpen} onOpenChange={setEditWizardOpen}>
              <DialogContent className="max-w-4xl">
                <CohortEditWizard
                  cohort={selectedCohortForEdit}
                  onUpdated={handleEditComplete}
                  onClose={() => {
                    setEditWizardOpen(false);
                    setSelectedCohortForEdit(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </CohortFeatureGate>
        )}

        <HolidayFeatureGate action="global_manage">
          <GlobalHolidayManagementDialog
            open={holidaysDialogOpen}
            onOpenChange={setHolidaysDialogOpen}
          />
        </HolidayFeatureGate>

        <Dialog open={combinedLeaderboardOpen} onOpenChange={setCombinedLeaderboardOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            {cohorts && (
              <CombinedLeaderboard
                availableCohorts={cohorts.map(cohort => ({
                  id: cohort.id,
                  name: cohort.name,
                  description: cohort.description,
                  start_date: cohort.start_date,
                  end_date: cohort.end_date,
                  studentCount: cohort.students_count || 0
                }))}
                onClose={() => setCombinedLeaderboardOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Fee Collection Setup Modal */}
        {selectedCohortForFee && (
          <FeeFeatureGate action="setup_structure">
            <FeeCollectionSetupModal
              open={feeCollectionModalOpen}
              onOpenChange={setFeeCollectionModalOpen}
              cohortId={selectedCohortForFee.id}
              cohortStartDate={selectedCohortForFee.start_date}
              onSetupComplete={handleFeeSetupComplete}
            />
          </FeeFeatureGate>
        )}
      </div>
    </DashboardShell>
  );
};

export default CohortsPage;