export interface PaymentCallLog {
  id: string;
  student_id: string;
  semester_number: number;
  installment_number: number;
  call_date: string;
  call_time: string;
  call_duration_minutes?: number;
  call_type: 'incoming' | 'outgoing';
  discussion_summary: string;
  next_follow_up_date?: string;
  next_follow_up_time?: string;
  follow_up_notes?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentCallLogRequest {
  student_id: string;
  semester_number: number;
  installment_number: number;
  call_date: string;
  call_time: string;
  call_duration_minutes?: number;
  call_type: 'incoming' | 'outgoing';
  discussion_summary: string;
  next_follow_up_date?: string;
  next_follow_up_time?: string;
  follow_up_notes?: string;
  recorded_by: string;
}

export interface UpdatePaymentCallLogRequest
  extends Partial<CreatePaymentCallLogRequest> {
  id: string;
}

export interface PaymentCallLogFilters {
  student_id?: string;
  semester_number?: number;
  installment_number?: number;
  call_date_from?: string;
  call_date_to?: string;
  call_type?: 'incoming' | 'outgoing';
  recorded_by?: string;
}

export interface CallLogStats {
  total_calls: number;
  incoming_calls: number;
  outgoing_calls: number;
  average_duration: number;
  calls_this_month: number;
  pending_follow_ups: number;
}
