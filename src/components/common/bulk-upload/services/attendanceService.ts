import { supabase } from '@/integrations/supabase/client';
import {
  BulkAttendanceUpload,
  BulkAttendanceConfig,
  AttendanceTemplateData,
} from '../types/attendance';
import { toast } from 'sonner';

export class BulkAttendanceService {
  static async generateTemplateData(
    config: BulkAttendanceConfig
  ): Promise<string> {
    try {
      // Fetch students for this cohort
      const { data: students, error } = await supabase
        .from('cohort_students')
        .select('email, first_name, last_name')
        .eq('cohort_id', config.cohortId)
        .neq('dropped_out_status', 'dropped_out')
        .order('first_name');

      if (error) throw error;

      // Fetch epic details
      const { data: epic, error: epicError } = await supabase
        .from('cohort_epics')
        .select('name')
        .eq('id', config.epicId)
        .single();

      if (epicError) throw epicError;

      // Create CSV headers
      const headers = [
        'student_email',
        'session_date',
        'session_number',
        'status',
        'reason',
        'absence_type',
      ];

      // Generate dates between start and end date
      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);
      const dates: string[] = [];

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d).toISOString().split('T')[0]); // YYYY-MM-DD format
      }

      // Create sample rows for each student, date, and session
      const rows: string[] = [];

      students?.forEach(student => {
        dates.forEach(date => {
          for (let session = 1; session <= config.sessionsPerDay; session++) {
            rows.push(`${student.email},${date},${session},present,,`);
          }
        });
      });

      const csvContent = `${headers.join(',')}\n${rows.join('\n')}`;
      return csvContent;
    } catch (error) {
      console.error('Error generating template data:', error);
      throw new Error('Failed to generate template data');
    }
  }

  static validateAttendanceRow(
    data: Record<string, unknown>,
    row: number
  ): string[] {
    const errors: string[] = [];

    // Validate student_email
    if (!data.student_email || !data.student_email.trim()) {
      errors.push('Student email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.student_email)) {
      errors.push('Invalid email format');
    }

    // Validate session_date
    if (!data.session_date || !data.session_date.trim()) {
      errors.push('Session date is required');
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.session_date)) {
        errors.push('Session date must be in YYYY-MM-DD format');
      } else {
        const date = new Date(data.session_date);
        if (isNaN(date.getTime())) {
          errors.push('Invalid session date');
        }
      }
    }

    // Validate session_number
    const sessionNumber = parseInt(data.session_number);
    if (isNaN(sessionNumber) || sessionNumber < 1) {
      errors.push('Session number must be a positive integer');
    }

    // Validate status
    const validStatuses = ['present', 'absent', 'late'];
    if (!data.status || !validStatuses.includes(data.status.toLowerCase())) {
      errors.push('Status must be one of: present, absent, late');
    }

    // Validate reason (required for absent/late)
    if (
      (data.status === 'absent' || data.status === 'late') &&
      !data.reason?.trim()
    ) {
      errors.push('Reason is required for absent or late status');
    }

    // Validate absence_type (required for absent)
    if (data.status === 'absent') {
      const validAbsenceTypes = ['informed', 'uninformed', 'exempted'];
      if (
        !data.absence_type ||
        !validAbsenceTypes.includes(data.absence_type.toLowerCase())
      ) {
        errors.push(
          'Absence type must be one of: informed, uninformed, exempted'
        );
      }
    }

    return errors;
  }

  static async checkDuplicateAttendance(
    data: BulkAttendanceUpload[],
    config: BulkAttendanceConfig
  ): Promise<
    Array<{
      data: BulkAttendanceUpload;
      row: number;
      existingData?: Record<string, unknown>;
    }>
  > {
    try {
      const duplicates: Array<{
        data: BulkAttendanceUpload;
        row: number;
        existingData?: Record<string, unknown>;
      }> = [];

      for (let i = 0; i < data.length; i++) {
        const record = data[i];

        // Check if attendance record already exists
        const { data: existingRecord, error } = await supabase
          .from('attendance_records')
          .select('*')
          .eq('cohort_id', config.cohortId)
          .eq('epic_id', config.epicId)
          .eq('session_number', record.session_number)
          .eq('session_date', record.session_date)
          .eq(
            'student_id',
            `(SELECT id FROM cohort_students WHERE email = '${record.student_email}' AND cohort_id = '${config.cohortId}')`
          )
          .single();

        if (existingRecord && !error) {
          duplicates.push({
            data: record,
            row: i + 2, // +2 because CSV has header and arrays are 0-indexed
            existingData: existingRecord,
          });
        }
      }

      return duplicates;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  }

  static async processValidAttendance(
    data: BulkAttendanceUpload[],
    config: BulkAttendanceConfig,
    duplicateHandling: 'ignore' | 'overwrite'
  ): Promise<{ success: boolean; message: string }> {
    try {
      let processedCount = 0;
      let skippedCount = 0;

      for (const record of data) {
        // Get student ID from email
        const { data: student, error: studentError } = await supabase
          .from('cohort_students')
          .select('id')
          .eq('email', record.student_email)
          .eq('cohort_id', config.cohortId)
          .single();

        if (studentError || !student) {
          console.error(`Student not found: ${record.student_email}`);
          continue;
        }

        // Check if record already exists
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('cohort_id', config.cohortId)
          .eq('epic_id', config.epicId)
          .eq('session_number', record.session_number)
          .eq('session_date', record.session_date)
          .eq('student_id', student.id)
          .single();

        if (existingRecord) {
          if (duplicateHandling === 'ignore') {
            skippedCount++;
            continue;
          } else {
            // Overwrite existing record
            const { error: updateError } = await supabase
              .from('attendance_records')
              .update({
                status: record.status,
                reason: record.reason || null,
                absence_type: record.absence_type || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingRecord.id);

            if (updateError) {
              console.error('Error updating attendance record:', updateError);
              continue;
            }
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('attendance_records')
            .insert({
              cohort_id: config.cohortId,
              epic_id: config.epicId,
              student_id: student.id,
              session_number: record.session_number,
              session_date: config.sessionDate,
              status: record.status,
              reason: record.reason || null,
              absence_type: record.absence_type || null,
            });

          if (insertError) {
            console.error('Error inserting attendance record:', insertError);
            continue;
          }
        }

        processedCount++;
      }

      const message = `Successfully processed ${processedCount} attendance records${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`;
      return { success: true, message };
    } catch (error) {
      console.error('Error processing attendance data:', error);
      return { success: false, message: 'Failed to process attendance data' };
    }
  }
}
