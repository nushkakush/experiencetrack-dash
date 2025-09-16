import { MeritoLeadData, MeritoResponse, MeritoError, MeritoLeadStage } from '@/types/merito';
import { supabase } from '@/integrations/supabase/client';

export class MeritoService {
  private static readonly API_URL = 'https://api.nopaperforms.io/lead/v1/createOrUpdate';
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Create or update a lead in Merito CRM
   */
  static async createOrUpdateLead(leadData: MeritoLeadData): Promise<MeritoResponse> {
    try {
      // Get Merito credentials from Supabase secrets
      const { data: secretKey, error: secretError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_SECRET_KEY'
      });

      const { data: accessKey, error: accessError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_ACCESS_KEY'
      });

      if (secretError || accessError || !secretKey || !accessKey) {
        throw new Error('Merito API credentials not found in Supabase secrets');
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'secret-key': secretKey,
          'access-key': accessKey,
        },
        body: JSON.stringify(leadData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MeritoResponse = await response.json();
      
      if (!result.status) {
        throw new Error(`Merito API error: ${result.message}`);
      }

      return result;
    } catch (error) {
      console.error('Merito API call failed:', error);
      throw error;
    }
  }

  /**
   * Create or update lead with retry mechanism
   */
  static async createOrUpdateLeadWithRetry(
    leadData: MeritoLeadData,
    retryCount = 0
  ): Promise<MeritoResponse> {
    try {
      return await this.createOrUpdateLead(leadData);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.log(`Retrying Merito API call (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        return this.createOrUpdateLeadWithRetry(leadData, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Sync enquiry data to Merito CRM
   * This will create a new lead or update existing lead based on email/phone
   */
  static async syncEnquiry(enquiry: any): Promise<void> {
    try {
      const leadData = this.mapEnquiryToMerito(enquiry);
      const result = await this.createOrUpdateLeadWithRetry(leadData);
      console.log(`✅ Enquiry synced to Merito CRM. Lead ID: ${result.data.lead_id}`);
    } catch (error) {
      console.error('❌ Failed to sync enquiry to Merito:', error);
      throw error;
    }
  }

  /**
   * Sync application data to Merito CRM
   * This will create a new lead or update existing lead based on email/phone
   */
  static async syncApplication(application: any): Promise<void> {
    try {
      console.log('🔄 MeritoService.syncApplication called with:', {
        hasProfile: !!application.profile,
        email: application.profile?.email || application.email,
        name: application.profile ? `${application.profile.first_name} ${application.profile.last_name}` : 'No profile data'
      });
      
      const leadData = this.mapApplicationToMerito(application);
      console.log('📋 Mapped lead data:', {
        email: leadData.email,
        name: leadData.name,
        mobile: leadData.mobile,
        fieldsCount: Object.keys(leadData).length
      });
      
      const result = await this.createOrUpdateLeadWithRetry(leadData);
      console.log(`✅ Application synced to Merito CRM. Lead ID: ${result.data.lead_id}`);
    } catch (error) {
      console.error('❌ Failed to sync application to Merito:', error);
      throw error;
    }
  }

  /**
   * Sync extended registration data to Merito CRM
   * This method specifically handles the rich profile data from extended registration
   */
  static async syncExtendedRegistration(profileId: string, applicationData: any, extendedProfile: any): Promise<void> {
    try {
      // Combine application data with extended profile
      const enrichedApplication = {
        ...applicationData,
        extended_profile: extendedProfile,
        status: 'registration_completed' // Update status to reflect extended registration completion
      };

      const leadData = this.mapApplicationToMerito(enrichedApplication);
      const result = await this.createOrUpdateLeadWithRetry(leadData);
      
      console.log(`✅ Extended registration synced to Merito CRM. Lead ID: ${result.data.lead_id}`, {
        profileId,
        email: applicationData.profile?.email,
        status: 'registration_completed',
        fieldsUpdated: Object.keys(extendedProfile).length
      });
    } catch (error) {
      console.error('❌ Failed to sync extended registration to Merito:', error);
      throw error;
    }
  }

  /**
   * Map enquiry data to Merito lead format with correct field keys
   */
  private static mapEnquiryToMerito(enquiry: any): MeritoLeadData {
    const leadData: MeritoLeadData = {
      // Core required fields
      email: enquiry.email,
      mobile: enquiry.phone ? enquiry.phone.replace(/\D/g, '') : undefined,
      search_criteria: 'email',
      name: enquiry.full_name ? enquiry.full_name.replace(/[^a-zA-Z\s]/g, '').trim() : 'Unknown User',
      
      // Personal details (using correct Merito field keys)
      // Note: cf_date_of_birth excluded due to API validation issues
      cf_specify_your_gender: enquiry.gender,
      cf_where_do_you_live: enquiry.location,
      cf_state: enquiry.state,
      cf_city: enquiry.city,
      cf_current_address: enquiry.address,
      cf_postal_zip_code: enquiry.pincode,
      
      // Professional info (using correct Merito field keys)
      cf_i_am: this.mapProfessionalStatusToMerito(enquiry.professional_status),
      cf_can_you_relocate_to_bangalore_for_this_program: this.mapRelocationToMerito(enquiry.relocation_possible),
      cf_do_you_have_1_or_2_years_of_your_time_for_your_future: this.mapInvestmentToMerito(enquiry.investment_willing),
      
      // Education info
      cf_highest_education_level: enquiry.qualification,
      cf_field_of_study: enquiry.course_of_interest,
      cf_institution_name: enquiry.institution_name,
      cf_graduation_month_new: enquiry.graduation_month,
      cf_graduation_year: enquiry.graduation_year,
      
      // Work experience
      cf_do_you_have_work_experience: enquiry.work_experience,
      cf_work_experience_type: enquiry.work_experience_type,
      cf_job_description: enquiry.job_description,
      cf_company_name: enquiry.company,
      cf_work_start_year: enquiry.work_start_year,
      cf_work_end_month_new: enquiry.work_end_month,
      
      // UTM tracking (using correct field keys)
      source: enquiry.utm_source,
      medium: enquiry.utm_medium,
      campaign: enquiry.utm_campaign,
      
      // Additional fields
      notes: `Enquiry from ${enquiry.form_name || 'website'} - ${enquiry.career_goals || 'No specific goals mentioned'}`,
      phone: enquiry.phone,
      application_status: 'enquiry',
      lead_quality: this.determineLeadQuality(enquiry),
      conversion_stage: 'awareness',
    };

    return leadData;
  }

  /**
   * Map application data to Merito lead format with complete field mapping
   */
  private static mapApplicationToMerito(application: any): MeritoLeadData {
    const profile = application.profile || application;
    const extendedProfile = application.extended_profile || {};
    
    // Helper function to clean mobile number
    const cleanMobile = (phone: string | null | undefined): string | undefined => {
      if (!phone) return undefined;
      
      // Remove all non-digits
      const digits = phone.replace(/\D/g, '');
      
      // Ensure it's a valid Indian mobile number (10 digits)
      if (digits.length === 10) {
        return digits;
      } else if (digits.length === 12 && digits.startsWith('91')) {
        // Remove country code if present
        return digits.substring(2);
      } else if (digits.length === 13 && digits.startsWith('91')) {
        // Handle +91 case
        return digits.substring(2);
      }
      
      console.warn('Invalid phone number format:', phone, 'digits:', digits);
      return undefined;
    };

    const leadData: MeritoLeadData = {
      // Core required fields
      email: profile.email,
      mobile: cleanMobile(profile.phone),
      search_criteria: 'email',
      name: `${profile.first_name || profile.firstName || ''} ${profile.last_name || profile.lastName || ''}`.replace(/[^a-zA-Z\s]/g, '').trim() || 'Unknown User',
      
      // Personal details (using exact Meritto field keys)
      cf_date_of_birth: this.formatDateOfBirthForMerito(profile.date_of_birth),
      cf_specify_your_gender: this.mapGenderToMerito(extendedProfile.gender || profile.gender),
      cf_where_do_you_live: extendedProfile.current_city || profile.location,
      cf_state: extendedProfile.current_state || profile.state,
      cf_city: extendedProfile.current_city || profile.city,
      cf_current_address: extendedProfile.current_address || profile.address,
      cf_postal_zip_code: extendedProfile.pincode || profile.pincode,
      
      // Professional info (using exact Meritto field keys)
      cf_i_am: this.mapProfessionalStatusToMerito(extendedProfile.professional_status || profile.professional_status),
      cf_can_you_relocate_to_bangalore_for_this_program: this.mapRelocationToMerito(extendedProfile.relocation_possible || profile.relocation_possible),
      cf_do_you_have_1_or_2_years_of_your_time_for_your_future: this.mapInvestmentToMerito(extendedProfile.investment_willing || profile.investment_willing),
      
      // Social profiles
      cf_linkedin_profile: extendedProfile.linkedin_profile,
      cf_instagram_id: extendedProfile.instagram_profile,
      
      // Education info
      cf_highest_education_level: extendedProfile.highest_qualification || profile.qualification,
      cf_field_of_study: extendedProfile.field_of_study || application.course_of_interest || profile.course_of_interest,
      cf_institution_name: extendedProfile.institution_name,
      cf_graduation_month_new: this.mapMonthToMerito(extendedProfile.graduation_month),
      cf_graduation_year: extendedProfile.graduation_year,
      
      // Work experience
      cf_do_you_have_work_experience: extendedProfile.has_work_experience ? 'Yes' : 'No',
      cf_work_experience_type: extendedProfile.work_experience_type,
      cf_job_description: extendedProfile.job_title || extendedProfile.job_description,
      cf_company_name: extendedProfile.company_name,
      cf_work_start_year: extendedProfile.work_start_year,
      cf_work_end_month_new: this.mapMonthToMerito(extendedProfile.work_end_month),
      
      // Family information
      cf_fathers_first_name: extendedProfile.father_first_name,
      cf_fathers_last_name: extendedProfile.father_last_name,
      cf_fathers_contact_number: cleanMobile(extendedProfile.father_phone),
      cf_fathers_occupation: extendedProfile.father_occupation,
      cf_fathers_email: extendedProfile.father_email,
      
      cf_mothers_first_name: extendedProfile.mother_first_name,
      cf_mothers_last_name: extendedProfile.mother_last_name,
      cf_mothers_contact_number: cleanMobile(extendedProfile.mother_phone),
      cf_mothers_occupation: extendedProfile.mother_occupation,
      cf_mothers_email: extendedProfile.mother_email,
      
      // Financial aid information
      cf_have_you_applied_for_financial_aid: extendedProfile.financial_aid_applied ? 'Yes' : 'No',
      cf_who_applied_for_this_loan: extendedProfile.loan_applicant_name,
      cf_type_of_loan: extendedProfile.loan_type,
      cf_loan_amount: extendedProfile.loan_amount,
      cf_cibil_score: extendedProfile.cibil_score,
      cf_family_income: extendedProfile.family_income,
      
      // Emergency contact
      cf_emergency_contact_first_name: extendedProfile.emergency_first_name,
      cf_emergency_contact_last_name: extendedProfile.emergency_last_name,
      cf_emergency_contact_number: cleanMobile(extendedProfile.emergency_phone),
      cf_relationship: extendedProfile.emergency_relationship,
      
      // UTM tracking (using correct field keys)
      source: application.utm_source,
      medium: application.utm_medium,
      campaign: application.utm_campaign,
      
      // Additional fields
      notes: `Application for cohort ${application.cohort_id} - Status: ${application.status}`,
      phone: profile.phone,
      application_status: application.status,
      lead_quality: this.determineApplicationLeadQuality(application, extendedProfile),
      conversion_stage: this.mapApplicationStatusToConversionStage(application.status),
    };

    // Remove undefined values to keep the payload clean
    Object.keys(leadData).forEach(key => {
      if (leadData[key] === undefined || leadData[key] === null || leadData[key] === '') {
        delete leadData[key];
      }
    });

    return leadData;
  }

  /**
   * Determine lead quality for enquiry based on criteria
   */
  private static determineLeadQuality(enquiry: any): 'cold' | 'warm' | 'hot' {
    // High-value indicators
    const hasCourseInterest = enquiry.course_of_interest && enquiry.course_of_interest !== '';
    const hasProfessionalStatus = enquiry.professional_status && enquiry.professional_status !== '';
    const hasCareerGoals = enquiry.career_goals && enquiry.career_goals !== '';
    const isWorkingProfessional = enquiry.professional_status === 'A Working Professional';
    const hasInvestmentWilling = enquiry.investment_willing === 'Yes';
    const hasRelocationPossible = enquiry.relocation_possible === 'Yes';
    
    // Scoring system
    let score = 0;
    if (hasCourseInterest) score += 1;
    if (hasProfessionalStatus) score += 1;
    if (hasCareerGoals) score += 2;
    if (isWorkingProfessional) score += 2;
    if (hasInvestmentWilling) score += 2;
    if (hasRelocationPossible) score += 1;
    
    if (score >= 5) return 'hot';
    if (score >= 3) return 'warm';
    return 'cold';
  }

  /**
   * Determine lead quality for application based on status and data
   */
  private static determineApplicationLeadQuality(application: any, extendedProfile?: any): 'cold' | 'warm' | 'hot' {
    const status = application.status;
    const profile = application.profile || application;
    const extended = extendedProfile || {};
    
    // High-value statuses
    if (['application_accepted', 'interview_scheduled', 'interview_selected', 'enrolled'].includes(status)) {
      return 'hot';
    }
    
    // Medium-value statuses
    if (['application_fee_paid', 'application_initiated', 'registration_completed'].includes(status)) {
      return 'warm';
    }
    
    // Check for extended profile completion indicators
    const hasCompleteProfile = profile.first_name && profile.last_name && profile.phone;
    const hasQualification = profile.qualification && profile.qualification !== '';
    const hasExtendedInfo = extended.current_address || extended.institution_name || extended.linkedin_profile;
    const hasWorkExperience = extended.has_work_experience && extended.company_name;
    const hasFamilyInfo = extended.father_first_name || extended.mother_first_name;
    
    // Scoring system for extended profile
    let score = 0;
    if (hasCompleteProfile) score += 1;
    if (hasQualification) score += 1;
    if (hasExtendedInfo) score += 2;
    if (hasWorkExperience) score += 2;
    if (hasFamilyInfo) score += 1;
    
    if (score >= 4) return 'warm';
    if (hasCompleteProfile && hasQualification) return 'warm';
    
    return 'cold';
  }

  /**
   * Map application status to conversion stage
   */
  private static mapApplicationStatusToConversionStage(status: string): 'awareness' | 'consideration' | 'decision' | 'enrolled' {
    switch (status) {
      case 'registration_initiated':
      case 'registration_complete':
        return 'awareness';
      
      case 'registration_completed': // Extended registration completed
        return 'consideration';
      
      case 'application_fee_paid':
      case 'application_initiated':
        return 'consideration';
      
      case 'application_accepted':
      case 'interview_scheduled':
      case 'interview_selected':
        return 'decision';
      
      case 'enrolled':
        return 'enrolled';
      
      default:
        return 'awareness';
    }
  }

  /**
   * Utility method for delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate lead data before sending to Merito
   */
  static validateLeadData(leadData: MeritoLeadData): boolean {
    if (!leadData.email) {
      console.error('Merito validation failed: email is required');
      return false;
    }

    if (!leadData.search_criteria) {
      console.error('Merito validation failed: search_criteria is required');
      return false;
    }

    if (leadData.search_criteria === 'mobile' && !leadData.mobile) {
      console.error('Merito validation failed: mobile is required when search_criteria is mobile');
      return false;
    }

    return true;
  }

  /**
   * Map professional status to Merito dropdown values
   */
  private static mapProfessionalStatusToMerito(status: string): string {
    switch (status) {
      case 'student':
      case 'Student':
        return 'A Student';
      case 'A Working Professional':
      case 'Working Professional':
        return 'Working Professional';
      case 'In Between Jobs':
        return 'In Between Jobs';
      default:
        return 'A Student';
    }
  }

  /**
   * Map relocation possibility to Merito dropdown values
   */
  private static mapRelocationToMerito(relocation: string): string {
    switch (relocation) {
      case 'Yes':
        return 'Yes';
      case 'No':
        return 'No';
      case 'Maybe':
        return 'May Be';
      default:
        return 'May Be';
    }
  }

  /**
   * Map investment willingness to Merito dropdown values
   */
  private static mapInvestmentToMerito(investment: string): string {
    switch (investment) {
      case 'Yes':
        return 'Yes';
      case 'No':
        return 'No';
      case 'Maybe':
        return 'May Be';
      default:
        return 'May Be';
    }
  }

  /**
   * Format date of birth for Merito API (DD/MM/YYYY format)
   */
  private static formatDateOfBirthForMerito(dateOfBirth: string | null): string | undefined {
    if (!dateOfBirth) {
      return undefined;
    }
    
    try {
      // Parse the date (assuming it's in ISO format from Supabase: YYYY-MM-DD)
      const date = new Date(dateOfBirth);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date of birth format:', dateOfBirth);
        return undefined;
      }
      
      // Format as DD/MM/YYYY for Merito
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
      const year = date.getFullYear().toString();
      
      const formattedDate = `${day}/${month}/${year}`;
      console.log(`📅 Formatted date of birth: ${dateOfBirth} → ${formattedDate}`);
      
      return formattedDate;
    } catch (error) {
      console.error('Error formatting date of birth:', error);
      return undefined;
    }
  }

  /**
   * Map gender to Meritto dropdown values
   */
  private static mapGenderToMerito(gender: string | null | undefined): string | undefined {
    if (!gender) return undefined;
    
    const genderLower = gender.toLowerCase().trim();
    switch (genderLower) {
      case 'male':
      case 'm':
        return 'Male';
      case 'female':
      case 'f':
        return 'Female';
      case 'third gender':
      case 'other':
      case 'non-binary':
        return 'Third Gender';
      default:
        return undefined;
    }
  }

  /**
   * Map month name/number to Meritto dropdown values
   */
  private static mapMonthToMerito(month: string | number | null | undefined): string | undefined {
    if (!month) return undefined;
    
    const monthMap = {
      '1': 'January', 'jan': 'January', 'january': 'January',
      '2': 'February', 'feb': 'February', 'february': 'February',
      '3': 'March', 'mar': 'March', 'march': 'March',
      '4': 'April', 'apr': 'April', 'april': 'April',
      '5': 'May', 'may': 'May',
      '6': 'June', 'jun': 'June', 'june': 'June',
      '7': 'July', 'jul': 'July', 'july': 'July',
      '8': 'August', 'aug': 'August', 'august': 'August',
      '9': 'September', 'sep': 'September', 'september': 'September',
      '10': 'October', 'oct': 'October', 'october': 'October',
      '11': 'November', 'nov': 'November', 'november': 'November',
      '12': 'December', 'dec': 'December', 'december': 'December'
    };
    
    const key = month.toString().toLowerCase().trim();
    return monthMap[key] || undefined;
  }

  /**
   * Check if Merito integration is enabled
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const { data: secretKey, error: secretError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_SECRET_KEY'
      });

      const { data: accessKey, error: accessError } = await supabase.rpc('get_secret', {
        secret_key: 'MERITO_ACCESS_KEY'
      });

      return !secretError && !accessError && !!secretKey && !!accessKey;
    } catch (error) {
      console.error('Error checking Merito credentials:', error);
      return false;
    }
  }
}
