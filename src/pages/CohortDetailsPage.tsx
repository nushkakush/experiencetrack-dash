import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { NewStudentInput } from "@/types/cohort";
import DashboardShell from "@/components/DashboardShell";
import CohortHeader from "@/components/cohorts/CohortHeader";
import CohortStudentsTable from "@/components/cohorts/CohortStudentsTable";
import { useCohortDetails } from "@/hooks/useCohortDetails";
import { BulkUploadConfig } from "@/components/common/BulkUploadDialog";
import { CohortStudent } from "@/types/cohort";
import { Scholarship } from "@/types/fee";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CohortDetailsPage() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  
  const {
    loading,
    students,
    cohort,
    deletingStudentId,
    loadData,
    handleDeleteStudent,
    updateStudent,
    validateStudentRow,
    processValidStudents,
    checkDuplicateStudents,
  } = useCohortDetails(cohortId);

  // Load scholarships for the cohort
  useEffect(() => {
    const loadScholarships = async () => {
      try {
        const { data, error } = await supabase
          .from('cohort_scholarships')
          .select('*')
          .order('amount_percentage', { ascending: true });

        if (error) throw error;
        setScholarships(data || []);
      } catch (error) {
        console.error('Error loading scholarships:', error);
      }
    };

    loadScholarships();
  }, []);

  const handleStudentUpdated = (studentId: string, updates: Partial<CohortStudent>) => {
    // Update the student locally without reloading from server
    updateStudent(studentId, updates);
  };

  const bulkUploadConfig: BulkUploadConfig<NewStudentInput> = {
    requiredHeaders: ['first_name', 'last_name', 'email'],
    optionalHeaders: ['phone', 'invite'],
    validateRow: validateStudentRow,
    processValidData: processValidStudents,
    checkDuplicates: checkDuplicateStudents,
    templateData: `first_name,last_name,email,phone,invite
John,Doe,john.doe@example.com,+1234567890,YES
Jane,Smith,jane.smith@example.com,+1234567891,NO`,
    dialogTitle: "Bulk Import Students",
    dialogDescription: "Upload a CSV file to import multiple students at once. The 'invite' column should contain 'YES' to send invitation emails or 'NO'/'blank' to skip invitations. Download the template below for the correct format.",
    fileType: "CSV",
    fileExtension: ".csv"
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            {/* Background refresh shimmer */}
            {/* We can show a subtle indicator when background refresh is happening */}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!cohort) {
    return (
      <DashboardShell>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cohort Not Found</h2>
          <p className="text-gray-600">The cohort you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <CohortHeader 
          cohort={cohort} 
          onStudentAdded={loadData}
          onRefresh={loadData}
          bulkUploadConfig={bulkUploadConfig}
        />
        
        <CohortStudentsTable
          students={students}
          scholarships={scholarships}
          onStudentDeleted={loadData}
          onStudentUpdated={handleStudentUpdated}
          loading={loading}
        />
      </div>
    </DashboardShell>
  );
}
