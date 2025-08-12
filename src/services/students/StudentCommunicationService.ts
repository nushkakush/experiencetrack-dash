/**
 * Student Communication Service
 * Handles student communication operations with single responsibility
 */

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { 
  CommunicationHistory,
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus
} from '@/types/payments';
import { Logger } from '@/lib/logging/Logger';

export interface CommunicationFilters {
  studentId?: string;
  type?: CommunicationType;
  channel?: CommunicationChannel;
  status?: CommunicationStatus;
  dateFrom?: string;
  dateTo?: string;
}

class StudentCommunicationService {
  /**
   * Get communication history for a student
   */
  async getCommunicationHistory(studentId: string): Promise<ApiResponse<CommunicationHistory[]>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .select('*')
        .eq('student_id', studentId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      return {
        data: data as CommunicationHistory[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching communication history', { error, studentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication history',
        success: false,
      };
    }
  }

  /**
   * Send communication to a student
   */
  async sendCommunication(
    studentId: string,
    type: CommunicationType,
    channel: CommunicationChannel,
    subject: string,
    message: string
  ): Promise<ApiResponse<CommunicationHistory>> {
    try {
      const communicationData = {
        student_id: studentId,
        type,
        channel,
        subject,
        message,
        sent_at: new Date().toISOString(),
        status: 'sent' as CommunicationStatus,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase
        .from('communication_history')
        .insert(communicationData)
        .select('*')
        .single();

      if (error) throw error;

      return {
        data: data as CommunicationHistory,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error sending communication', { error, studentId, type, channel });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send communication',
        success: false,
      };
    }
  }

  /**
   * Update communication status
   */
  async updateCommunicationStatus(
    communicationId: string,
    status: CommunicationStatus
  ): Promise<ApiResponse<CommunicationHistory>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', communicationId)
        .select('*')
        .single();

      if (error) throw error;

      return {
        data: data as CommunicationHistory,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error updating communication status', { error, communicationId, status });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update communication status',
        success: false,
      };
    }
  }

  /**
   * Get communication history with filters
   */
  async getCommunicationHistoryWithFilters(filters: CommunicationFilters): Promise<ApiResponse<CommunicationHistory[]>> {
    try {
      let query = supabase
        .from('communication_history')
        .select('*');

      if (filters.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.channel) {
        query = query.eq('channel', filters.channel);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('sent_at', filters.dateTo);
      }

      query = query.order('sent_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data as CommunicationHistory[],
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching communication history with filters', { error, filters });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication history',
        success: false,
      };
    }
  }

  /**
   * Send bulk communication to multiple students
   */
  async sendBulkCommunication(
    studentIds: string[],
    type: CommunicationType,
    channel: CommunicationChannel,
    subject: string,
    message: string
  ): Promise<ApiResponse<{ success: boolean; sentCount: number; failedCount: number }>> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const communications = studentIds.map(studentId => ({
        student_id: studentId,
        type,
        channel,
        subject,
        message,
        sent_at: new Date().toISOString(),
        status: 'sent' as CommunicationStatus,
        created_by: userId
      }));

      const { data, error } = await supabase
        .from('communication_history')
        .insert(communications)
        .select('*');

      if (error) throw error;

      return {
        data: {
          success: true,
          sentCount: data?.length || 0,
          failedCount: studentIds.length - (data?.length || 0)
        },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error sending bulk communication', { error, studentIds, type, channel });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send bulk communication',
        success: false,
      };
    }
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStatistics(studentId?: string): Promise<ApiResponse<{
    totalCommunications: number;
    byType: Record<CommunicationType, number>;
    byChannel: Record<CommunicationChannel, number>;
    byStatus: Record<CommunicationStatus, number>;
    recentCommunications: CommunicationHistory[];
  }>> {
    try {
      let query = supabase.from('communication_history').select('*');
      
      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const communications = data as CommunicationHistory[];

      const byType = communications.reduce((acc, comm) => {
        acc[comm.type] = (acc[comm.type] || 0) + 1;
        return acc;
      }, {} as Record<CommunicationType, number>);

      const byChannel = communications.reduce((acc, comm) => {
        acc[comm.channel] = (acc[comm.channel] || 0) + 1;
        return acc;
      }, {} as Record<CommunicationChannel, number>);

      const byStatus = communications.reduce((acc, comm) => {
        acc[comm.status] = (acc[comm.status] || 0) + 1;
        return acc;
      }, {} as Record<CommunicationStatus, number>);

      const recentCommunications = communications
        .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .slice(0, 10);

      return {
        data: {
          totalCommunications: communications.length,
          byType,
          byChannel,
          byStatus,
          recentCommunications
        },
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('Error fetching communication statistics', { error, studentId });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch communication statistics',
        success: false,
      };
    }
  }
}

export const studentCommunicationService = new StudentCommunicationService();
