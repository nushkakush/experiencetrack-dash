import { WebflowClient } from 'webflow-api';
import { supabase } from '@/integrations/supabase/client';
import type { CreateEnquiryData } from '@/types/enquiries';

export interface WebflowFormSubmission {
  id: string;
  formId: string;
  siteId: string;
  formResponse: {
    [key: string]: string | number | boolean | undefined;
  };
  dateSubmitted: string;
  formName?: string;
}

export interface WebflowForm {
  id: string;
  displayName: string;
  siteId: string;
  createdOn: string;
  lastUpdated: string;
}

export interface SyncLogEntry {
  submissionId: string;
  formName: string;
  formId: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
  enquiryData?: CreateEnquiryData;
  originalData?: Record<string, unknown>;
}

export interface SyncLogs {
  syncId: string;
  startTime: string;
  endTime: string;
  totalSubmissions: number;
  successful: number;
  errors: number;
  warnings: number;
  skipped: number;
  logs: SyncLogEntry[];
}

export class WebflowService {
  private webflow: WebflowClient | null = null;
  private siteId: string | null = null;
  private initialized: boolean = false;
  private syncLogs: SyncLogs | null = null;

  constructor() {
    // Initialize will be called when first needed
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // Get API token from Supabase secrets
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        'get_secret',
        { secret_key: 'webflow_api_token' }
      );

      if (tokenError) {
        throw new Error(
          `Failed to get Webflow API token: ${tokenError.message}`
        );
      }

      // Get site ID from Supabase secrets
      const { data: siteIdData, error: siteIdError } = await supabase.rpc(
        'get_secret',
        { secret_key: 'webflow_site_id' }
      );

      if (siteIdError) {
        throw new Error(
          `Failed to get Webflow site ID: ${siteIdError.message}`
        );
      }

      if (!tokenData || !siteIdData) {
        throw new Error('Webflow API credentials not found in secrets');
      }

      this.webflow = new WebflowClient({ token: tokenData });
      this.siteId = siteIdData;
      this.initialized = true;

      console.log('WebflowService initialized successfully', {
        tokenLength: tokenData?.length,
        siteId: siteIdData,
        siteIdType: typeof siteIdData,
      });
    } catch (error) {
      console.error('Failed to initialize WebflowService:', error);
      throw new Error(`Webflow API initialization failed: ${error.message}`);
    }
  }

  /**
   * Get all forms for the site
   */
  async getForms(): Promise<WebflowForm[]> {
    await this.initialize();

    try {
      const response = await fetch(
        'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
          },
          body: JSON.stringify({
            action: 'getForms',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.forms || [];
    } catch (error) {
      console.error('Error fetching Webflow forms:', error);
      throw new Error('Failed to fetch Webflow forms');
    }
  }

  /**
   * Get form submissions for a specific form
   */
  async getFormSubmissions(
    formId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<WebflowFormSubmission[]> {
    await this.initialize();

    try {
      const response = await fetch(
        'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
          },
          body: JSON.stringify({
            action: 'getFormSubmissions',
            formId,
            limit,
            offset,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.submissions || [];
    } catch (error) {
      console.error('Error fetching Webflow form submissions:', error);
      throw new Error('Failed to fetch Webflow form submissions');
    }
  }

  /**
   * Get all form submissions across all forms
   */
  async getAllFormSubmissions(): Promise<WebflowFormSubmission[]> {
    await this.initialize();

    try {
      const response = await fetch(
        'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-api',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`,
          },
          body: JSON.stringify({
            action: 'getAllFormSubmissions',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.submissions || [];
    } catch (error) {
      console.error('Error fetching all Webflow form submissions:', error);
      throw new Error('Failed to fetch all Webflow form submissions');
    }
  }

  /**
   * Get the current sync logs
   */
  getSyncLogs(): SyncLogs | null {
    return this.syncLogs;
  }

  /**
   * Clear sync logs
   */
  clearSyncLogs(): void {
    this.syncLogs = null;
  }

  /**
   * Download sync logs as JSON file
   */
  downloadSyncLogs(): void {
    if (!this.syncLogs) {
      console.warn('No sync logs available to download');
      return;
    }

    const dataStr = JSON.stringify(this.syncLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `webflow-sync-logs-${this.syncLogs.syncId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Transform Webflow form submission data to our enquiry format
   */
  transformSubmissionToEnquiry(
    submission: WebflowFormSubmission
  ): CreateEnquiryData | null {
    try {
      const data = submission.formResponse;

      console.log('🔍 Webflow Form Data Debug:', {
        formName: submission.formName,
        formId: submission.formId,
        rawData: data,
        availableKeys: Object.keys(data),
        // Show specific field mappings for debugging
        nameFields: {
          name: data.name,
          'First Name': data['First Name'],
          'Full Name': data['Full Name'],
          firstName: data.firstName,
        },
        emailFields: {
          email: data.email,
          Email: data.Email,
          'Email ID': data['Email ID'],
        },
        phoneFields: {
          phone: data.phone,
          Phone: data.Phone,
          'Phone No．': data['Phone No．'],
        },
      });

      // Check if this is a Program files-Brochure form
      const isProgramBrochureForm =
        submission.formName === 'Program files-Brochure';

      let enquiryData: CreateEnquiryData;

      if (isProgramBrochureForm) {
        // Special mapping for Program files-Brochure form
        enquiryData = {
          full_name: data['First Name'] || '',
          email: data['Email'] || '',
          phone: data['Phone'] || '',
          // For Program files-Brochure, we don't have date_of_birth, so use a default
          date_of_birth: new Date().toISOString().split('T')[0], // fallback to today
          // Age is directly available from Webflow
          age: this.parseAge(data['Age']),
          // Professional status mapping
          professional_status: this.mapProfessionalStatus(
            data['You are currently a'] || ''
          ),
          // For Program files-Brochure, set default values for fields not present
          relocation_possible: 'Maybe', // Default since not in form
          investment_willing: 'Maybe', // Default since not in form
          // No gender, location, or career_goals in Program files-Brochure form
          gender: undefined,
          location: undefined,
          career_goals: undefined,
          status: 'active', // Set status to 'active' to satisfy constraint
          form_name: submission.formName || `Form ${submission.formId}`,
          wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        };
      } else if (submission.formName === 'Email Form') {
        // Special mapping for Email Form (only has email)
        enquiryData = {
          full_name: 'Email Lead', // Default name for email-only submissions
          email: data.Email || data.email || '',
          phone: 'Not provided', // Default phone for email-only submissions
          date_of_birth: new Date().toISOString().split('T')[0], // fallback to today
          age: undefined, // No age data available
          professional_status: 'student', // Default status
          relocation_possible: 'Maybe', // Default value
          investment_willing: 'Maybe', // Default value
          gender: undefined,
          location: undefined,
          career_goals: undefined,
          course_of_interest: undefined,
          status: 'active', // Set status to 'active' to satisfy constraint
          // UTM parameters for marketing campaign tracking
          utm_source:
            data.utm_source ||
            data.utmSource ||
            data['utm-source'] ||
            undefined,
          utm_medium:
            data.utm_medium ||
            data.utmMedium ||
            data['utm-medium'] ||
            undefined,
          utm_campaign:
            data.utm_campaign ||
            data.utmCampaign ||
            data['utm-campaign'] ||
            undefined,
          utm_content:
            data.utm_content ||
            data.utmContent ||
            data['utm-content'] ||
            undefined,
          utm_term:
            data.utm_term || data.utmTerm || data['utm-term'] || undefined,
          form_name: submission.formName || `Form ${submission.formId}`,
          wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        };
      } else {
        // Generic mapping for other forms (Contact Form, etc.)
        // Try to extract name and email with fallback to any field containing these keywords
        const extractedName = this.extractFieldValue(data, [
          'name',
          'First Name',
          'Full Name',
          'first-name',
          'firstName',
          'Name',
          'fullname',
          'full_name',
        ]);
        const extractedEmail = this.extractFieldValue(data, [
          'email',
          'Email',
          'Email ID',
          'email_address',
          'emailAddress',
          'e-mail',
          'mail',
        ]);

        enquiryData = {
          full_name: extractedName || '',
          email: extractedEmail || '',
          date_of_birth:
            data.dob ||
            data.DoB ||
            data['date-of-birth'] ||
            data.dateOfBirth ||
            data.birthday ||
            new Date().toISOString().split('T')[0], // fallback to today if missing
          age: this.parseAge(
            data.age || data.Age || data['age'] || data['Age']
          ),
          phone:
            data.phone ||
            data.Phone ||
            data['phone-number'] ||
            data.phoneNumber ||
            data['Phone No．'] ||
            '',
          gender:
            data.gender ||
            data.Gender ||
            data['Specify Your Gender'] ||
            undefined,
          location:
            data.location ||
            data.Location ||
            data.city ||
            data.address ||
            data.Address ||
            undefined,
          professional_status: this.mapProfessionalStatus(
            data['i-am-a'] ||
              data['I am'] ||
              data['You are currently a'] ||
              data['I am'] ||
              data.professionalStatus ||
              data.professional_status ||
              data['professional-status'] ||
              data.occupation ||
              data.role ||
              ''
          ),
          relocation_possible: this.mapRelocationPossible(
            data['relocate-intent'] ||
              data.relocationPossible ||
              data.relocation_possible ||
              data['relocation-possible'] ||
              data.relocation ||
              'Maybe'
          ),
          investment_willing: this.mapInvestmentWilling(
            data['time-intent'] ||
              data.investmentWilling ||
              data.investment_willing ||
              data['investment-willing'] ||
              data.investment ||
              data.budget ||
              'Maybe'
          ),
          career_goals:
            data['Career-Goals'] ||
            data.careerGoals ||
            data.career_goals ||
            data['career-goals'] ||
            data.goals ||
            data.objectives ||
            data['Career goals'] ||
            undefined,
          course_of_interest:
            data['Course of Interest'] ||
            data.courseOfInterest ||
            data.course_of_interest ||
            data['course-of-interest'] ||
            data.course ||
            data.program ||
            undefined,
          status: 'active', // Set status to 'active' to satisfy constraint
          // UTM parameters for marketing campaign tracking
          utm_source:
            data.utm_source ||
            data.utmSource ||
            data['utm-source'] ||
            undefined,
          utm_medium:
            data.utm_medium ||
            data.utmMedium ||
            data['utm-medium'] ||
            undefined,
          utm_campaign:
            data.utm_campaign ||
            data.utmCampaign ||
            data['utm-campaign'] ||
            undefined,
          utm_content:
            data.utm_content ||
            data.utmContent ||
            data['utm-content'] ||
            undefined,
          utm_term:
            data.utm_term || data.utmTerm || data['utm-term'] || undefined,
          form_name: submission.formName || `Form ${submission.formId}`,
          wf_created_at: submission.dateSubmitted, // Store original Webflow submission date
        };
      }

      console.log('🔍 Mapped Enquiry Data:', {
        form_name: enquiryData.form_name,
        age: enquiryData.age,
        age_type: typeof enquiryData.age,
        isProgramBrochureForm,
        full_data: enquiryData,
      });

      // Validate required fields based on form type
      if (submission.formName === 'Email Form') {
        // Email Form only requires email
        if (!enquiryData.email || enquiryData.email.trim() === '') {
          console.warn('Invalid Email Form submission - missing email:', {
            submissionId: submission.id,
            formName: submission.formName,
            email: enquiryData.email,
            availableFields: Object.keys(submission.formResponse),
          });
          return null;
        }
      } else {
        // Other forms require name and email, phone can be empty but we'll set a default
        if (
          !enquiryData.full_name ||
          enquiryData.full_name.trim() === '' ||
          !enquiryData.email ||
          enquiryData.email.trim() === ''
        ) {
          console.warn(
            'Invalid submission data - missing required fields (name or email):',
            {
              submissionId: submission.id,
              formName: submission.formName,
              full_name: enquiryData.full_name,
              email: enquiryData.email,
              availableFields: Object.keys(submission.formResponse),
              formResponse: submission.formResponse,
            }
          );
          return null;
        }

        // If phone is empty, set a default value
        if (!enquiryData.phone || enquiryData.phone.trim() === '') {
          enquiryData.phone = 'Not provided';
        }
      }

      return enquiryData;
    } catch (error) {
      console.error('Error transforming submission to enquiry:', error);
      return null;
    }
  }

  /**
   * Map professional status from Webflow to our format
   */
  private mapProfessionalStatus(
    webflowValue: string
  ): CreateEnquiryData['professional_status'] {
    const value = webflowValue.toLowerCase().trim();

    switch (value) {
      case 'student':
      case 'a student':
        return 'student';
      case 'working professional':
      case 'a working professional':
        return 'A Working Professional';
      case 'in between jobs':
        return 'In Between Jobs';
      default:
        // If we can't map it, try to infer from the original value
        if (value.includes('student')) return 'student';
        if (value.includes('working') || value.includes('professional'))
          return 'A Working Professional';
        if (value.includes('between') || value.includes('unemployed'))
          return 'In Between Jobs';
        return 'student'; // final fallback
    }
  }

  /**
   * Map relocation possibility from Webflow to our format
   */
  private mapRelocationPossible(
    webflowValue: string
  ): CreateEnquiryData['relocation_possible'] {
    const value = webflowValue.toLowerCase().trim();

    switch (value) {
      case 'yes':
        return 'Yes';
      case 'no':
        return 'No';
      case 'maybe':
        return 'Maybe';
      default:
        return 'Maybe'; // fallback
    }
  }

  /**
   * Map investment willingness from Webflow to our format
   */
  private mapInvestmentWilling(
    webflowValue: string
  ): CreateEnquiryData['investment_willing'] {
    const value = webflowValue.toLowerCase().trim();

    switch (value) {
      case 'yes':
        return 'Yes';
      case 'no':
        return 'No';
      case 'maybe':
        return 'Maybe';
      default:
        return 'Maybe'; // fallback
    }
  }

  /**
   * Sync form submissions to enquiries database
   * This method fetches all form submissions and creates enquiries for new ones
   */
  async syncFormSubmissionsToEnquiries(): Promise<{
    synced: number;
    errors: number;
  }> {
    const syncId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    // Initialize sync logs
    this.syncLogs = {
      syncId,
      startTime,
      endTime: '',
      totalSubmissions: 0,
      successful: 0,
      errors: 0,
      warnings: 0,
      skipped: 0,
      logs: [],
    };

    try {
      const submissions = await this.getAllFormSubmissions();
      this.syncLogs.totalSubmissions = submissions.length;

      console.log(`🔄 Starting sync for ${submissions.length} submissions`);

      for (const submission of submissions) {
        try {
          const enquiryData = this.transformSubmissionToEnquiry(submission);

          if (enquiryData) {
            // Check if enquiry already exists (by email and submission date)
            const existingEnquiry = await this.checkExistingEnquiry(
              enquiryData.email,
              submission.dateSubmitted
            );

            if (!existingEnquiry) {
              // Import the service here to avoid circular dependencies
              const { EnquiriesService } = await import('./enquiries.service');
              await EnquiriesService.createEnquiry(enquiryData);

              this.syncLogs.successful++;
              this.syncLogs.logs.push({
                submissionId: submission.id,
                formName: submission.formName || 'Unknown',
                formId: submission.formId,
                timestamp: new Date().toISOString(),
                status: 'success',
                message: 'Enquiry created successfully',
                enquiryData: enquiryData,
                originalData: submission.formResponse,
              });
            } else {
              this.syncLogs.skipped++;
              this.syncLogs.logs.push({
                submissionId: submission.id,
                formName: submission.formName || 'Unknown',
                formId: submission.formId,
                timestamp: new Date().toISOString(),
                status: 'skipped',
                message: 'Enquiry already exists (duplicate)',
                enquiryData: enquiryData,
                originalData: submission.formResponse,
              });
            }
          } else {
            this.syncLogs.errors++;
            this.syncLogs.logs.push({
              submissionId: submission.id,
              formName: submission.formName || 'Unknown',
              formId: submission.formId,
              timestamp: new Date().toISOString(),
              status: 'error',
              message:
                'Failed to transform submission data - missing required fields',
              originalData: submission.formResponse,
            });
          }
        } catch (error) {
          this.syncLogs.errors++;
          this.syncLogs.logs.push({
            submissionId: submission.id,
            formName: submission.formName || 'Unknown',
            formId: submission.formId,
            timestamp: new Date().toISOString(),
            status: 'error',
            message: `Error syncing submission: ${error.message}`,
            details: {
              error: error.message,
              stack: error.stack,
            },
            originalData: submission.formResponse,
          });
          console.error('Error syncing submission:', submission.id, error);
        }
      }

      this.syncLogs.endTime = new Date().toISOString();

      console.log(`✅ Sync completed:`, {
        total: this.syncLogs.totalSubmissions,
        successful: this.syncLogs.successful,
        errors: this.syncLogs.errors,
        skipped: this.syncLogs.skipped,
      });

      return { synced: this.syncLogs.successful, errors: this.syncLogs.errors };
    } catch (error) {
      this.syncLogs.endTime = new Date().toISOString();
      this.syncLogs.errors++;
      this.syncLogs.logs.push({
        submissionId: 'SYSTEM_ERROR',
        formName: 'System',
        formId: 'system',
        timestamp: new Date().toISOString(),
        status: 'error',
        message: `System error during sync: ${error.message}`,
        details: {
          error: error.message,
          stack: error.stack,
        },
      });

      console.error('Error syncing form submissions:', error);
      throw new Error('Failed to sync form submissions');
    }
  }

  /**
   * Extract field value by trying multiple possible field names
   */
  private extractFieldValue(
    data: Record<string, unknown>,
    possibleFieldNames: string[]
  ): string | undefined {
    for (const fieldName of possibleFieldNames) {
      const value = data[fieldName];
      if (value && typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
    return undefined;
  }

  /**
   * Parse age field safely, handling empty strings and invalid values
   */
  private parseAge(ageValue: unknown): number | undefined {
    if (!ageValue || ageValue === '') {
      return undefined;
    }

    const parsed = parseInt(ageValue);
    return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
  }

  /**
   * Check if an enquiry already exists based on email and Webflow submission date
   * Uses wf_created_at field for accurate duplicate detection
   * Uses direct database query to bypass pagination limitations
   */
  private async checkExistingEnquiry(
    email: string,
    submittedAt: string
  ): Promise<boolean> {
    try {
      // Direct database query to get ALL enquiries for this email (bypasses pagination)
      // Include both active and soft-deleted enquiries to prevent re-syncing deleted ones
      const { data: enquiries, error } = await supabase
        .from('enquiries')
        .select('email, wf_created_at, deleted_at')
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
      // This includes both active and soft-deleted enquiries to prevent re-syncing
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
          `Found exact duplicate for email ${email} at ${submittedAt} (including soft-deleted)`
        );
        return true;
      }

      // Check for potential duplicates: same email and same day (using wf_created_at)
      // This includes both active and soft-deleted enquiries to prevent re-syncing
      const sameDayDuplicate = enquiries.some(enquiry => {
        if (!enquiry.wf_created_at) return false;
        const enquiryWfDate = new Date(enquiry.wf_created_at);
        return enquiryWfDate.toDateString() === submissionDate.toDateString();
      });

      if (sameDayDuplicate) {
        console.log(
          `Found same-day duplicate for email ${email} on ${submissionDate.toDateString()} (including soft-deleted)`
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking existing enquiry:', error);
      return false;
    }
  }
}
