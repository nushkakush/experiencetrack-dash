import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CohortWithCounts } from "@/types/cohort";
import AddStudentDialog from "@/components/cohorts/AddStudentDialog";
import BulkUploadDialog, { BulkUploadConfig } from "@/components/common/BulkUploadDialog";
import { NewStudentInput } from "@/types/cohort";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";

interface CohortHeaderProps {
  cohort: CohortWithCounts;
  onStudentAdded: () => void;
  onRefresh?: () => void;
  bulkUploadConfig: BulkUploadConfig<NewStudentInput>;
}

export default function CohortHeader({ 
  cohort, 
  onStudentAdded, 
  onRefresh,
  bulkUploadConfig 
}: CohortHeaderProps) {
  const navigate = useNavigate();
  const { hasPermission } = useFeaturePermissions();
  
  // Check if user can manage students (super admin only)
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canBulkUpload = hasPermission('cohorts.bulk_upload');

  return (
    <>
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cohorts")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cohorts
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{cohort.name}</h1>
          <p className="text-muted-foreground">Cohort ID: {cohort.cohort_id}</p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
          {(canManageStudents || canBulkUpload) && (
            <>
              {canBulkUpload && (
                <BulkUploadDialog
                  config={bulkUploadConfig}
                  trigger={
                    <Button variant="outline" size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Bulk Import
                    </Button>
                  }
                  onSuccess={onStudentAdded}
                />
              )}
              {canManageStudents && (
                <AddStudentDialog cohortId={cohort.id} onAdded={onStudentAdded} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
