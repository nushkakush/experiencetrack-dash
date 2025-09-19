import { createClient } from 'jsr:@supabase/supabase-js@2';
import type {
  CreateEnquiryData,
  MeritoLeadData,
  LeadQuality,
} from './types.ts';
import {
  mapProfessionalStatusToMeritto,
  mapRelocationToMeritto,
  mapInvestmentToMeritto,
} from '../utils/field-mappers.ts';
import { cleanMobile } from '../utils/validation-utils.ts';
import { formatDateOfBirthForMeritto } from '../utils/date-utils.ts';

/**
 * Sync enquiries to Meritto CRM
 */
export class MeritoSync {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Sync enquiry to Meritto CRM
   */
  async syncEnquiryToMerito(enquiry: CreateEnquiryData): Promise<void> {
    try {
      // Check if Meritto integration is enabled
      const meritoEnabled = Deno.env.get('MERITO_ENABLED');

      if (meritoEnabled !== 'true') {
        console.log('Meritto integration is disabled, skipping sync');
        return;
      }

      // Get Meritto API credentials from environment
      const secretKey = Deno.env.get('MERITO_SECRET_KEY');
      const accessKey = Deno.env.get('MERITO_ACCESS_KEY');

      if (!secretKey || !accessKey) {
        console.error(
          'Meritto API credentials not found in environment variables'
        );
        return;
      }

      // DEBUG: Log the enquiry data from Supabase
      console.log('🔍 DEBUG - Supabase Enquiry Data:');
      console.log('Full enquiry object:', JSON.stringify(enquiry, null, 2));
      console.log('Key fields:');
      console.log('- email:', enquiry.email);
      console.log('- full_name:', enquiry.full_name);
      console.log('- phone:', enquiry.phone);
      console.log('- date_of_birth:', enquiry.date_of_birth);
      console.log('- gender:', enquiry.gender);
      console.log('- location:', enquiry.location);
      console.log('- professional_status:', enquiry.professional_status);
      console.log('- career_goals:', enquiry.career_goals);
      console.log('- course_of_interest:', enquiry.course_of_interest);

      // DEBUG: Log the formatted fields for Meritto
      console.log('🔍 DEBUG - Formatted Fields for Meritto:');
      console.log(
        '- cf_date_of_birth:',
        formatDateOfBirthForMeritto(enquiry.date_of_birth)
      );
      console.log('- cf_career_goals:', enquiry.career_goals);

      // Clean mobile number
      const cleanedMobile = cleanMobile(enquiry.phone);

      // Map directly from enquiry data to Meritto using correct field keys
      const leadData: MeritoLeadData = {
        // Core required fields
        email: enquiry.email,
        search_criteria: 'email',
        name:
          enquiry.full_name && enquiry.full_name.trim()
            ? enquiry.full_name.replace(/[^a-zA-Z\s]/g, '').trim()
            : 'Unknown User',

        // Professional info (only include if available)
        cf_i_am: enquiry.professional_status
          ? mapProfessionalStatusToMeritto(enquiry.professional_status)
          : undefined,
        cf_can_you_relocate_to_bangalore_for_this_program:
          enquiry.relocation_possible
            ? mapRelocationToMeritto(enquiry.relocation_possible)
            : undefined,
        cf_do_you_have_1_or_2_years_of_your_time_for_your_future:
          enquiry.investment_willing
            ? mapInvestmentToMeritto(enquiry.investment_willing)
            : undefined,

        // Additional fields
        notes: `Enquiry from ${enquiry.form_name || 'website'} - ${enquiry.career_goals || 'No specific goals mentioned'}`,
        phone: enquiry.phone,
        application_status: 'enquiry',
        lead_quality: this.determineLeadQuality(enquiry),
        conversion_stage: 'awareness',
      };

      // Only add fields that exist and have values
      this.addFieldIfExists(leadData, 'cf_specify_your_gender', enquiry.gender);
      this.addFieldIfExists(leadData, 'cf_where_do_you_live', enquiry.location);
      this.addFieldIfExists(leadData, 'cf_career_goals', enquiry.career_goals);
      this.addFieldIfExists(
        leadData,
        'cf_field_of_study',
        enquiry.course_of_interest
      );
      this.addFieldIfExists(leadData, 'source', enquiry.utm_source);
      this.addFieldIfExists(leadData, 'medium', enquiry.utm_medium);
      this.addFieldIfExists(leadData, 'campaign', enquiry.utm_campaign);

      if (enquiry.date_of_birth) {
        this.addFieldIfExists(
          leadData,
          'cf_date_of_birth',
          formatDateOfBirthForMeritto(enquiry.date_of_birth)
        );
      }

      // Add mobile field only if we have a valid mobile number
      if (cleanedMobile) {
        leadData.mobile = cleanedMobile;
      }

      // Validate required fields
      if (!leadData.email) {
        console.warn('Missing email for Meritto sync:', {
          email: leadData.email,
          form_name: enquiry.form_name,
        });
        return;
      }

      if (!leadData.name || leadData.name.trim() === '') {
        console.warn('Missing or empty name for Meritto sync:', {
          name: leadData.name,
          full_name: enquiry.full_name,
          form_name: enquiry.form_name,
        });
        return;
      }

      // DEBUG: Log the final leadData being sent to Meritto
      console.log('🔍 DEBUG - Final Lead Data for Meritto API:');
      console.log('- cf_date_of_birth:', leadData.cf_date_of_birth);
      console.log('- cf_career_goals:', leadData.cf_career_goals);
      console.log('Full leadData:', JSON.stringify(leadData, null, 2));

      // Make API call to Meritto
      const response = await fetch(
        'https://api.nopaperforms.io/lead/v1/createOrUpdate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'secret-key': secretKey,
            'access-key': accessKey,
          },
          body: JSON.stringify(leadData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Meritto API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.status) {
        throw new Error(`Meritto API returned error: ${result.message}`);
      }

      console.log(
        `✅ Lead synced to Meritto CRM. Lead ID: ${result.data?.lead_id}`
      );
    } catch (error) {
      console.error('Error syncing enquiry to Meritto:', error);
      throw error;
    }
  }

  /**
   * Determine lead quality for enquiry based on criteria
   */
  private determineLeadQuality(enquiry: CreateEnquiryData): LeadQuality {
    // High-value indicators
    const hasCourseInterest =
      enquiry.course_of_interest && enquiry.course_of_interest !== '';
    const hasProfessionalStatus =
      enquiry.professional_status && enquiry.professional_status !== '';
    const hasCareerGoals = enquiry.career_goals && enquiry.career_goals !== '';
    const isWorkingProfessional =
      enquiry.professional_status === 'A Working Professional';
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
   * Helper function to add field only if it has a value
   */
  private addFieldIfExists(obj: any, key: string, value: any): void {
    if (value !== null && value !== undefined && value !== '') {
      obj[key] = value;
    }
  }
}
