import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '@/types/common';
import { CommunicationHistoryRow } from '@/types/payments/DatabaseAlignedTypes';
import { Logger } from '@/lib/logging/Logger';

// Type aliases for backward compatibility
type CommunicationHistory = CommunicationHistoryRow;

export class CommunicationService {
  async sendCommunication(
    studentId: string,
    type: CommunicationHistory['type'],
    channel: CommunicationHistory['channel'],
    subject: string,
    message: string
  ): Promise<ApiResponse<CommunicationHistory>> {
    try {
      const { data, error } = await supabase
        .from('communication_history')
        .insert({
          student_id: studentId,
          type: type,
          channel: channel,
          subject: subject,
          message: message,
          sent_at: new Date().toISOString(),
          status: 'sent',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as CommunicationHistory,
        error: null,
        success: true,
      };
    } catch (error) {
      Logger.getInstance().error('CommunicationService: Error sending communication', { error });
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send communication',
        success: false,
      };
    }
  }
}
