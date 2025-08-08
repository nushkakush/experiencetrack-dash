import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Users } from "lucide-react";
import { CohortStudent } from "@/types/cohort";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CohortStudentsTableProps {
  students: CohortStudent[];
  onStudentDeleted: () => void;
  loading?: boolean;
}

export default function CohortStudentsTable({ 
  students, 
  onStudentDeleted, 
  loading = false 
}: CohortStudentsTableProps) {
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const handleDeleteStudent = async (studentId: string) => {
    setDeletingStudentId(studentId);
    try {
      const result = await cohortStudentsService.delete(studentId);
      if (result.success) {
        toast.success("Student removed from cohort successfully");
        onStudentDeleted();
      } else {
        toast.error("Failed to remove student from cohort");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("An error occurred while removing the student");
    } finally {
      setDeletingStudentId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-left p-4 font-medium">Invite Status</th>
                <th className="text-left p-4 font-medium">Invited At</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t">
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-8 w-8" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Invite Status</th>
              <th className="text-left p-4 font-medium">Invited At</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="font-medium">No students yet</p>
                      <p className="text-sm">Use "Add student" or "Bulk Import" to add students to this cohort.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id} className={`border-t transition-colors hover:bg-muted/50 ${
                  index === students.length - 1 ? 'border-b' : ''
                }`}>
                  <td className="p-4 font-medium">
                    {[student.first_name, student.last_name].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="p-4">{student.email}</td>
                  <td className="p-4">{student.phone || "-"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.invite_status === 'accepted' 
                        ? 'bg-green-100 text-green-800' 
                        : student.invite_status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : student.invite_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.invite_status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {student.invited_at ? new Date(student.invited_at).toLocaleString() : "-"}
                  </td>
                  <td className="p-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={deletingStudentId === student.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <span className="font-medium">
                              {[student.first_name, student.last_name].filter(Boolean).join(" ") || student.email}
                            </span>{" "}
                            from this cohort? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(student.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deletingStudentId === student.id ? "Removing..." : "Remove Student"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
