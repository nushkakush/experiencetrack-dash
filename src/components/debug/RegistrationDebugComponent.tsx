import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileExtendedService } from '@/services/profileExtended.service';
import { ValidationUtils } from '@/utils/validation';

interface DebugData {
  profileId: string;
  basicProfile: any;
  extendedProfile: any;
  formData: any;
  validationErrors: Record<string, string>;
}

export const RegistrationDebugComponent: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDebugData = async () => {
    setLoading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      const profileId = user.id;
      console.log('Loading debug data for profileId:', profileId);

      // Load basic profile
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (basicError) {
        console.error('Error loading basic profile:', basicError);
      }

      // Load extended profile
      const service = ProfileExtendedService.getInstance();
      const extendedProfile = await service.getProfileExtended(profileId);

      // Parse date of birth
      let parsedDateOfBirth = { day: '', month: '', year: '' };
      if (basicProfile?.date_of_birth) {
        const date = new Date(basicProfile.date_of_birth);
        parsedDateOfBirth = {
          day: date.getDate().toString().padStart(2, '0'),
          month: (date.getMonth() + 1).toString().padStart(2, '0'),
          year: date.getFullYear().toString(),
        };
      }

      // Create form data similar to ApplicationStep
      const formData = {
        // Personal Information
        full_name: basicProfile
          ? `${basicProfile.first_name || ''} ${basicProfile.last_name || ''}`.trim()
          : '',
        email: basicProfile?.email || '',
        contact_no: basicProfile?.phone || '',
        contact_no_verified: extendedProfile?.contact_no_verified || false,
        date_of_birth: parsedDateOfBirth,
        linkedin_profile: extendedProfile?.linkedin_profile || '',
        instagram_id: extendedProfile?.instagram_id || '',
        gender: extendedProfile?.gender || '',
        current_address: extendedProfile?.current_address || '',
        city: extendedProfile?.city || '',
        state: extendedProfile?.state || '',
        postal_zip_code: extendedProfile?.postal_zip_code || '',

        // Education Information
        highest_education_level: basicProfile?.qualification || '',
        field_of_study: extendedProfile?.field_of_study || '',
        institution_name: extendedProfile?.institution_name || '',
        graduation_month: extendedProfile?.graduation_month || '',
        graduation_year: extendedProfile?.graduation_year || undefined,
        has_work_experience: extendedProfile?.has_work_experience || false,
        work_experience_type: extendedProfile?.work_experience_type || '',
        job_description: extendedProfile?.job_description || '',
        company_name: extendedProfile?.company_name || '',
        work_start_month: extendedProfile?.work_start_month || '',
        work_start_year: extendedProfile?.work_start_year || undefined,
        work_end_month: extendedProfile?.work_end_month || '',
        work_end_year: extendedProfile?.work_end_year || undefined,

        // Parental Information
        father_first_name: extendedProfile?.father_first_name || '',
        father_last_name: extendedProfile?.father_last_name || '',
        father_contact_no: extendedProfile?.father_contact_no || '',
        father_occupation: extendedProfile?.father_occupation || '',
        father_email: extendedProfile?.father_email || '',
        mother_first_name: extendedProfile?.mother_first_name || '',
        mother_last_name: extendedProfile?.mother_last_name || '',
        mother_contact_no: extendedProfile?.mother_contact_no || '',
        mother_occupation: extendedProfile?.mother_occupation || '',
        mother_email: extendedProfile?.mother_email || '',
        applied_financial_aid: extendedProfile?.applied_financial_aid || false,

        // Financial Aid Details
        loan_applicant: extendedProfile?.loan_applicant || '',
        loan_type: extendedProfile?.loan_type || '',
        loan_amount: extendedProfile?.loan_amount || '',
        cibil_score: extendedProfile?.cibil_score || '',
        family_income: extendedProfile?.family_income || '',

        // Emergency Contact Details
        emergency_first_name: extendedProfile?.emergency_first_name || '',
        emergency_last_name: extendedProfile?.emergency_last_name || '',
        emergency_contact_no: extendedProfile?.emergency_contact_no || '',
        emergency_relationship: extendedProfile?.emergency_relationship || '',
      };

      // Run validation
      const validationErrors: Record<string, string> = {};

      // Contact number validation
      if (!formData.contact_no.trim()) {
        validationErrors['contact_no'] = 'Contact number is required';
      } else if (!ValidationUtils.isValidPhone(formData.contact_no)) {
        validationErrors['contact_no'] =
          'Please enter a valid Indian phone number (10 digits starting with 6-9)';
      }

      // Date of birth validation
      if (
        !formData.date_of_birth.day ||
        !formData.date_of_birth.month ||
        !formData.date_of_birth.year
      ) {
        validationErrors['date_of_birth'] = 'Date of birth is required';
      } else if (
        !ValidationUtils.isValidAge(
          formData.date_of_birth.day,
          formData.date_of_birth.month,
          formData.date_of_birth.year,
          16
        )
      ) {
        validationErrors['date_of_birth'] = 'You must be at least 16 years old to apply';
      }

      // Gender validation
      if (!formData.gender) {
        validationErrors['gender'] = 'Please select your gender';
      }

      // Address validation
      if (!formData.current_address.trim()) {
        validationErrors['current_address'] = 'Current address is required';
      }
      if (!formData.city.trim()) {
        validationErrors['city'] = 'City is required';
      }
      if (!formData.state.trim()) {
        validationErrors['state'] = 'State is required';
      }
      if (!formData.postal_zip_code.trim()) {
        validationErrors['postal_zip_code'] = 'Postal/Zip code is required';
      } else if (!ValidationUtils.isValidPostalCode(formData.postal_zip_code)) {
        validationErrors['postal_zip_code'] =
          'Please enter a valid 6-digit Indian postal code';
      }

      // Education validation
      if (!formData.highest_education_level.trim()) {
        validationErrors['highest_education_level'] = 'Education level is required';
      }
      if (!formData.institution_name.trim()) {
        validationErrors['institution_name'] = 'Institution name is required';
      }
      if (!formData.graduation_year) {
        validationErrors['graduation_year'] = 'Graduation year is required';
      } else if (
        !ValidationUtils.isValidGraduationYear(formData.graduation_year)
      ) {
        validationErrors['graduation_year'] = 'Please enter a valid graduation year';
      }

      // Parental Information validation
      if (!formData.father_first_name.trim()) {
        validationErrors['father_first_name'] = "Father's first name is required";
      }
      if (!formData.father_last_name.trim()) {
        validationErrors['father_last_name'] = "Father's last name is required";
      }
      if (!formData.mother_first_name.trim()) {
        validationErrors['mother_first_name'] = "Mother's first name is required";
      }
      if (!formData.mother_last_name.trim()) {
        validationErrors['mother_last_name'] = "Mother's last name is required";
      }

      // Parental contact validation
      if (!formData.father_contact_no.trim()) {
        validationErrors['father_contact_no'] = "Father's contact number is required";
      } else if (!ValidationUtils.isValidPhone(formData.father_contact_no)) {
        validationErrors['father_contact_no'] =
          'Please enter a valid Indian phone number';
      }

      if (!formData.father_email.trim()) {
        validationErrors['father_email'] = "Father's email is required";
      } else if (!ValidationUtils.isValidEmail(formData.father_email)) {
        validationErrors['father_email'] = 'Please enter a valid email address';
      }

      if (!formData.mother_contact_no.trim()) {
        validationErrors['mother_contact_no'] = "Mother's contact number is required";
      } else if (!ValidationUtils.isValidPhone(formData.mother_contact_no)) {
        validationErrors['mother_contact_no'] =
          'Please enter a valid Indian phone number';
      }

      if (!formData.mother_email.trim()) {
        validationErrors['mother_email'] = "Mother's email is required";
      } else if (!ValidationUtils.isValidEmail(formData.mother_email)) {
        validationErrors['mother_email'] = 'Please enter a valid email address';
      }

      // Emergency Contact validation
      if (!formData.emergency_first_name.trim()) {
        validationErrors['emergency_first_name'] =
          'Emergency contact first name is required';
      }
      if (!formData.emergency_last_name.trim()) {
        validationErrors['emergency_last_name'] =
          'Emergency contact last name is required';
      }
      if (!formData.emergency_contact_no.trim()) {
        validationErrors['emergency_contact_no'] =
          'Emergency contact number is required';
      } else if (!ValidationUtils.isValidPhone(formData.emergency_contact_no)) {
        validationErrors['emergency_contact_no'] =
          'Please enter a valid Indian phone number';
      }
      if (!formData.emergency_relationship.trim()) {
        validationErrors['emergency_relationship'] =
          'Emergency contact relationship is required';
      }

      setDebugData({
        profileId,
        basicProfile,
        extendedProfile,
        formData,
        validationErrors,
      });

      console.log('🔍 [DEBUG] Debug data loaded:', {
        profileId,
        basicProfile,
        extendedProfile,
        formData,
        validationErrors,
      });
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugData();
  }, []);

  if (loading) {
    return <div>Loading debug data...</div>;
  }

  if (!debugData) {
    return <div>No debug data available</div>;
  }

  const { formData, validationErrors } = debugData;
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Registration Debug Information</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Validation Status</h3>
        <div className={`p-3 rounded ${hasErrors ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {hasErrors ? `❌ Form has ${Object.keys(validationErrors).length} validation errors` : '✅ Form is valid'}
        </div>
      </div>

      {hasErrors && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Validation Errors</h3>
          <div className="bg-red-50 p-3 rounded">
            {Object.entries(validationErrors).map(([field, error]) => (
              <div key={field} className="text-red-700">
                <strong>{field}:</strong> {error}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Form Data</h3>
        <div className="bg-white p-3 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>

      <button
        onClick={loadDebugData}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Debug Data
      </button>
    </div>
  );
};
