import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { NewStudentInput } from "@/types/cohort";
import DashboardShell from "@/components/DashboardShell";
import CohortHeader from "@/components/cohorts/CohortHeader";
import CohortStudentsTable from "@/components/cohorts/CohortStudentsTable";
import { useCohortDetails } from "@/hooks/useCohortDetails";
import { BulkUploadConfig } from "@/components/common/BulkUploadDialog";

export default function CohortDetailsPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  
  const {
    loading,
    students,
    cohort,
    deletingStudentId,
    loadData,
    handleDeleteStudent,
    validateStudentRow,
    processValidStudents,
    checkDuplicateStudents,
  } = useCohortDetails(cohortId);

  const bulkUploadConfig: BulkUploadConfig<NewStudentInput> = {
    requiredHeaders: ['first_name', 'last_name', 'email'],
    optionalHeaders: ['phone'],
    validateRow: validateStudentRow,
    processValidData: processValidStudents,
    checkDuplicates: checkDuplicateStudents,
    templateData: `first_name,last_name,email,phone
John,Doe,john.doe@example.com,+1234567890
Jane,Smith,jane.smith@example.com,+1234567891`,
    dialogTitle: "Bulk Import Students",
    dialogDescription: "Upload a CSV file to import multiple students at once. Download the template below for the correct format.",
    fileType: "CSV",
    fileExtension: ".csv"
  };

  if (!cohortId) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Cohort</h1>
            <p className="text-muted-foreground mb-4">Cohort ID is missing.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardShell>
    );
  }

  if (!cohort) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Cohort Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested cohort could not be found.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <CohortHeader 
          cohort={cohort}
          onStudentAdded={loadData}
          bulkUploadConfig={bulkUploadConfig}
        />

        <CohortStudentsTable
          students={students}
          onStudentDeleted={loadData}
          loading={loading}
        />
      </div>
    </DashboardShell>
  );
}
