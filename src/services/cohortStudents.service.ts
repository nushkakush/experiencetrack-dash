
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
}

export const cohortStudentsService = new CohortStudentsService();
