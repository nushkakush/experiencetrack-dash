
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { CohortStudent } from "@/types/cohort";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AddStudentDialog from "./AddStudentDialog";

interface CohortDetailsDialogProps {
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CohortDetailsDialog({ cohortId, open, onOpenChange }: CohortDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<CohortStudent[]>([]);

  const load = async () => {
    setLoading(true);
    const res = await cohortStudentsService.listByCohort(cohortId);
    setStudents(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Students</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between pb-2">
          <div className="text-sm text-muted-foreground">{students.length} student(s)</div>
          <AddStudentDialog cohortId={cohortId} onAdded={load} />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Invite Status</th>
                    <th className="text-left p-3">Invited At</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-40" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                      </tr>
                    ))
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-5 text-center text-muted-foreground">
                        No students yet. Use "Add student" to invite students.
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-3">{[s.first_name, s.last_name].filter(Boolean).join(" ") || "-"}</td>
                        <td className="p-3">{s.email}</td>
                        <td className="p-3">{s.phone || "-"}</td>
                        <td className="p-3 capitalize">{s.invite_status}</td>
                        <td className="p-3">{s.invited_at ? new Date(s.invited_at).toLocaleString() : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end pt-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
