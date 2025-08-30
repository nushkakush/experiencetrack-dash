import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  LeaveApplication,
  CreateLeaveApplicationRequest,
  UpdateLeaveApplicationRequest,
  LeaveApplicationStats,
} from '@/types/attendance';

export class LeaveApplicationService {
  // Create a new leave application
  static async createLeaveApplication(
    data: CreateLeaveApplicationRequest
  ): Promise<LeaveApplication> {
    const { data: result, error } = await supabase
      .from('leave_applications')
      .insert({
        student_id: data.student_id,
        cohort_id: data.cohort_id,
        epic_id: data.epic_id,
        session_date: data.session_date,
        end_date: data.end_date,
        is_date_range: data.is_date_range,
        session_number: data.session_number || 1,
        reason: data.reason,
        leave_status: 'pending',
        leave_applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave application: ${error.message}`);
    }

    return result;
  }

  // Get leave applications for a student
  static async getStudentLeaveApplications(
    studentId: string
  ): Promise<LeaveApplication[]> {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(
        `
        id,
        student_id,
        cohort_id,
        epic_id,
        session_date,
        end_date,
        is_date_range,
        session_number,
        reason,
        leave_status,
        leave_applied_at,
        leave_approved_by,
        leave_approved_at,
        leave_rejection_reason,
        created_at,
        updated_at
      `
      )
      .eq('student_id', studentId)
      .order('session_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch leave applications: ${error.message}`);
    }

    return data || [];
  }

  // Get pending leave applications for program managers
  static async getPendingLeaveApplications(
    cohortId?: string
  ): Promise<LeaveApplication[]> {
    let query = supabase
      .from('leave_applications')
      .select(
        `
        id,
        student_id,
        cohort_id,
        epic_id,
        session_date,
        end_date,
        is_date_range,
        session_number,
        reason,
        leave_status,
        leave_applied_at,
        leave_approved_by,
        leave_approved_at,
        leave_rejection_reason,
        created_at,
        updated_at,
        cohort_students!inner(first_name, last_name, email),
        cohorts!inner(name)
      `
      )
      .eq('leave_status', 'pending')
      .order('leave_applied_at', { ascending: true });

    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch pending leave applications: ${error.message}`
      );
    }

    return data || [];
  }

  // Get all leave applications for program managers (for "All Applications" tab)
  static async getAllLeaveApplications(
    cohortId?: string
  ): Promise<LeaveApplication[]> {
    let query = supabase
      .from('leave_applications')
      .select(
        `
        id,
        student_id,
        cohort_id,
        epic_id,
        session_date,
        end_date,
        is_date_range,
        session_number,
        reason,
        leave_status,
        leave_applied_at,
        leave_approved_by,
        leave_approved_at,
        leave_rejection_reason,
        created_at,
        updated_at,
        cohort_students!inner(first_name, last_name, email),
        cohorts!inner(name)
      `
      )
      .order('leave_applied_at', { ascending: false });

    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch all leave applications: ${error.message}`
      );
    }

    return data || [];
  }

  // Update leave application status (approve/reject)
  static async updateLeaveApplication(
    id: string,
    data: UpdateLeaveApplicationRequest,
    approvedBy: string
  ): Promise<LeaveApplication> {
    // First, get the leave application details to mark attendance
    const { data: leaveApp, error: fetchError } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(
        `Failed to fetch leave application: ${fetchError.message}`
      );
    }

    const updateData: any = {
      leave_status: data.leave_status,
      leave_approved_by: approvedBy,
      leave_approved_at: new Date().toISOString(),
    };

    if (data.leave_status === 'rejected' && data.leave_rejection_reason) {
      updateData.leave_rejection_reason = data.leave_rejection_reason;
    }

    const { data: result, error } = await supabase
      .from('leave_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update leave application: ${error.message}`);
    }

    // If leave is approved, automatically mark student as informed absent
    if (data.leave_status === 'approved' && leaveApp) {
      try {
        // First, get the cohort_epics.id from the epic_id
        const { data: cohortEpic, error: cohortEpicError } = await supabase
          .from('cohort_epics')
          .select('id')
          .eq('cohort_id', leaveApp.cohort_id)
          .eq('epic_id', leaveApp.epic_id)
          .single();

        if (cohortEpicError) {
          console.error(
            'Error fetching cohort_epics for attendance marking:',
            cohortEpicError
          );
          return result; // Return the approved leave application even if attendance marking fails
        }

        // Determine the dates to mark attendance for
        const datesToMark = [];
        if (leaveApp.is_date_range && leaveApp.end_date) {
          // For date range applications, mark attendance for all dates in the range
          const startDate = new Date(leaveApp.session_date);
          const endDate = new Date(leaveApp.end_date);
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            datesToMark.push(format(currentDate, 'yyyy-MM-dd'));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          // For single date applications, mark attendance for just that date
          datesToMark.push(leaveApp.session_date);
        }

        // Mark attendance for all relevant dates
        for (const sessionDate of datesToMark) {
          const { data: attendanceResult, error: attendanceError } =
            await supabase.rpc('mark_student_attendance', {
              p_cohort_id: leaveApp.cohort_id,
              p_epic_id: cohortEpic.id, // Use cohort_epics.id instead of epics.id
              p_session_number: leaveApp.session_number,
              p_session_date: sessionDate,
              p_student_id: leaveApp.student_id,
              p_status: 'absent',
              p_absence_type: 'informed',
              p_reason: leaveApp.reason,
            });

          if (attendanceError) {
            console.error(
              `Error marking attendance for ${sessionDate}:`,
              attendanceError
            );
            // Continue with other dates even if one fails
          } else {
            console.log(
              `Successfully marked student as informed absent for ${sessionDate}:`,
              attendanceResult
            );
          }
        }
      } catch (attendanceError) {
        console.error(
          'Exception while marking attendance for approved leave:',
          attendanceError
        );
        // Don't throw error here as the leave application was already approved
        // Just log the error for debugging
      }
    }

    return result;
  }

  // Get leave application by ID
  static async getLeaveApplication(id: string): Promise<LeaveApplication> {
    const { data, error } = await supabase
      .from('leave_applications')
      .select(
        `
        id,
        student_id,
        cohort_id,
        epic_id,
        session_date,
        end_date,
        is_date_range,
        session_number,
        reason,
        leave_status,
        leave_applied_at,
        leave_approved_by,
        leave_approved_at,
        leave_rejection_reason,
        created_at,
        updated_at,
        cohort_students!inner(first_name, last_name, email),
        cohorts!inner(name)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch leave application: ${error.message}`);
    }

    return data;
  }

  // Get leave application statistics
  static async getLeaveApplicationStats(
    cohortId?: string
  ): Promise<LeaveApplicationStats> {
    let query = supabase.from('leave_applications').select('leave_status');

    if (cohortId) {
      query = query.eq('cohort_id', cohortId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch leave application stats: ${error.message}`
      );
    }

    const stats: LeaveApplicationStats = {
      total_applications: data?.length || 0,
      pending_applications:
        data?.filter(item => item.leave_status === 'pending').length || 0,
      approved_applications:
        data?.filter(item => item.leave_status === 'approved').length || 0,
      rejected_applications:
        data?.filter(item => item.leave_status === 'rejected').length || 0,
    };

    return stats;
  }

  // Delete leave application (only if pending)
  static async deleteLeaveApplication(id: string): Promise<void> {
    const { error } = await supabase
      .from('leave_applications')
      .delete()
      .eq('id', id)
      .eq('leave_status', 'pending');

    if (error) {
      throw new Error(`Failed to delete leave application: ${error.message}`);
    }
  }
}
