import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, RefreshCw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CohortWithCounts } from '@/types/cohort';
import AddStudentDialog from '@/components/cohorts/AddStudentDialog';
import BulkUploadDialog, {
  BulkUploadConfig,
} from '@/components/common/BulkUploadDialog';
import { BulkFeeManagementDialog } from '@/components/common/bulk-upload';
import { NewStudentInput } from '@/types/cohort';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useAuth } from '@/hooks/useAuth';

interface CohortHeaderProps {
  cohort: CohortWithCounts;
  onStudentAdded: () => void;
  onRefresh?: () => void;
  bulkUploadConfig: BulkUploadConfig<NewStudentInput>;
  onFeeManagementSuccess?: () => void;
  studentCount?: number;
  isRefreshing?: boolean;
}

export default function CohortHeader({
  cohort,
  onStudentAdded,
  onRefresh,
  bulkUploadConfig,
  onFeeManagementSuccess,
  studentCount,
  isRefreshing = false,
}: CohortHeaderProps) {
  const navigate = useNavigate();
  const { hasPermission } = useFeaturePermissions();
  const { profile } = useAuth();

  // Check if user can manage students (super admin only)
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canBulkUpload = hasPermission('cohorts.bulk_upload');
  const canManageFees = hasPermission('fees.bulk_management');

  // Check if bulk fee management should be enabled (needs students)
  const hasStudents = (studentCount ?? 0) > 0;

  return (
    <>
      {/* Back Navigation */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/cohorts')}
          className='gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Cohorts
        </Button>
      </div>

      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>{cohort.name}</h1>
          <p className='text-muted-foreground'>Cohort ID: {cohort.cohort_id}</p>
        </div>
        <div className='flex items-center gap-2'>
          {onRefresh && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isRefreshing}
              className='gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          {(canManageStudents || canBulkUpload || canManageFees) && (
            <>
              {canBulkUpload && (
                <BulkUploadDialog
                  config={bulkUploadConfig}
                  trigger={
                    <Button variant='outline' size='sm' className='gap-2'>
                      <Upload className='h-4 w-4' />
                      Bulk Upload Students
                    </Button>
                  }
                  onSuccess={onStudentAdded}
                />
              )}
              {canManageFees && (
                <BulkFeeManagementDialog
                  cohortId={cohort.id}
                  onSuccess={onFeeManagementSuccess}
                  disabled={!hasStudents}
                >
                  <Button
                    variant='outline'
                    size='sm'
                    className={`gap-2 ${!hasStudents ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!hasStudents}
                    title={
                      !hasStudents
                        ? 'Add students to the cohort first'
                        : 'Manage scholarships and payment plans for students'
                    }
                  >
                    <Settings className='h-4 w-4' />
                    Bulk Fee Management
                    {!hasStudents && (
                      <span className='ml-1 text-xs text-muted-foreground'>
                        (No students)
                      </span>
                    )}
                  </Button>
                </BulkFeeManagementDialog>
              )}
              {canManageStudents && (
                <AddStudentDialog
                  cohortId={cohort.id}
                  onAdded={onStudentAdded}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
