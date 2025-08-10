
import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { ApiResponse } from "@/types/common";
import { CohortStudent, NewStudentInput } from "@/types/cohort";

class CohortStudentsService extends BaseService<CohortStudent> {
  constructor() {
    super("cohort_students");
  }

  async listByCohort(cohortId: string): Promise<ApiResponse<CohortStudent[]>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohort_students")
        .select("*")
        .eq("cohort_id", cohortId)
        .order("created_at", { ascending: false });
    });
  }

  async addOne(cohortId: string, input: NewStudentInput): Promise<ApiResponse<CohortStudent>> {
    return this.create<CohortStudent>({
      cohort_id: cohortId,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      avatar_url: input.avatar_url,
      invite_status: "pending",
    } as Partial<CohortStudent>);
  }

  async updateByEmail(cohortId: string, email: string, input: NewStudentInput): Promise<ApiResponse<CohortStudent>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from("cohort_students")
        .update({
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          avatar_url: input.avatar_url,
        })
        .eq("cohort_id", cohortId)
        .eq("email", email)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async upsertStudent(cohortId: string, input: NewStudentInput): Promise<ApiResponse<CohortStudent>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from("cohort_students")
        .upsert({
          cohort_id: cohortId,
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          avatar_url: input.avatar_url,
          invite_status: "pending",
        }, {
          onConflict: 'cohort_id,email'
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async markInvited(id: string): Promise<void> {
    const { error } = await supabase
      .from("cohort_students")
      .update({ invite_status: "sent", invited_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  async sendCustomInvitation(id: string, invitedBy: string): Promise<ApiResponse<{ invitationUrl: string }>> {
    return this["executeQuery"](async () => {
      // Generate a unique invitation token
      const invitationToken = crypto.randomUUID();
      
      // Set invitation expiry to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from("cohort_students")
        .update({ 
          invite_status: "sent", 
          invited_at: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          invited_by: invitedBy
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Generate invitation URL
      const invitationUrl = `${window.location.origin}/invite/${invitationToken}`;
      
      return { data: { invitationUrl }, error: null };
    });
  }

  async getStudentByInvitationToken(token: string): Promise<ApiResponse<CohortStudent>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from("cohort_students")
        .select("*")
        .eq("invitation_token", token)
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<ApiResponse<CohortStudent>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from("cohort_students")
        .update({ 
          invite_status: "accepted", 
          accepted_at: new Date().toISOString(),
          user_id: userId
        })
        .eq("invitation_token", token)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async update(id: string, updates: Partial<CohortStudent>): Promise<ApiResponse<CohortStudent>> {
    return this["executeQuery"](async () => {
      const { data, error } = await supabase
        .from("cohort_students")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    });
  }

  async sendInvitationEmail(studentId: string, email: string, firstName: string, lastName: string, cohortName: string): Promise<ApiResponse<{ invitationUrl: string; emailSent: boolean }>> {
    try {
      const supabaseUrl = "https://ghmpaghyasyllfvamfna.supabase.co";
      const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
        },
        body: JSON.stringify({
          studentId,
          email,
          firstName,
          lastName,
          cohortName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { data: result, error: null, success: true };
      } else {
        return { data: null, error: result.error, success: false };
      }
    } catch (error) {
      return { data: null, error: error.message, success: false };
    }
  }
}

export const cohortStudentsService = new CohortStudentsService();
