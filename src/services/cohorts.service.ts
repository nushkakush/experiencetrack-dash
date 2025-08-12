
import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./base.service";
import { ApiResponse } from "@/types/common";
import { Cohort, CohortEpic, NewCohortInput, NewEpicInput, CohortWithCounts } from "@/types/cohort";
import { Logger } from "@/lib/logging/Logger";

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
    try {
      // First get all cohorts
      const { data: cohorts, error: cohortsError } = await supabase
        .from("cohorts")
        .select("*")
        .order("created_at", { ascending: false });

      if (cohortsError) {
        Logger.getInstance().error('listAllWithCounts: Cohorts query error', { error: cohortsError });
        throw cohortsError;
      }

      if (!cohorts || cohorts.length === 0) {
        return {
          data: [],
          error: null,
          success: true,
        };
      }

      // Then get student counts for all cohorts
      const cohortIds = cohorts.map(c => c.id);

      const { data: studentCounts, error: countsError } = await supabase
        .from("cohort_students")
        .select("cohort_id")
        .in("cohort_id", cohortIds);

      if (countsError) {
        Logger.getInstance().error('listAllWithCounts: Student counts query error', { error: countsError });
        throw countsError;
      }

      // Count students per cohort
      const countMap = new Map<string, number>();
      
      studentCounts?.forEach((student) => {
        const currentCount = countMap.get(student.cohort_id) || 0;
        const newCount = currentCount + 1;
        countMap.set(student.cohort_id, newCount);
      });

      // Transform the data to include students_count
      const cohortsWithCounts: CohortWithCounts[] = cohorts.map((cohort) => {
        const students_count = countMap.get(cohort.id) || 0;
        return {
          ...cohort,
          students_count
        };
      });

      return {
        data: cohortsWithCounts,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('listAllWithCounts: Caught error', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch cohorts with counts',
        success: false,
      };
    }
  }

  async getById(id: string): Promise<ApiResponse<Cohort>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohorts")
        .select("*")
        .eq("id", id)
        .single();
    });
  }

  async getByIdWithCounts(id: string): Promise<ApiResponse<CohortWithCounts>> {
    try {
      const { data: cohort, error: cohortError } = await supabase
        .from("cohorts")
        .select("*")
        .eq("id", id)
        .single();

      if (cohortError) throw cohortError;

      const { data: students, error: studentsError } = await supabase
        .from("cohort_students")
        .select("id")
        .eq("cohort_id", id);

      if (studentsError) throw studentsError;

      const cohortWithCounts: CohortWithCounts = {
        ...cohort,
        students_count: students?.length || 0,
      };

      return {
        data: cohortWithCounts,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch cohort with counts',
        success: false,
      };
    }
  }

  async isCohortIdUnique(cohort_id: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from("cohorts")
        .select("id")
        .eq("cohort_id", cohort_id);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return !data || data.length === 0;
    } catch (error) {
      Logger.getInstance().error('Error checking cohort ID uniqueness', { error, cohort_id, excludeId });
      return false;
    }
  }

  async createWithEpics(input: NewCohortInput, epics: NewEpicInput[]): Promise<ApiResponse<{ cohort: Cohort; epics: CohortEpic[] }>> {
    return this["executeQuery"](async () => {
      // Create cohort first
      const { data: cohort, error: cohortError } = await supabase
        .from("cohorts")
        .insert(input)
        .select()
        .single();

      if (cohortError) throw cohortError;

      // Create epics
      const epicsWithCohortId = epics.map(epic => ({
        ...epic,
        cohort_id: cohort.id
      }));

      const { data: createdEpics, error: epicsError } = await supabase
        .from("cohort_epics")
        .insert(epicsWithCohortId)
        .select();

      if (epicsError) throw epicsError;

      return {
        data: {
          cohort,
          epics: createdEpics || []
        },
        error: null
      };
    });
  }

  async getEpics(cohortId: string): Promise<ApiResponse<CohortEpic[]>> {
    return this["executeQuery"](async () => {
      return await supabase
        .from("cohort_epics")
        .select("*")
        .eq("cohort_id", cohortId)
        .order("created_at", { ascending: true });
    });
  }

  async countStudents(cohortId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("cohort_students")
        .select("*", { count: "exact", head: true })
        .eq("cohort_id", cohortId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      Logger.getInstance().error('Error counting students', { error, cohortId });
      return 0;
    }
  }

  async deleteCohort(id: string): Promise<ApiResponse<null>> {
    return this["executeQuery"](async () => {
      // Delete related data first (cohort_epics, cohort_students, etc.)
      // Note: This should be handled by database cascade deletes, but we'll be explicit here
      
      // Delete cohort epics
      await supabase
        .from("cohort_epics")
        .delete()
        .eq("cohort_id", id);

      // Delete cohort students
      await supabase
        .from("cohort_students")
        .delete()
        .eq("cohort_id", id);

      // Delete attendance records
      await supabase
        .from("attendance_records")
        .delete()
        .eq("cohort_id", id);

      // Delete cancelled sessions
      await supabase
        .from("cancelled_sessions")
        .delete()
        .eq("cohort_id", id);

      // Finally delete the cohort
      return await supabase
        .from("cohorts")
        .delete()
        .eq("id", id);
    });
  }
}

export const cohortsService = new CohortsService();
