import { supabase } from '@/integrations/supabase/client';
import {
  PaymentCallLog,
  CreatePaymentCallLogRequest,
  UpdatePaymentCallLogRequest,
  PaymentCallLogFilters,
  CallLogStats,
} from '@/types/payments/callLogs';

export class PaymentCallLogsService {
  /**
   * Create a new call log entry
   */
  static async createCallLog(
    data: Omit<CreatePaymentCallLogRequest, 'recorded_by'>
  ): Promise<PaymentCallLog> {
    // Get the current user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const callLogData: CreatePaymentCallLogRequest = {
      ...data,
      recorded_by: user.id,
    };

    const { data: callLog, error } = await supabase
      .from('payment_call_logs')
      .insert(callLogData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create call log: ${error.message}`);
    }

    return callLog;
  }

  /**
   * Get call logs for a specific student and installment
   */
  static async getCallLogsByInstallment(
    studentId: string,
    semesterNumber: number,
    installmentNumber: number
  ): Promise<PaymentCallLog[]> {
    const { data: callLogs, error } = await supabase
      .from('payment_call_logs')
      .select('*')
      .eq('student_id', studentId)
      .eq('semester_number', semesterNumber)
      .eq('installment_number', installmentNumber)
      .order('call_date', { ascending: false })
      .order('call_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch call logs: ${error.message}`);
    }

    return callLogs || [];
  }

  /**
   * Get call logs with filters
   */
  static async getCallLogs(
    filters: PaymentCallLogFilters = {}
  ): Promise<PaymentCallLog[]> {
    let query = supabase.from('payment_call_logs').select('*');

    if (filters.student_id) {
      query = query.eq('student_id', filters.student_id);
    }

    if (filters.semester_number !== undefined) {
      query = query.eq('semester_number', filters.semester_number);
    }

    if (filters.installment_number !== undefined) {
      query = query.eq('installment_number', filters.installment_number);
    }

    if (filters.call_date_from) {
      query = query.gte('call_date', filters.call_date_from);
    }

    if (filters.call_date_to) {
      query = query.lte('call_date', filters.call_date_to);
    }

    if (filters.call_type) {
      query = query.eq('call_type', filters.call_type);
    }

    if (filters.recorded_by) {
      query = query.eq('recorded_by', filters.recorded_by);
    }

    const { data: callLogs, error } = await query
      .order('call_date', { ascending: false })
      .order('call_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch call logs: ${error.message}`);
    }

    return callLogs || [];
  }

  /**
   * Get a specific call log by ID
   */
  static async getCallLogById(id: string): Promise<PaymentCallLog> {
    const { data: callLog, error } = await supabase
      .from('payment_call_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch call log: ${error.message}`);
    }

    return callLog;
  }

  /**
   * Update a call log entry
   */
  static async updateCallLog(
    data: UpdatePaymentCallLogRequest
  ): Promise<PaymentCallLog> {
    const { id, ...updateData } = data;

    const { data: callLog, error } = await supabase
      .from('payment_call_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update call log: ${error.message}`);
    }

    return callLog;
  }

  /**
   * Delete a call log entry
   */
  static async deleteCallLog(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_call_logs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete call log: ${error.message}`);
    }
  }

  /**
   * Get call statistics for a student
   */
  static async getCallStats(studentId: string): Promise<CallLogStats> {
    const { data: callLogs, error } = await supabase
      .from('payment_call_logs')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to fetch call stats: ${error.message}`);
    }

    const logs = callLogs || [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const stats: CallLogStats = {
      total_calls: logs.length,
      incoming_calls: logs.filter(log => log.call_type === 'incoming').length,
      outgoing_calls: logs.filter(log => log.call_type === 'outgoing').length,
      average_duration:
        logs.length > 0
          ? logs.reduce(
              (sum, log) => sum + (log.call_duration_minutes || 0),
              0
            ) / logs.length
          : 0,
      calls_this_month: logs.filter(log => {
        const callDate = new Date(log.call_date);
        return (
          callDate.getMonth() === thisMonth &&
          callDate.getFullYear() === thisYear
        );
      }).length,
      pending_follow_ups: logs.filter(log => {
        if (!log.next_follow_up_date) return false;
        const followUpDate = new Date(log.next_follow_up_date);
        return followUpDate > now;
      }).length,
    };

    return stats;
  }

  /**
   * Get upcoming follow-ups for a fee collector
   */
  static async getUpcomingFollowUps(
    recordedBy?: string
  ): Promise<PaymentCallLog[]> {
    let query = supabase
      .from('payment_call_logs')
      .select('*')
      .not('next_follow_up_date', 'is', null)
      .gte('next_follow_up_date', new Date().toISOString().split('T')[0])
      .order('next_follow_up_date', { ascending: true })
      .order('next_follow_up_time', { ascending: true });

    if (recordedBy) {
      query = query.eq('recorded_by', recordedBy);
    }

    const { data: followUps, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch upcoming follow-ups: ${error.message}`);
    }

    return followUps || [];
  }
}
