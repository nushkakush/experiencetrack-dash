
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { NewStudentInput } from "@/types/cohort";
import { useAuth } from "@/hooks/useAuth";

interface AddStudentDialogProps {
  cohortId: string;
  onAdded?: () => void;
}

export default function AddStudentDialog({ cohortId, onAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const [form, setForm] = useState<NewStudentInput>({ 
    email: "", 
    first_name: "", 
    last_name: "", 
    phone: "",
    send_invite: true // Default to sending invitation
  });

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

      // Only send invitation if send_invite is true
      if (form.send_invite) {
        try {
          const invitationResult = await cohortStudentsService.sendCustomInvitation(
            added.data.id, 
            profile?.user_id || ''
          );
          
          if (invitationResult.success) {
            // Send email via Edge Function
            const emailResult = await cohortStudentsService.sendInvitationEmail(
              added.data.id,
              form.email,
              form.first_name || '',
              form.last_name || '',
              'Your Cohort' // TODO: Get cohort name
            );
            
            if (emailResult.success && emailResult.data?.emailSent) {
              toast.success("Student added and invitation email sent!");
            } else {
              toast.success("Student added and invitation prepared!");
              console.log("Invitation URL:", invitationResult.data?.invitationUrl);
            }
          } else {
            toast.error("Student added, but failed to prepare invitation.");
          }
        } catch (inviteError) {
          console.error("Invitation error:", inviteError);
          toast.error("Student added, but failed to prepare invitation.");
        }
      } else {
        // Don't send invitation, keep status as "pending"
        toast.success("Student added successfully!");
      }

      onAdded?.();
      setOpen(false);
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
          email: "", 
          first_name: "", 
          last_name: "", 
          phone: "",
          send_invite: true 
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Add student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>Add a new student to this cohort. You can choose whether to send them an invitation link.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
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
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="send-invite"
              checked={form.send_invite}
              onCheckedChange={(checked) => 
                setForm((f) => ({ ...f, send_invite: checked as boolean }))
              }
            />
            <Label htmlFor="send-invite" className="text-sm font-normal">
              Send invitation email to student
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => handleOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : form.send_invite ? "Add & invite" : "Add student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
