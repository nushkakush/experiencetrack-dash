import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Calendar, Trophy } from 'lucide-react';
import { useCohorts } from '@/hooks/useCohorts';
import { useAuth } from '@/hooks/useAuth';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import CohortWizard from '@/components/cohorts/CohortWizard';
import CohortEditWizard from '@/components/cohorts/CohortEditWizard';
import CohortCard from '@/components/cohorts/CohortCard';
import DashboardShell from '@/components/DashboardShell';
import { GlobalHolidayManagementDialog } from '@/components/holidays/GlobalHolidayManagementDialog';
import { CombinedLeaderboard } from '@/components/attendance';
import { FeeCollectionSetupModal } from '@/components/fee-collection';
import { FeeStructureService } from '@/services/feeStructure.service';
import { cohortsService } from '@/services/cohorts.service';
import { CohortWithCounts } from '@/types/cohort';
import {
  CohortFeatureGate,
  HolidayFeatureGate,
  FeeFeatureGate,
  AttendanceFeatureGate,
} from '@/components/common';
import { toast } from 'sonner';

const CohortsPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editWizardOpen, setEditWizardOpen] = useState(false);
  const [selectedCohortForEdit, setSelectedCohortForEdit] =
    useState<CohortWithCounts | null>(null);
  const [holidaysDialogOpen, setHolidaysDialogOpen] = useState(false);
  const [combinedLeaderboardOpen, setCombinedLeaderboardOpen] = useState(false);
  const [feeCollectionModalOpen, setFeeCollectionModalOpen] = useState(false);
  const [selectedCohortForFee, setSelectedCohortForFee] =
    useState<CohortWithCounts | null>(null);
  const [feeModalMode, setFeeModalMode] = useState<'view' | 'edit'>('edit');
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [selectedCohortForDelete, setSelectedCohortForDelete] =
    useState<CohortWithCounts | null>(null);
  const { cohorts, isLoading, refetch } = useCohorts();
  const {
    canManageCohorts,
    canCreateCohorts,
    canViewCohorts,
    canSetupFeeStructure,
    canAccessCohortDetails,
  } = useFeaturePermissions();

  // Redirect if user can't view cohorts
  if (!canViewCohorts) {
    return (
      <DashboardShell>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
            <p className='text-muted-foreground mb-4'>
              You don't have permission to view cohorts.
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const handleCohortClick = (cohortId: string) => {
    // The CohortCard component now handles permission checking
    // This function will only be called if the user has permission
    navigate(`/cohorts/${cohortId}`);
  };

  const handleFeeCollectionClick = async (cohort: CohortWithCounts) => {
    try {
      // Check if fee structure is already configured
      const { feeStructure } =
        await FeeStructureService.getCompleteFeeStructure(cohort.id);

      if (feeStructure && feeStructure.is_setup_complete) {
        // Fee configuration is complete, navigate directly to dashboard
        navigate(`/cohorts/${cohort.id}/fee-payment`);
      } else {
        // Fee structure is not complete or doesn't exist
        if (canSetupFeeStructure) {
          // User has permission to set up fee structure
          if (feeStructure) {
            // Fee structure exists but is not complete, open modal in view mode
            setSelectedCohortForFee(cohort);
            setFeeModalMode('view');
            setFeeCollectionModalOpen(true);
          } else {
            // No fee structure exists, open modal in edit mode for initial setup
            setSelectedCohortForFee(cohort);
            setFeeModalMode('edit');
            setFeeCollectionModalOpen(true);
          }
        } else {
          // User doesn't have permission to set up fee structure
          toast.error(
            `Fee collection setup is not complete for "${cohort.name}". Please contact your administrator to complete the fee structure configuration.`,
            {
              duration: 5000,
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking fee structure:', error);
      if (canSetupFeeStructure) {
        // If there's an error and user has permission, default to opening the setup modal in edit mode
        setSelectedCohortForFee(cohort);
        setFeeModalMode('edit');
        setFeeCollectionModalOpen(true);
      } else {
        // If there's an error and user doesn't have permission, show error message
        toast.error(
          `Unable to check fee collection setup for "${cohort.name}". Please contact your administrator.`,
          {
            duration: 5000,
          }
        );
      }
    }
  };

  const handleFeeSetupComplete = () => {
    refetch(); // Refresh cohorts list
    setFeeCollectionModalOpen(false);
    // Navigate to the fee payment dashboard after setup is complete
    if (selectedCohortForFee) {
      navigate(`/cohorts/${selectedCohortForFee.id}/fee-payment`);
    }
    setSelectedCohortForFee(null);
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

  const handleDeleteClick = (cohort: CohortWithCounts) => {
    setSelectedCohortForDelete(cohort);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCohortForDelete) return;

    try {
      await cohortsService.deleteCohort(selectedCohortForDelete.id);
      toast.success(
        `Cohort "${selectedCohortForDelete.name}" deleted successfully.`
      );
      refetch();
    } catch (error) {
      console.error('Error deleting cohort:', error);
      toast.error(`Failed to delete cohort "${selectedCohortForDelete.name}".`);
    } finally {
      setDeleteConfirmationOpen(false);
      setSelectedCohortForDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setSelectedCohortForDelete(null);
  };

  return (
    <DashboardShell>
      <div className='space-y-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Cohorts</h1>
            <p className='text-muted-foreground'>
              {canManageCohorts
                ? 'Manage your training cohorts and student enrollments'
                : 'View training cohorts and student information'}
            </p>
          </div>
          <div className='flex gap-2'>
            <HolidayFeatureGate action='global_manage'>
              <Button
                variant='outline'
                onClick={() => setHolidaysDialogOpen(true)}
                className='gap-2'
              >
                <Calendar className='h-4 w-4' />
                Mark Global Holidays
              </Button>
            </HolidayFeatureGate>
            <AttendanceFeatureGate action='leaderboard'>
              <Button
                variant='outline'
                onClick={() => setCombinedLeaderboardOpen(true)}
                className='gap-2'
                disabled={!cohorts || cohorts.length === 0}
              >
                <Trophy className='h-4 w-4' />
                Combined Leaderboards
              </Button>
            </AttendanceFeatureGate>
            <CohortFeatureGate action='create'>
              <Button onClick={() => setWizardOpen(true)} className='gap-2'>
                <Plus className='h-4 w-4' />
                Create Cohort
              </Button>
            </CohortFeatureGate>
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className='h-6 w-3/4' />
                  <Skeleton className='h-4 w-full' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-4 w-2/3' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cohorts && cohorts.length > 0 ? (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {cohorts.map(cohort => (
              <CohortCard
                key={cohort.id}
                cohort={cohort}
                onClick={
                  canAccessCohortDetails
                    ? () => handleCohortClick(cohort.id)
                    : undefined
                }
                onFeeCollectionClick={() => handleFeeCollectionClick(cohort)}
                onEditClick={() => handleEditClick(cohort)}
                onDeleteClick={() => handleDeleteClick(cohort)}
              />
            ))}
          </div>
        ) : (
          <div className='flex items-center justify-center min-h-[400px]'>
            <Card className='w-full max-w-md'>
              <CardHeader className='text-center'>
                <CardTitle>No cohorts found</CardTitle>
                <CardDescription>
                  {canManageCohorts
                    ? 'Get started by creating your first cohort.'
                    : 'No cohorts are available to view at this time.'}
                </CardDescription>
              </CardHeader>
              <CohortFeatureGate action='create'>
                <CardContent className='text-center'>
                  <Button onClick={() => setWizardOpen(true)} className='gap-2'>
                    <Plus className='h-4 w-4' />
                    Create Your First Cohort
                  </Button>
                </CardContent>
              </CohortFeatureGate>
            </Card>
          </div>
        )}

        <CohortFeatureGate action='create'>
          <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
            <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
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
          <CohortFeatureGate action='edit'>
            <Dialog open={editWizardOpen} onOpenChange={setEditWizardOpen}>
              <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
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

        <HolidayFeatureGate action='global_manage'>
          <GlobalHolidayManagementDialog
            open={holidaysDialogOpen}
            onOpenChange={setHolidaysDialogOpen}
          />
        </HolidayFeatureGate>

        <Dialog
          open={combinedLeaderboardOpen}
          onOpenChange={setCombinedLeaderboardOpen}
        >
          <DialogContent className='max-w-7xl max-h-[90vh] overflow-y-auto'>
            {cohorts && (
              <CombinedLeaderboard
                availableCohorts={cohorts.map(cohort => ({
                  id: cohort.id,
                  name: cohort.name,
                  description: cohort.description,
                  start_date: cohort.start_date,
                  end_date: cohort.end_date,
                  studentCount: cohort.students_count || 0,
                }))}
                onClose={() => setCombinedLeaderboardOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Fee Collection Setup Modal */}
        {selectedCohortForFee && (
          <FeeFeatureGate action='setup_structure'>
            <FeeCollectionSetupModal
              open={feeCollectionModalOpen}
              onOpenChange={setFeeCollectionModalOpen}
              cohortId={selectedCohortForFee.id}
              cohortStartDate={selectedCohortForFee.start_date}
              onSetupComplete={handleFeeSetupComplete}
              mode={feeModalMode}
              onModeChange={setFeeModalMode}
            />
          </FeeFeatureGate>
        )}

        <Dialog
          open={deleteConfirmationOpen}
          onOpenChange={setDeleteConfirmationOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete cohort "
                {selectedCohortForDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
};

export default CohortsPage;
