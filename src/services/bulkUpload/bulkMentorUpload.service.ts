import { supabase } from '@/integrations/supabase/client';
import { CreateMentorData } from '@/types/mentor';

export interface BulkMentorUpload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  experience_years?: number;
  current_company?: string;
  designation?: string;
  linkedin_url?: string;
  bio?: string;
  internal_notes?: string;
  status?: 'active' | 'inactive' | 'on_leave';
}

export interface BulkMentorUploadResult {
  success: boolean;
  mentorId?: string;
  email: string;
  error?: string;
}

export class BulkMentorUploadService {
  /**
   * Validate a single mentor upload row
   */
  static validateMentorRow(data: any, row: number): string[] {
    const errors: string[] = [];

    // Required fields
    if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim() === '') {
      errors.push(`Row ${row}: First name is required`);
    }

    if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim() === '') {
      errors.push(`Row ${row}: Last name is required`);
    }

    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push(`Row ${row}: Email is required`);
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.push(`Row ${row}: Invalid email format`);
      }
    }

    // Optional field validations
    if (data.phone && typeof data.phone !== 'string') {
      errors.push(`Row ${row}: Phone must be a string`);
    }

    if (data.experience_years !== undefined && data.experience_years !== '') {
      const years = Number(data.experience_years);
      if (isNaN(years) || years < 0 || years > 100) {
        errors.push(`Row ${row}: Experience years must be a number between 0 and 100`);
      }
    }

    if (data.status && !['active', 'inactive', 'on_leave'].includes(data.status)) {
      errors.push(`Row ${row}: Status must be one of: active, inactive, on_leave`);
    }

    return errors;
  }

  /**
   * Check for duplicate mentors by email
   */
  static async checkDuplicateMentors(
    data: BulkMentorUpload[]
  ): Promise<Array<{ data: BulkMentorUpload; row: number; existingData?: any }>> {
    const duplicates: Array<{ data: BulkMentorUpload; row: number; existingData?: any }> = [];

    try {
      // Get all existing mentor emails
      const { data: existingMentors, error } = await supabase
        .from('mentors')
        .select('email');

      if (error) {
        console.error('Error fetching existing mentors:', error);
        return duplicates;
      }

      const existingEmails = new Set(existingMentors?.map(m => m.email.toLowerCase()) || []);

      // Check for duplicates in the upload data
      data.forEach((mentor, index) => {
        if (existingEmails.has(mentor.email.toLowerCase())) {
          duplicates.push({
            data: mentor,
            row: index + 1,
            existingData: existingMentors?.find(m => m.email.toLowerCase() === mentor.email.toLowerCase())
          });
        }
      });

    } catch (error) {
      console.error('Error checking duplicates:', error);
    }

    return duplicates;
  }

  /**
   * Process valid mentor upload data
   */
  static async processMentorUpload(
    data: BulkMentorUpload[],
    createdByUserId: string,
    duplicateHandling: 'ignore' | 'overwrite' = 'ignore'
  ): Promise<{ success: boolean; message: string; results: BulkMentorUploadResult[] }> {
    const results: BulkMentorUploadResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const mentorData of data) {
        try {
          // Prepare the mentor data
          const mentorPayload: CreateMentorData = {
            email: mentorData.email.trim(),
            first_name: mentorData.first_name.trim(),
            last_name: mentorData.last_name.trim(),
            phone: mentorData.phone?.trim() || undefined,
            specialization: mentorData.specialization?.trim() || undefined,
            experience_years: mentorData.experience_years ? Number(mentorData.experience_years) : undefined,
            current_company: mentorData.current_company?.trim() || undefined,
            designation: mentorData.designation?.trim() || undefined,
            linkedin_url: mentorData.linkedin_url?.trim() || undefined,
            bio: mentorData.bio?.trim() || undefined,
            internal_notes: mentorData.internal_notes?.trim() || undefined,
          };

          // Insert mentor into database
          const { data: insertedMentor, error: insertError } = await supabase
            .from('mentors')
            .insert({
              ...mentorPayload,
              created_by: createdByUserId,
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }

          // Set status if provided
          if (mentorData.status && insertedMentor) {
            await supabase
              .from('mentors')
              .update({ status: mentorData.status })
              .eq('id', insertedMentor.id);
          }

          results.push({
            success: true,
            mentorId: insertedMentor.id,
            email: mentorData.email,
          });

          successCount++;

        } catch (error: any) {
          console.error(`Error processing mentor ${mentorData.email}:`, error);
          results.push({
            success: false,
            email: mentorData.email,
            error: error.message || 'Unknown error',
          });
          errorCount++;
        }
      }

      const message = `Import completed: ${successCount} mentors added successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`;

      return {
        success: errorCount === 0,
        message,
        results,
      };

    } catch (error: any) {
      console.error('Bulk mentor upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error.message}`,
        results,
      };
    }
  }
}
