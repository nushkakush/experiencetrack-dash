
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { NewStudentInput } from "@/types/cohort";
import { supabase } from "@/integrations/supabase/client";

interface AddStudentDialogProps {
  cohortId: string;
  onAdded?: () => void;
}

export default function AddStudentDialog({ cohortId, onAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewStudentInput>({ email: "", first_name: "", last_name: "", phone: "" });

  const handleSubmit = async () => {
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const added = await cohortStudentsService.addOne(cohortId, form);
      if (!added.success || !added.data) {
        toast.error("Failed to add student");
        setLoading(false);
        return;
      }

      // Send magic link invite using OTP (no secrets required)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email.trim(),
        options: {
          data: {
            role: "student",
            first_name: form.first_name,
            last_name: form.last_name,
          },
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin, // redirect to app root after sign-in
        },
      });

      if (otpError) {
        console.error("OTP invite error:", otpError);
        toast.error("Student added, but failed to send invite.");
      } else {
        await cohortStudentsService.markInvited(added.data.id);
        toast.success("Student added and invite sent!");
      }

      onAdded?.();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
      <DialogTrigger asChild>
        <Button size="sm">Add student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>They will receive a magic link to sign in.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Email</Label>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Adding..." : "Add & invite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
