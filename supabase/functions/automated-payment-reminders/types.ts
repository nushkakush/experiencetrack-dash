export interface TestReminderData {
  student_id: string;
  student_email: string;
  student_name: string;
  test_message: string;
}

export interface PaymentReminderData {
  student_id: string;
  student_email: string;
  student_name: string;
  payment_id: string;
  due_date: string;
  installment_number: string;
  days_remaining: number;
  days_overdue: number;
  reminder_type: string;
}

export interface DueDate {
  id: string;
  student_id: string;
  payment_id: string;
  due_date: string;
  installment_number: number;
  semester_number: number;
  payment_type: string;
}

export interface ReminderResult {
  student_id: string;
  email: string;
  payment_id?: string;
  reminder_type?: string;
  success: boolean;
  message: string;
}

export interface CommunicationLog {
  channel: string;
  type: string;
  recipient_email: string;
  recipient_phone: string | null;
  subject: string;
  content: string;
  context: any;
  status: string;
  sent_at: string;
}
