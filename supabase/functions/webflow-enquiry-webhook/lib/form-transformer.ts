import type { ParsedSubmissionData, CreateEnquiryData } from './types.ts';
import { WebflowClient } from './webflow-client.ts';
import {
  mapProfessionalStatus,
  mapRelocationPossible,
  mapInvestmentWilling,
} from '../utils/field-mappers.ts';
import {
  parseAge,
  calculateAgeFromDateOfBirth,
  validateRequiredFields,
} from '../utils/validation-utils.ts';

/**
 * Transform Webflow form submissions to enquiry format
 */
export class FormTransformer {
  /**
   * Transform Webflow form submission data to our enquiry format
   */
  static async transformSubmissionToEnquiry(
    submission: ParsedSubmissionData,
    webflowClient: WebflowClient | null
  ): Promise<CreateEnquiryData | null> {
    try {
      const data = submission.formResponse;

      console.log('🔍 Webflow Form Data Debug:', {
        formId: submission.formId,
        rawData: data,
        availableKeys: Object.keys(data),
      });

      // Get form name from the submission
      const formName = webflowClient
        ? await webflowClient.getFormName(submission.formId)
        : `Form ${submission.formId}`;

      // Check if this is a Program files-Brochure form
      const isProgramBrochureForm = this.isProgramBrochureForm(
        formName,
        submission.formId
      );

      let enquiryData: CreateEnquiryData;

      if (isProgramBrochureForm) {
        enquiryData = this.transformProgramBrochureForm(
          data,
          formName,
          submission.dateSubmitted
        );
      } else if (formName === 'Email Form') {
        enquiryData = this.transformEmailForm(
          data,
          formName,
          submission.dateSubmitted
        );
      } else {
        enquiryData = this.transformGenericForm(
          data,
          formName,
          submission.dateSubmitted
        );
      }

      console.log('🔍 Mapped Enquiry Data:', {
        form_name: enquiryData.form_name,
        age: enquiryData.age,
        age_type: typeof enquiryData.age,
        isProgramBrochureForm,
        full_data: enquiryData,
      });

      // DEBUG: Log specific field mappings
      console.log('🔍 DEBUG - Field Mapping Results:');
      console.log('date_of_birth:', enquiryData.date_of_birth);
      console.log('gender:', enquiryData.gender);
      console.log('location:', enquiryData.location);
      console.log('professional_status:', enquiryData.professional_status);
      console.log('relocation_possible:', enquiryData.relocation_possible);
      console.log('investment_willing:', enquiryData.investment_willing);
      console.log('career_goals:', enquiryData.career_goals);

      // Validate required fields
      const validation = validateRequiredFields(enquiryData, formName);
      if (!validation.isValid) {
        console.warn(
          `Invalid submission data - missing required fields: ${validation.missingFields?.join(', ')}`,
          submission
        );
        return null;
      }

      return enquiryData;
    } catch (error) {
      console.error('Error transforming submission to enquiry:', error);
      return null;
    }
  }

  /**
   * Check if this is a Program files-Brochure form
   */
  private static isProgramBrochureForm(
    formName: string,
    formId: string
  ): boolean {
    return (
      formName === 'Program files-Brochure' ||
      formId === '68b14d9c566b44254d7f1c1c' ||
      formName.includes('Brochure') ||
      formName.includes('brochure')
    );
  }

  /**
   * Transform Program files-Brochure form data
   */
  private static transformProgramBrochureForm(
    data: { [key: string]: string | number | boolean | undefined },
    formName: string,
    dateSubmitted: string
  ): CreateEnquiryData {
    const dateOfBirth = this.extractDateOfBirth(data);

    return {
      full_name: String(data['First Name'] || ''),
      email: String(data['Email'] || ''),
      phone: String(data['Phone'] || ''),
      date_of_birth: dateOfBirth,
      age: calculateAgeFromDateOfBirth(dateOfBirth),
      professional_status: mapProfessionalStatus(
        String(data['You are currently a'] || '')
      ),
      relocation_possible: 'Maybe', // Default since not in form
      investment_willing: 'Maybe', // Default since not in form
      gender: undefined,
      location: undefined,
      career_goals: undefined,
      form_name: formName,
      wf_created_at: dateSubmitted,
      status: 'active',
    };
  }

  /**
   * Transform Email Form data (only has email)
   */
  private static transformEmailForm(
    data: { [key: string]: string | number | boolean | undefined },
    formName: string,
    dateSubmitted: string
  ): CreateEnquiryData {
    return {
      full_name: 'Email Lead', // Default name for email-only submissions
      email: String(data.Email || data.email || ''),
      phone: 'Not provided', // Default phone for email-only submissions
      date_of_birth: null,
      age: undefined,
      professional_status: 'student', // Default status
      relocation_possible: 'Maybe', // Default value
      investment_willing: 'Maybe', // Default value
      gender: undefined,
      location: undefined,
      career_goals: undefined,
      course_of_interest: undefined,
      // UTM parameters for marketing campaign tracking
      utm_source: this.extractUTMField(data, 'utm_source'),
      utm_medium: this.extractUTMField(data, 'utm_medium'),
      utm_campaign: this.extractUTMField(data, 'utm_campaign'),
      utm_content: this.extractUTMField(data, 'utm_content'),
      utm_term: this.extractUTMField(data, 'utm_term'),
      form_name: formName,
      wf_created_at: dateSubmitted,
      status: 'active',
    };
  }

  /**
   * Transform generic form data (Contact Form, etc.)
   */
  private static transformGenericForm(
    data: { [key: string]: string | number | boolean | undefined },
    formName: string,
    dateSubmitted: string
  ): CreateEnquiryData {
    return {
      full_name: this.extractFullName(data),
      email: this.extractEmail(data),
      date_of_birth: this.extractDateOfBirth(data),
      age: parseAge(data.age || data.Age || data['age'] || data['Age']),
      phone: this.extractPhone(data),
      gender: this.extractGender(data),
      location: this.extractLocation(data),
      professional_status: mapProfessionalStatus(
        this.extractProfessionalStatus(data)
      ),
      relocation_possible: mapRelocationPossible(this.extractRelocation(data)),
      investment_willing: mapInvestmentWilling(this.extractInvestment(data)),
      career_goals: this.extractCareerGoals(data),
      course_of_interest: this.extractCourseOfInterest(data),
      // UTM parameters for marketing campaign tracking
      utm_source: this.extractUTMField(data, 'utm_source'),
      utm_medium: this.extractUTMField(data, 'utm_medium'),
      utm_campaign: this.extractUTMField(data, 'utm_campaign'),
      utm_content: this.extractUTMField(data, 'utm_content'),
      utm_term: this.extractUTMField(data, 'utm_term'),
      form_name: formName,
      wf_created_at: dateSubmitted,
      status: 'active',
    };
  }

  // Field extraction helpers
  private static extractFullName(data: { [key: string]: any }): string {
    return String(
      data['Full Name'] ||
        data['First Name'] ||
        data.name ||
        data['First-Name'] ||
        data['first-name'] ||
        data.firstName ||
        ''
    );
  }

  private static extractEmail(data: { [key: string]: any }): string {
    return String(data['Email ID'] || data['Email'] || data.email || '');
  }

  private static extractPhone(data: { [key: string]: any }): string {
    return String(
      data['Phone No.'] ||
        data['Phone'] ||
        data.phone ||
        data['phone-number'] ||
        data.phoneNumber ||
        ''
    );
  }

  private static extractDateOfBirth(data: {
    [key: string]: any;
  }): string | null {
    const dob =
      data['Date of Birth'] ||
      data['date-of-birth'] ||
      data['dateOfBirth'] ||
      data.dateOfBirth ||
      data['DoB'] ||
      data.dob ||
      data.DoB ||
      data.birthday ||
      data['birth-date'] ||
      data.birthDate ||
      data['Date-of-Birth'] ||
      null;

    return dob ? String(dob) : null;
  }

  private static extractGender(data: {
    [key: string]: any;
  }): string | undefined {
    const gender =
      data['Specify Your Gender'] ||
      data['specify-your-gender'] ||
      data['Gender'] ||
      data.gender ||
      data['sex'] ||
      data.sex;

    return gender ? String(gender) : undefined;
  }

  private static extractLocation(data: {
    [key: string]: any;
  }): string | undefined {
    const location =
      data['Where Do You Live?'] ||
      data['where-do-you-live'] ||
      data['Location'] ||
      data.location ||
      data.city ||
      data.address ||
      data['current-location'] ||
      data.currentLocation ||
      data['place'] ||
      data.place;

    return location ? String(location) : undefined;
  }

  private static extractProfessionalStatus(data: {
    [key: string]: any;
  }): string {
    return String(
      data['I am...'] ||
        data['i-am'] ||
        data['i-am-a'] ||
        data['I am'] ||
        data['You are currently a'] ||
        data.professionalStatus ||
        data.professional_status ||
        data['professional-status'] ||
        data.occupation ||
        data.role ||
        data['status'] ||
        data.status ||
        ''
    );
  }

  private static extractRelocation(data: { [key: string]: any }): string {
    return String(
      data[
        'Will it be possible for you to relocate to Bangalore for this program?'
      ] ||
        data['relocate-intent'] ||
        data.relocationPossible ||
        data.relocation_possible ||
        data['relocation-possible'] ||
        data.relocation ||
        'Maybe'
    );
  }

  private static extractInvestment(data: { [key: string]: any }): string {
    return String(
      data[
        'Are you willing to invest 1-2 years of your time for your future?'
      ] ||
        data['time-intent'] ||
        data.investmentWilling ||
        data.investment_willing ||
        data['investment-willing'] ||
        data.investment ||
        data.budget ||
        'Maybe'
    );
  }

  private static extractCareerGoals(data: {
    [key: string]: any;
  }): string | undefined {
    const goals =
      data['What are your career goals?'] ||
      data['Career Goals'] ||
      data['Career-Goals'] ||
      data.careerGoals ||
      data.career_goals ||
      data['career-goals'] ||
      data.goals ||
      data.objectives;

    return goals ? String(goals) : undefined;
  }

  private static extractCourseOfInterest(data: {
    [key: string]: any;
  }): string | undefined {
    const course =
      data['Course of Interest'] ||
      data.courseOfInterest ||
      data.course_of_interest ||
      data['course-of-interest'] ||
      data.course ||
      data.program;

    return course ? String(course) : undefined;
  }

  private static extractUTMField(
    data: { [key: string]: any },
    field: string
  ): string | undefined {
    const value =
      data[field] ||
      data[field.replace('_', '')] ||
      data[field.replace('_', '-')];
    return value ? String(value) : undefined;
  }
}
