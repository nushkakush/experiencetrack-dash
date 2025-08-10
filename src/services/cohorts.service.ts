
import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { ApiResponse } from "@/types/common";
import { Cohort, CohortEpic, NewCohortInput, NewEpicInput, CohortWithCounts } from "@/types/cohort";

class CohortsService extends BaseService<Cohort> {
  constructor() {
    super("cohorts");
  }

  async listAll(): Promise<ApiResponse<Cohort[]>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohorts")
        .select("*")
        .order("created_at", { ascending: false });
    });
  }

  async listAllWithCounts(): Promise<ApiResponse<CohortWithCounts[]>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohorts")
        .select(`
          *,
          students:cohort_students(count)
        `)
        .order("created_at", { ascending: false });
    });
  }

  async getById(id: string): Promise<ApiResponse<Cohort>> {
    return this.findById<Cohort>(id);
  }

  async getByIdWithCounts(id: string): Promise<ApiResponse<CohortWithCounts>> {
    const cohortResponse = await this.findById<Cohort>(id);
    if (!cohortResponse.success || !cohortResponse.data) {
      return cohortResponse as ApiResponse<CohortWithCounts>;
    }

    const students_count = await this.countStudents(id);
    const cohortWithCounts: CohortWithCounts = {
      ...cohortResponse.data,
      students_count,
    };

    return {
      data: cohortWithCounts,
      error: null,
      success: true,
    };
  }

  async isCohortIdUnique(cohort_id: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from("cohorts")
      .select("id")
      .eq("cohort_id", cohort_id);
    
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("isCohortIdUnique error:", error);
      return false;
    }
    return !data;
  }

  async createWithEpics(input: NewCohortInput, epics: NewEpicInput[]): Promise<ApiResponse<{ cohort: Cohort; epics: CohortEpic[] }>> {
    const created = await this.create<Cohort>(input);
    const cohort = created.data as Cohort;

    let createdEpics: CohortEpic[] = [];
    if (epics && epics.length > 0) {
      const items = epics.map((e, idx) => ({
        cohort_id: cohort.id,
        name: e.name,
        duration_months: e.duration_months,
        position: idx + 1,
      }));
      const { data: epicsData, error } = await supabase
        .from("cohort_epics")
        .insert(items)
        .select("*");
      if (error) {
        throw error;
      }
      createdEpics = epicsData as CohortEpic[];
    }

    return {
      data: { cohort, epics: createdEpics },
      error: null,
      success: true,
    };
  }

  async getEpics(cohortId: string): Promise<ApiResponse<CohortEpic[]>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohort_epics")
        .select("*")
        .eq("cohort_id", cohortId)
        .order("position", { ascending: true });
    });
  }

  async countStudents(cohortId: string): Promise<number> {
    const { count, error } = await supabase
      .from("cohort_students")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", cohortId);
    if (error) {
      console.error("countStudents error:", error);
      return 0;
    }
    return count ?? 0;
  }
}

export const cohortsService = new CohortsService();
