import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { CohortStudent } from "@/types/cohort";
import { Edit2 } from "lucide-react";

interface EditStudentDialogProps {
  student: CohortStudent;
  onUpdated?: () => void;
}

export default function EditStudentDialog({ student, onUpdated }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: student.first_name || "",
    last_name: student.last_name || "",
    email: student.email,
    phone: student.phone || "",
  });

  // Update form when student prop changes
  useEffect(() => {
    setForm({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      email: student.email,
      phone: student.phone || "",
    });
  }, [student]);

  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    setLoading(true);
    try {
      const result = await cohortStudentsService.update(student.id, {
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
      });

      if (result.success && result.data) {
        toast.success("Student updated successfully");
        onUpdated?.();
        setOpen(false);
      } else {
        toast.error("Failed to update student");
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("An error occurred while updating the student");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setForm({
          first_name: student.first_name || "",
          last_name: student.last_name || "",
          email: student.email,
          phone: student.phone || "",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
          title="Edit student"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the student's information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="+91 ..."
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
