import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Settings,
  UserPlus,
  Trash2,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '@/components/DashboardShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';
import {
  ApplicationConfiguration,
  StudentApplication,
} from '@/types/applications';
import { ApplicationConfigurationModal } from '@/components/applications/ApplicationConfigurationModal';
import { ApplicationStatusBadge } from '@/components/applications/ApplicationStatusBadge';
import { StatusTransitionDropdown } from '@/components/applications/StatusTransitionDropdown';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CohortApplicationsDashboard = () => {
  const { cohortId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configuration, setConfiguration] =
    useState<ApplicationConfiguration | null>(null);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [applicationsWithProfiles, setApplicationsWithProfiles] = useState<
    any[]
  >([]);
  const [cohortName, setCohortName] = useState<string>('');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deletingApplicationId, setDeletingApplicationId] = useState<
    string | null
  >(null);
  const { canSetupApplicationConfiguration } = useFeaturePermissions();

  useEffect(() => {
    if (cohortId) {
      loadData();
    }
  }, [cohortId]);

  const loadData = async () => {
    if (!cohortId) return;

    setLoading(true);
    try {
      // Load application configuration
      const { configuration: config } =
        await ApplicationConfigurationService.getCompleteConfiguration(
          cohortId
        );

      if (config) {
        setConfiguration(config);
        setCohortName(config.cohort_id); // You might want to get actual cohort name
      }

      // Load applications with profile data
      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from('student_applications')
          .select(
            `
          *,
          profiles!student_applications_profile_id_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `
          )
          .eq('cohort_id', cohortId)
          .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Error loading applications:', applicationsError);
        toast.error('Failed to load applications');
        return;
      }

      setApplications(applicationsData || []);
      setApplicationsWithProfiles(applicationsData || []);
    } catch (error) {
      console.error('Error loading applications data:', error);
      toast.error('Failed to load applications data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsComplete = () => {
    loadData(); // Refresh data after settings are updated
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this application? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeletingApplicationId(applicationId);
    try {
      const { error } = await supabase
        .from('student_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('Error deleting application:', error);
        toast.error('Failed to delete application');
        return;
      }

      toast.success('Application deleted successfully');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    } finally {
      setDeletingApplicationId(null);
    }
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add submitted_at timestamp if transitioning to submitted
      if (newStatus === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('student_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application status:', error);
        toast.error('Failed to update application status');
        return;
      }

      toast.success('Application status updated successfully');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleRegistrationToggle = async (isOpen: boolean) => {
    if (!cohortId) return;

    try {
      const success =
        await ApplicationConfigurationService.toggleRegistrationStatus(
          cohortId,
          isOpen
        );
      if (success) {
        setConfiguration(prev =>
          prev ? { ...prev, is_registration_open: isOpen } : null
        );
        toast.success(
          `Registration ${isOpen ? 'opened' : 'closed'} successfully`
        );
      } else {
        toast.error('Failed to update registration status');
      }
    } catch (error) {
      console.error('Error toggling registration status:', error);
      toast.error('Failed to update registration status');
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className='space-y-6'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-8 w-32' />
            <Skeleton className='h-8 w-48' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-32 w-full' />
            <Skeleton className='h-32 w-full' />
          </div>
          <Skeleton className='h-64 w-full' />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        <div className='space-y-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/cohorts')}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Cohorts
          </Button>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>Applications Dashboard</h1>
              <p className='text-muted-foreground'>
                Cohort: {cohortName || cohortId}
              </p>
            </div>
            <div className='flex items-center gap-4'>
              {canSetupApplicationConfiguration && configuration && (
                <div className='flex items-center space-x-2'>
                  <UserPlus className='h-4 w-4 text-muted-foreground' />
                  <Label
                    htmlFor='registration-toggle'
                    className='text-sm font-medium'
                  >
                    Registration Open
                  </Label>
                  <Switch
                    id='registration-toggle'
                    checked={configuration.is_registration_open}
                    onCheckedChange={handleRegistrationToggle}
                  />
                </div>
              )}
              {canSetupApplicationConfiguration && (
                <Button
                  onClick={() => setSettingsModalOpen(true)}
                  size='sm'
                  className='gap-2'
                >
                  <Settings className='h-4 w-4' />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Applications
              </CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{applications.length}</div>
              <p className='text-xs text-muted-foreground'>
                All submitted applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Under Review
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {
                  applications.filter(app => app.status === 'under_review')
                    .length
                }
              </div>
              <p className='text-xs text-muted-foreground'>Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Approved</CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {applications.filter(app => app.status === 'approved').length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Accepted applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Rejected</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {applications.filter(app => app.status === 'rejected').length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Declined applications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        {applicationsWithProfiles.length === 0 ? (
          <div className='text-center py-8'>
            <FileText className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
            <h3 className='text-lg font-semibold mb-2'>No applications yet</h3>
            <p className='text-muted-foreground'>
              Applications will appear here once students start registering.
            </p>
          </div>
        ) : (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicationsWithProfiles.map(application => (
                  <TableRow key={application.id} className='hover:bg-muted/50'>
                    <TableCell className='font-medium'>
                      <div>
                        <div className='font-semibold'>
                          {application.profiles.first_name}{' '}
                          {application.profiles.last_name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          ID: #{application.id.slice(-8)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {application.profiles.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ApplicationStatusBadge status={application.status} />
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div>
                          {new Date(
                            application.registration_date ||
                              application.created_at
                          ).toLocaleDateString()}
                        </div>
                        {application.submitted_at && (
                          <div className='text-muted-foreground'>
                            Submitted:{' '}
                            {new Date(
                              application.submitted_at
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm capitalize'>
                        {application.registration_source.replace('_', ' ')}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <StatusTransitionDropdown
                          currentStatus={application.status}
                          onStatusChange={newStatus =>
                            handleStatusChange(application.id, newStatus)
                          }
                        />
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            // TODO: Add view details functionality
                            toast.info(
                              'View details functionality coming soon'
                            );
                          }}
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            handleDeleteApplication(application.id)
                          }
                          disabled={deletingApplicationId === application.id}
                          className='text-red-600 hover:text-red-700 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Settings Modal */}
        {cohortId && (
          <ApplicationConfigurationModal
            open={settingsModalOpen}
            onOpenChange={setSettingsModalOpen}
            cohortId={cohortId}
            cohortName={cohortName}
            onSetupComplete={handleSettingsComplete}
          />
        )}
      </div>
    </DashboardShell>
  );
};

export default CohortApplicationsDashboard;
