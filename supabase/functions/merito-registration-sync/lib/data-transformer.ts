import type {
  MeritoLeadData,
  ProfileData,
  ExtendedProfileData,
  ApplicationData,
  SyncType,
  LeadQuality,
  ConversionStage,
} from './types.ts';
import {
  mapGender,
  mapMonth,
  mapApplicationStatusToMeritto,
  formatFamilyIncome,
} from './field-mappers.ts';
import { cleanMobile } from '../utils/phone-utils.ts';
import {
  formatDateOfBirth,
  formatApplicationDate,
} from '../utils/date-utils.ts';
import {
  cleanAlphanumeric,
  cleanAddress,
  cleanName,
} from '../utils/text-utils.ts';

/**
 * Data transformation utilities for Meritto sync
 */
export class DataTransformer {
  /**
   * Transform profile and application data to Meritto lead format
   */
  static transformToMeritoLead(
    profile: ProfileData,
    application: ApplicationData,
    extendedProfile: ExtendedProfileData | null,
    syncType: SyncType
  ): MeritoLeadData {
    // Create base lead data with required fields
    const leadData: MeritoLeadData = {
      // Core required fields
      email: profile.email,
      mobile: cleanMobile(profile.phone),
      search_criteria: 'email',
      name: cleanName(profile.first_name, profile.last_name),
      user_date: formatApplicationDate(application.created_at),
    };

    // Add extended profile fields only if they exist and have values
    if (extendedProfile) {
      this.addExtendedProfileFields(leadData, profile, extendedProfile);
    }

    // Add UTM tracking
    this.addUTMFields(leadData, application);

    // Add application status and metadata
    this.addApplicationFields(leadData, application, syncType);

    // Add cohort and course information
    this.addCohortFields(leadData, application);

    // Add qualification from basic profile
    this.addFieldIfExists(leadData, 'cf_qualification', profile.qualification);

    // Add lead quality and conversion stage
    leadData.lead_quality = this.determineLeadQuality(extendedProfile);
    leadData.conversion_stage = this.determineConversionStage(
      application,
      syncType
    );

    return leadData;
  }

  /**
   * Add extended profile fields to lead data
   */
  private static addExtendedProfileFields(
    leadData: MeritoLeadData,
    profile: ProfileData,
    extendedProfile: ExtendedProfileData
  ): void {
    // Basic profile fields
    this.addFieldIfExists(
      leadData,
      'cf_date_of_birth',
      formatDateOfBirth(extendedProfile.date_of_birth || profile.date_of_birth)
    );
    this.addFieldIfExists(
      leadData,
      'cf_specify_your_gender',
      mapGender(extendedProfile.gender || profile.gender)
    );
    this.addFieldIfExists(
      leadData,
      'cf_where_do_you_live',
      cleanAlphanumeric(extendedProfile.current_city || profile.location)
    );
    this.addFieldIfExists(
      leadData,
      'cf_state',
      cleanAlphanumeric(extendedProfile.state || profile.state)
    );
    this.addFieldIfExists(
      leadData,
      'cf_city',
      cleanAlphanumeric(extendedProfile.city || profile.city)
    );
    this.addFieldIfExists(
      leadData,
      'cf_current_address',
      cleanAddress(extendedProfile.current_address || profile.address)
    );
    this.addFieldIfExists(
      leadData,
      'cf_postal_zip_code',
      extendedProfile.postal_zip_code || profile.pincode
    );

    // Education info
    this.addEducationFields(leadData, extendedProfile, profile);

    // Work experience
    this.addWorkExperienceFields(leadData, extendedProfile);

    // Family information
    this.addFamilyFields(leadData, extendedProfile);

    // Social profiles
    this.addSocialFields(leadData, extendedProfile);

    // Financial aid information
    this.addFinancialFields(leadData, extendedProfile);

    // Professional info
    this.addProfessionalFields(leadData, extendedProfile, profile);

    // Emergency contact
    this.addEmergencyContactFields(leadData, extendedProfile);
  }

  /**
   * Add education fields to lead data
   */
  private static addEducationFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData,
    profile: ProfileData
  ): void {
    this.addFieldIfExists(
      leadData,
      'cf_highest_education_level',
      extendedProfile.qualification
    );
    this.addFieldIfExists(
      leadData,
      'cf_qualification',
      extendedProfile.qualification || profile.qualification
    );
    this.addFieldIfExists(
      leadData,
      'cf_field_of_study',
      extendedProfile.field_of_study
    );
    this.addFieldIfExists(
      leadData,
      'cf_institution_name',
      extendedProfile.institution_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_graduation_year',
      extendedProfile.graduation_year?.toString()
    );
    this.addFieldIfExists(
      leadData,
      'cf_graduation_month_new',
      mapMonth(extendedProfile.graduation_month)
    );
  }

  /**
   * Add work experience fields to lead data
   */
  private static addWorkExperienceFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData
  ): void {
    this.addFieldIfExists(
      leadData,
      'cf_do_you_have_work_experience',
      extendedProfile.has_work_experience ? 'Yes' : 'No'
    );
    this.addFieldIfExists(
      leadData,
      'cf_work_experience_type',
      extendedProfile.work_experience_type
    );
    this.addFieldIfExists(
      leadData,
      'cf_company_name',
      extendedProfile.company_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_job_description',
      extendedProfile.job_description
    );
    this.addFieldIfExists(
      leadData,
      'cf_work_start_year',
      extendedProfile.work_start_year?.toString()
    );
    this.addFieldIfExists(
      leadData,
      'cf_work_end_year',
      extendedProfile.work_end_year?.toString()
    );
    this.addFieldIfExists(
      leadData,
      'cf_work_end_month_new',
      mapMonth(extendedProfile.work_end_month)
    );
  }

  /**
   * Add family information fields to lead data
   */
  private static addFamilyFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData
  ): void {
    // Father's information
    this.addFieldIfExists(
      leadData,
      'cf_fathers_first_name',
      extendedProfile.father_first_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_fathers_last_name',
      extendedProfile.father_last_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_fathers_contact_number',
      cleanMobile(extendedProfile.father_contact_no)
    );
    this.addFieldIfExists(
      leadData,
      'cf_fathers_occupation',
      extendedProfile.father_occupation
    );
    this.addFieldIfExists(
      leadData,
      'cf_fathers_email',
      extendedProfile.father_email
    );

    // Mother's information
    this.addFieldIfExists(
      leadData,
      'cf_mothers_first_name',
      extendedProfile.mother_first_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_mothers_last_name',
      extendedProfile.mother_last_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_mothers_contact_number',
      cleanMobile(extendedProfile.mother_contact_no)
    );
    this.addFieldIfExists(
      leadData,
      'cf_mothers_occupation',
      extendedProfile.mother_occupation
    );
    this.addFieldIfExists(
      leadData,
      'cf_mothers_email',
      extendedProfile.mother_email
    );
  }

  /**
   * Add social profiles to lead data
   */
  private static addSocialFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData
  ): void {
    this.addFieldIfExists(
      leadData,
      'cf_linkedin_profile',
      extendedProfile.linkedin_profile
    );
    this.addFieldIfExists(
      leadData,
      'cf_instagram_id',
      extendedProfile.instagram_id
    );
  }

  /**
   * Add financial aid information to lead data
   */
  private static addFinancialFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData
  ): void {
    this.addFieldIfExists(
      leadData,
      'cf_have_you_applied_for_financial_aid',
      extendedProfile.applied_financial_aid ? 'Yes' : 'No'
    );
    this.addFieldIfExists(
      leadData,
      'cf_who_applied_for_this_loan',
      extendedProfile.loan_applicant
    );
    this.addFieldIfExists(
      leadData,
      'cf_type_of_loan',
      extendedProfile.loan_type
    );
    this.addFieldIfExists(
      leadData,
      'cf_loan_amount',
      extendedProfile.loan_amount
    );
    this.addFieldIfExists(
      leadData,
      'cf_cibil_score',
      extendedProfile.cibil_score
    );
    this.addFieldIfExists(
      leadData,
      'cf_family_income',
      formatFamilyIncome(extendedProfile.family_income)
    );
  }

  /**
   * Add professional information to lead data
   */
  private static addProfessionalFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData,
    profile: ProfileData
  ): void {
    const professionalStatus =
      extendedProfile.professional_status || profile.professional_status;
    if (professionalStatus) {
      const mappedStatus =
        professionalStatus === 'student' ? 'A Student' : 'Working Professional';
      this.addFieldIfExists(leadData, 'cf_i_am', mappedStatus);
    }

    this.addFieldIfExists(
      leadData,
      'cf_can_you_relocate_to_bangalore_for_this_program',
      extendedProfile.relocation_possible ? 'Yes' : 'No'
    );
    this.addFieldIfExists(
      leadData,
      'cf_do_you_have_1_or_2_years_of_your_time_for_your_future',
      extendedProfile.investment_willing ? 'Yes' : 'No'
    );
  }

  /**
   * Add emergency contact information to lead data
   */
  private static addEmergencyContactFields(
    leadData: MeritoLeadData,
    extendedProfile: ExtendedProfileData
  ): void {
    this.addFieldIfExists(
      leadData,
      'cf_emergency_contact_first_name_new',
      extendedProfile.emergency_first_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_emergency_contact_last_name',
      extendedProfile.emergency_last_name
    );
    this.addFieldIfExists(
      leadData,
      'cf_emergency_contact_number',
      cleanMobile(extendedProfile.emergency_contact_no)
    );
    this.addFieldIfExists(
      leadData,
      'cf_relationship',
      extendedProfile.emergency_relationship
    );
  }

  /**
   * Add UTM tracking fields to lead data
   */
  private static addUTMFields(
    leadData: MeritoLeadData,
    application: ApplicationData
  ): void {
    this.addFieldIfExists(leadData, 'source', application.utm_source);
    this.addFieldIfExists(leadData, 'medium', application.utm_medium);
    this.addFieldIfExists(leadData, 'campaign', application.utm_campaign);
  }

  /**
   * Add application fields to lead data
   */
  private static addApplicationFields(
    leadData: MeritoLeadData,
    application: ApplicationData,
    syncType: SyncType
  ): void {
    let applicationStatus = application.status;
    if (syncType === 'initial_registration') {
      applicationStatus = 'registration_initiated';
    } else if (syncType === 'extended') {
      applicationStatus = 'registration_completed';
    }

    const merittoStatus = mapApplicationStatusToMeritto(applicationStatus);
    this.addFieldIfExists(leadData, 'application_status', merittoStatus);

    const createdDate = formatApplicationDate(application.created_at);
    this.addFieldIfExists(leadData, 'cf_created_on', createdDate);
    this.addFieldIfExists(leadData, 'cf_created_by', 'System Registration');
  }

  /**
   * Add cohort and course information to lead data
   */
  private static addCohortFields(
    leadData: MeritoLeadData,
    application: ApplicationData
  ): void {
    this.addFieldIfExists(leadData, 'cf_cohort', application.cohort?.cohort_id);
    this.addFieldIfExists(
      leadData,
      'cf_preferred_course',
      application.cohort?.epic_learning_path?.title
    );
  }

  /**
   * Determine lead quality based on data completeness
   */
  private static determineLeadQuality(
    extendedProfile: ExtendedProfileData | null
  ): LeadQuality {
    if (!extendedProfile) return 'Medium';

    let score = 0;
    if (extendedProfile.current_address) score += 1;
    if (extendedProfile.institution_name) score += 1;
    if (extendedProfile.linkedin_profile) score += 1;
    if (extendedProfile.has_work_experience && extendedProfile.company_name)
      score += 2;
    if (extendedProfile.father_first_name || extendedProfile.mother_first_name)
      score += 1;

    if (score >= 4) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  /**
   * Determine conversion stage based on application status
   */
  private static determineConversionStage(
    application: ApplicationData,
    syncType: SyncType
  ): ConversionStage {
    const status = application.status;

    // Map specific statuses to conversion stages
    const conversionStageMap: { [key: string]: ConversionStage } = {
      registration_initiated: 'enquiry',
      registration_complete: 'consideration',
      registration_paid: 'consideration',
      application_initiated: 'application',
      application_accepted: 'qualified',
      application_rejected: 'unqualified',
      application_on_hold: 'consideration',
      interview_scheduled: 'qualified',
      interview_selected: 'converted',
      interview_rejected: 'unqualified',
      enrolled: 'converted',
    };

    // Handle sync type overrides for backwards compatibility
    if (syncType === 'initial_registration') {
      return 'enquiry';
    }

    return conversionStageMap[status] || 'enquiry';
  }

  /**
   * Helper function to add field only if it has a value
   */
  private static addFieldIfExists(obj: any, key: string, value: any): void {
    if (value !== null && value !== undefined && value !== '') {
      obj[key] = value;
    }
  }
}
