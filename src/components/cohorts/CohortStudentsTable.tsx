import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Users, Mail } from "lucide-react";
import { CohortStudent } from "@/types/cohort";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { toast } from "sonner";
import AvatarUpload from "./AvatarUpload";
import EditStudentDialog from "./EditStudentDialog";
import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import { Edit2 } from "lucide-react";

interface CohortStudentsTableProps {
  students: CohortStudent[];
  onStudentDeleted: () => void;
  onStudentUpdated?: (studentId: string, updates: Partial<CohortStudent>) => void;
  loading?: boolean;
}

export default function CohortStudentsTable({ 
  students, 
  onStudentDeleted,
  onStudentUpdated,
  loading = false 
}: CohortStudentsTableProps) {
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [invitingStudentId, setInvitingStudentId] = useState<string | null>(null);
  const { hasPermission } = useFeaturePermissions();
  const { profile } = useAuth();
  
  // Check if user can manage students (super admin only)
  const canManageStudents = hasPermission('cohorts.manage_students');
  const canEditStudents = hasPermission('cohorts.edit_students');

  const handleAvatarUpdated = (studentId: string, avatarUrl: string | null) => {
    if (onStudentUpdated) {
      onStudentUpdated(studentId, { avatar_url: avatarUrl });
    } else {
      // Fallback to full reload if no update callback provided
      onStudentDeleted();
    }
  };

  const handleSendInvitation = async (student: CohortStudent) => {
    setInvitingStudentId(student.id);
    try {
      const invitationResult = await cohortStudentsService.sendCustomInvitation(
        student.id, 
        profile?.user_id || ''
      );
      
      if (invitationResult.success) {
        // TODO: Send email via Edge Function or SendGrid
        // For now, just show success message
        toast.success("Invitation prepared successfully!");
        console.log("Invitation URL:", invitationResult.data?.invitationUrl);
        
        // Update the student's status locally
        if (onStudentUpdated) {
          onStudentUpdated(student.id, { 
            invite_status: "sent",
            invited_at: new Date().toISOString()
          });
        } else {
          onStudentDeleted(); // Fallback to full reload
        }
      } else {
        toast.error("Failed to prepare invitation");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("An error occurred while preparing the invitation");
    } finally {
      setInvitingStudentId(null);
    }
  };

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
                <th className="text-left p-4 font-medium">Avatar</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-left p-4 font-medium">Invite Status</th>
                <th className="text-left p-4 font-medium">Invited At</th>
                {canManageStudents && <th className="text-left p-4 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-t">
                  <td className="p-4"><Skeleton className="h-12 w-12 rounded-full" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  {canManageStudents && <td className="p-4"><Skeleton className="h-8 w-8" /></td>}
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
              <th className="text-left p-4 font-medium">Avatar</th>
              <th className="text-left p-4 font-medium">Name</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Phone</th>
              <th className="text-left p-4 font-medium">Invite Status</th>
              <th className="text-left p-4 font-medium">Invited At</th>
              {canManageStudents && <th className="text-left p-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={canManageStudents ? 7 : 6} className="p-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="font-medium">No students yet</p>
                      {canManageStudents ? (
                        <p className="text-sm">Use "Add student" or "Bulk Import" to add students to this cohort.</p>
                      ) : (
                        <p className="text-sm">No students have been added to this cohort yet.</p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id} className={`border-t transition-colors hover:bg-muted/50 ${
                  index === students.length - 1 ? 'border-b' : ''
                }`}>
                  <td className="p-4">
                    <AvatarUpload
                      studentId={student.id}
                      currentAvatarUrl={student.avatar_url}
                      studentName={[student.first_name, student.last_name].filter(Boolean).join(" ") || student.email}
                      onAvatarUpdated={(newAvatarUrl) => handleAvatarUpdated(student.id, newAvatarUrl || null)}
                      disabled={deletingStudentId === student.id || invitingStudentId === student.id}
                    />
                  </td>
                  <td className="p-4 font-medium">
                    {[student.first_name, student.last_name].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="p-4">{student.email}</td>
                  <td className="p-4">{student.phone || "-"}</td>
                  <td className="p-4">
                    <Badge 
                      variant={student.invite_status === 'accepted' ? 'default' : 'secondary'}
                      className={
                        student.invite_status === 'accepted' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : student.invite_status === 'sent'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }
                    >
                      {student.invite_status}
                    </Badge>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {student.invited_at ? new Date(student.invited_at).toLocaleString() : "-"}
                  </td>
                  {canManageStudents && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {canEditStudents && (
                          <EditStudentDialog
                            student={student}
                            onUpdated={onStudentUpdated ? () => onStudentUpdated(student.id, {}) : onStudentDeleted}
                          />
                        )}
                        
                        {/* Send/Resend Invitation Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleSendInvitation(student)}
                          disabled={deletingStudentId === student.id || invitingStudentId === student.id}
                          title={student.invite_status === 'sent' ? 'Resend invitation' : 'Send invitation'}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingStudentId === student.id || invitingStudentId === student.id}
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
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
