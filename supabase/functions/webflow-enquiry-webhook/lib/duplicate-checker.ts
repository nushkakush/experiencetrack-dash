import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Check for duplicate enquiries in the database
 */
export class DuplicateChecker {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Check if an enquiry already exists based on email and Webflow submission date
   */
  async checkExistingEnquiry(
    email: string,
    submittedAt: string
  ): Promise<boolean> {
    try {
      // Direct database query to get ALL enquiries for this email (bypasses pagination)
      const { data: enquiries, error } = await this.supabase
        .from('enquiries')
        .select('email, wf_created_at')
        .eq('email', email);

      if (error) {
        console.error('Error fetching enquiries for duplicate check:', error);
        return false;
      }

      if (!enquiries || enquiries.length === 0) {
        return false;
      }

      const submissionDate = new Date(submittedAt);

      // Check for exact duplicates: same email and same wf_created_at (Webflow submission date)
      const exactDuplicate = enquiries.some(enquiry => {
        if (!enquiry.wf_created_at) return false;
        const enquiryWfDate = new Date(enquiry.wf_created_at);
        const timeDiff = Math.abs(
          submissionDate.getTime() - enquiryWfDate.getTime()
        );
        return timeDiff < 60000; // Within 1 minute (more precise)
      });

      if (exactDuplicate) {
        console.log(
          `Found exact duplicate for email ${email} at ${submittedAt}`
        );
        return true;
      }

      // Check for potential duplicates: same email and same day (using wf_created_at)
      const sameDayDuplicate = enquiries.some(enquiry => {
        if (!enquiry.wf_created_at) return false;
        const enquiryWfDate = new Date(enquiry.wf_created_at);
        return enquiryWfDate.toDateString() === submissionDate.toDateString();
      });

      if (sameDayDuplicate) {
        console.log(
          `Found same-day duplicate for email ${email} on ${submissionDate.toDateString()}`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking existing enquiry:', error);
      return false;
    }
  }

  /**
   * Create enquiry in database
   */
  async createEnquiry(enquiryData: any): Promise<{ data: any; error: any }> {
    return await this.supabase
      .from('enquiries')
      .insert([enquiryData])
      .select()
      .single();
  }
}
