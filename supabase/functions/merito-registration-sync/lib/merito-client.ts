import type { MeritoLeadData, MeritoResponse } from './types.ts';

/**
 * Meritto API client for lead management
 */
export class MeritoClient {
  private secretKey: string;
  private accessKey: string;
  private apiUrl = 'https://api.nopaperforms.io/lead/v1/createOrUpdate';

  constructor(secretKey: string, accessKey: string) {
    this.secretKey = secretKey;
    this.accessKey = accessKey;
  }

  /**
   * Create or update a lead in Meritto CRM
   */
  async createOrUpdateLead(leadData: MeritoLeadData): Promise<MeritoResponse> {
    const headers = {
      'Content-Type': 'application/json',
      'secret-key': this.secretKey,
      'access-key': this.accessKey,
    };

    // Log the exact curl command for debugging
    const curlCommand = `curl -X POST "${this.apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "secret-key: ${this.secretKey}" \\
  -H "access-key: ${this.accessKey}" \\
  -d '${JSON.stringify(leadData, null, 2)}'`;

    console.log('🔧 EXACT CURL COMMAND TO MERITTO:');
    console.log(curlCommand);
    console.log('📤 SENDING TO MERITTO:');
    console.log('URL:', this.apiUrl);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', JSON.stringify(leadData, null, 2));

    // Make API call to Meritto
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(leadData),
    });

    // Log response details
    console.log('📥 MERITTO RESPONSE:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log(
      'Headers:',
      JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MERITTO API ERROR RESPONSE:');
      console.error('Status:', response.status);
      console.error('Status Text:', response.statusText);
      console.error('Response Body:', errorText);
      console.error(
        'Full Response Headers:',
        JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)
      );
      throw new Error(
        `HTTP error! status: ${response.status}, response: ${errorText}`
      );
    }

    const result: MeritoResponse = await response.json();

    console.log('📋 MERITTO API SUCCESS RESPONSE:');
    console.log('Full Response:', JSON.stringify(result, null, 2));

    if (!result.status) {
      console.error('❌ MERITTO API BUSINESS LOGIC ERROR:');
      console.error('Response:', JSON.stringify(result, null, 2));
      throw new Error(`Meritto API error: ${result.message}`);
    }

    return result;
  }

  /**
   * Create test lead with all fields for debugging
   */
  async createTestLead(): Promise<MeritoResponse> {
    console.log(
      '🧪 TESTING ALL FIELDS - Creating sample data with all the fixed fields'
    );

    // Create comprehensive test data with all the fields we just fixed
    const testLeadData: MeritoLeadData = {
      // Core required fields
      email: 'kundan9595@gmail.com',
      mobile: '+919876543211',
      search_criteria: 'email',
      name: 'Kundan Test User',

      // Basic profile fields
      cf_date_of_birth: '15/03/1995', // DOB - Fixed field
      cf_specify_your_gender: 'Male',
      cf_where_do_you_live: 'Bangalore',
      cf_state: 'Karnataka',
      cf_city: 'Bangalore',
      cf_current_address: '123 Test Street Test Area',
      cf_postal_zip_code: '560001',

      // Education info
      cf_highest_education_level: "Bachelor's Degree",
      cf_qualification: 'B.Tech',
      cf_field_of_study: 'Computer Science',
      cf_institution_name: 'Test University',
      cf_graduation_year: '2017',
      cf_graduation_month_new: 'May', // Graduation month

      // Work experience - Fixed fields
      cf_do_you_have_work_experience: 'Yes',
      cf_work_experience_type: 'Full time',
      cf_job_description: 'Software Engineer',
      cf_company_name: 'Test Company',
      cf_work_start_year: '2017',
      cf_work_end_year: '2020', // Work end year - Fixed field
      cf_work_end_month_new: 'December', // Work end month - Fixed field

      // Family information - Fixed fields
      cf_fathers_first_name: 'John',
      cf_fathers_last_name: 'Doe',
      cf_fathers_occupation: 'Engineer',
      cf_fathers_email: 'john.doe@example.com', // Father email - Fixed field

      cf_mothers_first_name: 'Jane',
      cf_mothers_last_name: 'Doe',
      cf_mothers_occupation: 'Teacher',
      cf_mothers_email: 'jane.doe@example.com', // Mother email - Fixed field

      // Additional fields
      cf_career_goals: 'Become a senior software engineer',
      cf_linkedin_profile: 'https://linkedin.com/in/testuser',
      cf_instagram_id: '@testuser',

      // UTM tracking
      source: 'test',
      medium: 'test',
      campaign: 'all-fields-test',

      // Lead quality and stage
      lead_quality: 'High',
      conversion_stage: 'consideration',
      application_status: 'Application Initiated', // Test status mapping
    };

    return this.createOrUpdateLead(testLeadData);
  }
}
