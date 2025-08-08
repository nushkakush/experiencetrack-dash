import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CohortWithCounts } from "@/types/cohort";
import AddStudentDialog from "@/components/cohorts/AddStudentDialog";
import BulkUploadDialog, { BulkUploadConfig } from "@/components/common/BulkUploadDialog";
import { NewStudentInput } from "@/types/cohort";

interface CohortHeaderProps {
  cohort: CohortWithCounts;
  onStudentAdded: () => void;
  bulkUploadConfig: BulkUploadConfig<NewStudentInput>;
}

export default function CohortHeader({ 
  cohort, 
  onStudentAdded, 
  bulkUploadConfig 
}: CohortHeaderProps) {
  const navigate = useNavigate();

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
          <AddStudentDialog cohortId={cohort.id} onAdded={onStudentAdded} />
        </div>
      </div>
    </>
  );
}
