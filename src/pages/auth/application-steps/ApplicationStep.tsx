import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { ApplicationData } from '../ApplicationProcess';
import { ProfileExtendedService } from '@/services/profileExtended.service';
import { useUnifiedAutoSave } from '@/hooks/useUnifiedAutoSave';
import { useApplicationFeePayment } from '@/hooks/useApplicationFeePayment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PersonalInformationSection from './PersonalInformationSection';
import EducationInformationSection from './EducationInformationSection';
import ParentalInformationSection from './ParentalInformationSection';
import EmergencyContactSection from './EmergencyContactSection';
import { FormData, ApplicationStepProps } from './types';
import { ValidationUtils } from '@/utils/validation';

const ApplicationStep = ({
  data,
  profileId,
  onComplete,
  onSave,
  saving,
  onPaymentInitiated,
  onPaymentCompleted,
}: ApplicationStepProps) => {
  const {
    handleFieldChange,
    handleFieldBlur,
    handleDateOfBirthChange: unifiedHandleDateOfBirthChange,
    forceSave,
  } = useUnifiedAutoSave({ 
    profileId,
    enableRealtimeSync: true,
    applicationId: data.id,
  });
  const {
    feeInfo,
    loading: feeLoading,
    processing: paymentProcessing,
    isPaymentCompleted,
    paymentCompletedAt,
    initiatePayment,
  } = useApplicationFeePayment(profileId);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    full_name: '',
    email: '',
    contact_no: '',
    contact_no_verified: false,
    date_of_birth: {
      day: '',
      month: '',
      year: '',
    },
    linkedin_profile: '',
    instagram_id: '',
    gender: '',
    current_address: '',
    city: '',
    state: '',
    postal_zip_code: '',

    // Education Information
    highest_education_level: '',
    field_of_study: '',
    institution_name: '',
    graduation_month: '',
    graduation_year: undefined,
    has_work_experience: false,
    work_experience_type: '',
    job_description: '',
    company_name: '',
    work_start_month: '',
    work_start_year: undefined,
    work_end_month: '',
    work_end_year: undefined,

    // Parental Information
    father_first_name: '',
    father_last_name: '',
    father_contact_no: '',
    father_occupation: '',
    father_email: '',
    mother_first_name: '',
    mother_last_name: '',
    mother_contact_no: '',
    mother_occupation: '',
    mother_email: '',
    applied_financial_aid: false,

    // Financial Aid Details
    loan_applicant: '',
    loan_type: '',
    loan_amount: '',
    cibil_score: '',
    family_income: '',

    // Emergency Contact Details
    emergency_first_name: '',
    emergency_last_name: '',
    emergency_contact_no: '',
    emergency_relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debug useEffect to track formData changes
  useEffect(() => {
    console.log('🔍 [DEBUG] formData state changed:', formData);
    console.log('🔍 [DEBUG] formData required field check:', {
      contact_no: formData.contact_no,
      gender: formData.gender,
      current_address: formData.current_address,
      city: formData.city,
      state: formData.state,
      postal_zip_code: formData.postal_zip_code,
      father_first_name: formData.father_first_name,
      mother_first_name: formData.mother_first_name,
      emergency_first_name: formData.emergency_first_name,
    });
  }, [formData]);

  // Load profile data from both profiles and profile_extended tables
  useEffect(() => {
    console.log(
      '🔍 [DEBUG] ApplicationStep useEffect triggered with profileId:',
      profileId
    );
    console.log(
      '🔍 [DEBUG] profileId type:',
      typeof profileId
    );
    console.log(
      '🔍 [DEBUG] profileId truthy:',
      !!profileId
    );
    
    if (!profileId) {
      console.log('❌ [DEBUG] No profileId available, skipping data load');
      return;
    }
    
    const loadProfileData = async () => {
      console.log('🔍 [DEBUG] Starting loadProfileData...');
      try {
        // Load basic profile data from profiles table
        const { data: basicProfile, error: basicError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (basicError && basicError.code !== 'PGRST116') {
          console.error('❌ [DEBUG] Error loading basic profile:', basicError);
          return; // Don't continue if we can't load basic profile
        } else {
          console.log('✅ [DEBUG] Basic profile loaded:', basicProfile);
        }

        // Load extended profile data from profile_extended table
        console.log('🔍 [DEBUG] Loading extended profile data...');
        const service = ProfileExtendedService.getInstance();
        const extendedData = await service.getProfileExtended(profileId);
        console.log('✅ [DEBUG] Extended profile data loaded:', extendedData);

        // Parse date of birth from profiles table
        let parsedDateOfBirth = { day: '', month: '', year: '' };
        if (basicProfile?.date_of_birth) {
          const date = new Date(basicProfile.date_of_birth);
          parsedDateOfBirth = {
            day: date.getDate().toString().padStart(2, '0'),
            month: (date.getMonth() + 1).toString().padStart(2, '0'),
            year: date.getFullYear().toString(),
          };
          console.log('✅ [DEBUG] Parsed date of birth:', parsedDateOfBirth);
        } else {
          console.log('❌ [DEBUG] No date of birth in basic profile');
        }

        // Combine data from both tables, prioritizing profiles table for disabled fields
        const newFormData = {
          // Personal Information - use profiles table data for disabled fields, extended for editable
          full_name:
            (basicProfile
              ? `${basicProfile.first_name || ''} ${basicProfile.last_name || ''}`.trim()
              : '') || '',
          email: basicProfile?.email || '',
          contact_no: basicProfile?.phone || '', // This will be editable
          contact_no_verified: extendedData?.contact_no_verified || false,
          date_of_birth: parsedDateOfBirth, // This will be editable
          linkedin_profile: extendedData?.linkedin_profile || '',
          instagram_id: extendedData?.instagram_id || '',
          gender: extendedData?.gender || '',
          current_address: extendedData?.current_address || '',
          city: extendedData?.city || '',
          state: extendedData?.state || '',
          postal_zip_code: extendedData?.postal_zip_code || '',

          // Education Information - use profiles table qualification as base (editable)
          highest_education_level: basicProfile?.qualification || '', // This will be editable
          field_of_study: extendedData?.field_of_study || '',
          institution_name: extendedData?.institution_name || '',
          graduation_month: extendedData?.graduation_month || '',
          graduation_year: extendedData?.graduation_year || undefined,
          has_work_experience: extendedData?.has_work_experience || false,
          work_experience_type: extendedData?.work_experience_type || '',
          job_description: extendedData?.job_description || '',
          company_name: extendedData?.company_name || '',
          work_start_month: extendedData?.work_start_month || '',
          work_start_year: extendedData?.work_start_year || undefined,
          work_end_month: extendedData?.work_end_month || '',
          work_end_year: extendedData?.work_end_year || undefined,

          // Parental Information - only in extended table
          father_first_name: extendedData?.father_first_name || '',
          father_last_name: extendedData?.father_last_name || '',
          father_contact_no: extendedData?.father_contact_no || '',
          father_occupation: extendedData?.father_occupation || '',
          father_email: extendedData?.father_email || '',
          mother_first_name: extendedData?.mother_first_name || '',
          mother_last_name: extendedData?.mother_last_name || '',
          mother_contact_no: extendedData?.mother_contact_no || '',
          mother_occupation: extendedData?.mother_occupation || '',
          mother_email: extendedData?.mother_email || '',
          applied_financial_aid: extendedData?.applied_financial_aid || false,

          // Financial Aid Details
          loan_applicant: extendedData?.loan_applicant || '',
          loan_type: extendedData?.loan_type || '',
          loan_amount: extendedData?.loan_amount || '',
          cibil_score: extendedData?.cibil_score || '',
          family_income: extendedData?.family_income || '',

          // Emergency Contact Details - only in extended table
          emergency_first_name: extendedData?.emergency_first_name || '',
          emergency_last_name: extendedData?.emergency_last_name || '',
          emergency_contact_no: extendedData?.emergency_contact_no || '',
          emergency_relationship: extendedData?.emergency_relationship || '',
        };

        console.log('🔍 [DEBUG] About to set form data:', newFormData);
        console.log('🔍 [DEBUG] Form data keys:', Object.keys(newFormData));
        console.log('🔍 [DEBUG] Form data has required fields:', {
          contact_no: !!newFormData.contact_no,
          gender: !!newFormData.gender,
          current_address: !!newFormData.current_address,
          city: !!newFormData.city,
          state: !!newFormData.state,
          postal_zip_code: !!newFormData.postal_zip_code,
          father_first_name: !!newFormData.father_first_name,
          mother_first_name: !!newFormData.mother_first_name,
          emergency_first_name: !!newFormData.emergency_first_name,
        });
        
        setFormData(newFormData);
        console.log('✅ [DEBUG] Form data has been set');

        if (extendedData) {
          setProfileData(extendedData);
          console.log('✅ [DEBUG] Profile data has been set');
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        console.log('Profile data loading completed, setting loading to false');
        setLoading(false);
      }
    };

    loadProfileData();
  }, [profileId]);

  // Function to refresh basic profile data from database
  const refreshBasicProfileData = async () => {
    try {
      const { data: basicProfile, error: basicError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (basicError && basicError.code !== 'PGRST116') {
        console.error('Error refreshing basic profile:', basicError);
        return;
      }

      if (basicProfile) {
        // Parse date of birth from profiles table
        let parsedDateOfBirth = { day: '', month: '', year: '' };
        if (basicProfile.date_of_birth) {
          const date = new Date(basicProfile.date_of_birth);
          parsedDateOfBirth = {
            day: date.getDate().toString().padStart(2, '0'),
            month: (date.getMonth() + 1).toString().padStart(2, '0'),
            year: date.getFullYear().toString(),
          };
        }

        // Update form data with fresh data from profiles table
        setFormData(prev => ({
          ...prev,
          full_name:
            `${basicProfile.first_name || ''} ${basicProfile.last_name || ''}`.trim() ||
            '',
          email: basicProfile.email || '',
          contact_no: basicProfile.phone || '',
          date_of_birth: parsedDateOfBirth,
          highest_education_level: basicProfile.qualification || '',
        }));
      }
    } catch (error) {
      console.error('Error refreshing basic profile data:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Define which fields belong to which table
    const profilesFields = ['contact_no', 'highest_education_level'];
    const extendedFields = [
      'contact_no_verified',
      'linkedin_profile',
      'instagram_id',
      'gender',
      'current_address',
      'city',
      'state',
      'postal_zip_code',
      'field_of_study',
      'institution_name',
      'graduation_month',
      'graduation_year',
      'has_work_experience',
      'work_experience_type',
      'job_description',
      'company_name',
      'work_start_month',
      'work_start_year',
      'work_end_month',
      'work_end_year',
      'father_first_name',
      'father_last_name',
      'father_contact_no',
      'father_occupation',
      'father_email',
      'mother_first_name',
      'mother_last_name',
      'mother_contact_no',
      'mother_occupation',
      'mother_email',
      'applied_financial_aid',
      'loan_applicant',
      'loan_type',
      'loan_amount',
      'cibil_score',
      'family_income',
      'emergency_first_name',
      'emergency_last_name',
      'emergency_contact_no',
      'emergency_relationship',
    ];

    // Handle special case for date_of_birth
    if (field === 'date_of_birth') {
      // Date of birth is handled separately in handleDateOfBirthChange
      // No need to save here as it's handled when the date is complete
    } else if (profilesFields.includes(field)) {
      // Map field names to database column names
      const dbField = field === 'contact_no' ? 'phone' : 'qualification';
      handleFieldChange(dbField, value, 'profiles');
    } else if (extendedFields.includes(field)) {
      handleFieldChange(field as any, value, 'profileExtended');
    }

    // Real-time validation for specific fields
    validateField(field, value);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    // Phone number validation
    if (
      field === 'contact_no' ||
      field === 'father_contact_no' ||
      field === 'mother_contact_no' ||
      field === 'emergency_contact_no'
    ) {
      if (value && !ValidationUtils.isValidPhone(value)) {
        newErrors[field] =
          'Please enter a valid Indian phone number (10 digits starting with 6-9)';
      } else {
        delete newErrors[field];
      }
    }

    // Email validation
    if (field === 'father_email' || field === 'mother_email') {
      if (value && !ValidationUtils.isValidEmail(value)) {
        newErrors[field] = 'Please enter a valid email address';
      } else {
        delete newErrors[field];
      }
    }

    // Postal code validation
    if (field === 'postal_zip_code') {
      if (value && !ValidationUtils.isValidPostalCode(value)) {
        newErrors[field] = 'Please enter a valid 6-digit Indian postal code';
      } else {
        delete newErrors[field];
      }
    }

    // LinkedIn URL validation
    if (field === 'linkedin_profile') {
      if (value && !ValidationUtils.isValidUrl(value)) {
        newErrors[field] = 'Please enter a valid LinkedIn profile URL';
      } else {
        delete newErrors[field];
      }
    }

    // CIBIL score validation
    if (field === 'cibil_score') {
      if (value && !ValidationUtils.isValidCibilScore(value)) {
        newErrors[field] = 'CIBIL score must be between 300 and 900';
      } else {
        delete newErrors[field];
      }
    }

    // Loan amount validation
    if (field === 'loan_amount') {
      if (value && !ValidationUtils.isValidLoanAmount(value)) {
        newErrors[field] = 'Please enter a valid loan amount';
      } else {
        delete newErrors[field];
      }
    }

    setErrors(newErrors);
  };

  const handleDateOfBirthChange = (
    field: 'day' | 'month' | 'year',
    value: string
  ) => {
    const newDateOfBirth = {
      ...formData.date_of_birth,
      [field]: value,
    };

    setFormData(prev => ({
      ...prev,
      date_of_birth: newDateOfBirth,
    }));

    // Clear date errors when user starts typing
    if (errors.date_of_birth) {
      setErrors(prev => ({
        ...prev,
        date_of_birth: '',
      }));
    }

    // Auto-save when all date fields are filled using unified system
    if (newDateOfBirth.day && newDateOfBirth.month && newDateOfBirth.year) {
      unifiedHandleDateOfBirthChange(newDateOfBirth);
    }
  };

  const handleInputBlur = (field: string) => {
    // Define which fields belong to which table
    const profilesFields = ['contact_no', 'highest_education_level'];
    const extendedFields = [
      'contact_no_verified',
      'linkedin_profile',
      'instagram_id',
      'gender',
      'current_address',
      'city',
      'state',
      'postal_zip_code',
      'field_of_study',
      'institution_name',
      'graduation_month',
      'graduation_year',
      'has_work_experience',
      'work_experience_type',
      'job_description',
      'company_name',
      'work_start_month',
      'work_start_year',
      'work_end_month',
      'work_end_year',
      'father_first_name',
      'father_last_name',
      'father_contact_no',
      'father_occupation',
      'father_email',
      'mother_first_name',
      'mother_last_name',
      'mother_contact_no',
      'mother_occupation',
      'mother_email',
      'applied_financial_aid',
      'loan_applicant',
      'loan_type',
      'loan_amount',
      'cibil_score',
      'family_income',
      'emergency_first_name',
      'emergency_last_name',
      'emergency_contact_no',
      'emergency_relationship',
    ];

    if (profilesFields.includes(field)) {
      // Map field names to database column names
      const dbField = field === 'contact_no' ? 'phone' : 'qualification';
      handleFieldBlur(
        dbField,
        formData[field as keyof typeof formData],
        'profiles'
      );
    } else if (extendedFields.includes(field)) {
      handleFieldBlur(
        field as any,
        formData[field as keyof typeof formData],
        'profileExtended'
      );
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    console.log('🔍 [DEBUG] validateForm called with formData:', formData);

    // Personal Info validation - skip disabled fields (full_name, email)
    // Full name and email are loaded from profiles table and disabled

    // Contact number validation
    if (!formData.contact_no.trim()) {
      newErrors['contact_no'] = 'Contact number is required';
      console.log('❌ [DEBUG] Contact number validation failed: empty');
    } else if (!ValidationUtils.isValidPhone(formData.contact_no)) {
      newErrors['contact_no'] =
        'Please enter a valid Indian phone number (10 digits starting with 6-9)';
      console.log('❌ [DEBUG] Contact number validation failed: invalid format');
    } else {
      console.log('✅ [DEBUG] Contact number validation passed');
    }

    // Date of birth validation
    if (
      !formData.date_of_birth.day ||
      !formData.date_of_birth.month ||
      !formData.date_of_birth.year
    ) {
      newErrors['date_of_birth'] = 'Date of birth is required';
      console.log('❌ [DEBUG] Date of birth validation failed: missing parts', {
        day: formData.date_of_birth.day,
        month: formData.date_of_birth.month,
        year: formData.date_of_birth.year
      });
    } else if (
      !ValidationUtils.isValidAge(
        formData.date_of_birth.day,
        formData.date_of_birth.month,
        formData.date_of_birth.year,
        16
      )
    ) {
      newErrors['date_of_birth'] = 'You must be at least 16 years old to apply';
      console.log('❌ [DEBUG] Date of birth validation failed: age requirement');
    } else {
      console.log('✅ [DEBUG] Date of birth validation passed');
    }

    // Gender validation
    if (!formData.gender) {
      newErrors['gender'] = 'Please select your gender';
      console.log('❌ [DEBUG] Gender validation failed: empty');
    } else {
      console.log('✅ [DEBUG] Gender validation passed');
    }

    // Address validation
    if (!formData.current_address.trim()) {
      newErrors['current_address'] = 'Current address is required';
      console.log('❌ [DEBUG] Current address validation failed: empty');
    } else {
      console.log('✅ [DEBUG] Current address validation passed');
    }
    if (!formData.city.trim()) {
      newErrors['city'] = 'City is required';
      console.log('❌ [DEBUG] City validation failed: empty');
    } else {
      console.log('✅ [DEBUG] City validation passed');
    }
    if (!formData.state.trim()) {
      newErrors['state'] = 'State is required';
      console.log('❌ [DEBUG] State validation failed: empty');
    } else {
      console.log('✅ [DEBUG] State validation passed');
    }
    if (!formData.postal_zip_code.trim()) {
      newErrors['postal_zip_code'] = 'Postal/Zip code is required';
      console.log('❌ [DEBUG] Postal code validation failed: empty');
    } else if (!ValidationUtils.isValidPostalCode(formData.postal_zip_code)) {
      newErrors['postal_zip_code'] =
        'Please enter a valid 6-digit Indian postal code';
      console.log('❌ [DEBUG] Postal code validation failed: invalid format');
    } else {
      console.log('✅ [DEBUG] Postal code validation passed');
    }

    // LinkedIn profile validation (optional but if provided, must be valid URL)
    if (
      formData.linkedin_profile.trim() &&
      !ValidationUtils.isValidUrl(formData.linkedin_profile)
    ) {
      newErrors['linkedin_profile'] =
        'Please enter a valid LinkedIn profile URL';
    }

    // Education validation
    if (!formData.highest_education_level.trim()) {
      newErrors['highest_education_level'] = 'Education level is required';
    }
    if (!formData.institution_name.trim()) {
      newErrors['institution_name'] = 'Institution name is required';
    }
    if (!formData.graduation_year) {
      newErrors['graduation_year'] = 'Graduation year is required';
    } else if (
      !ValidationUtils.isValidGraduationYear(formData.graduation_year)
    ) {
      newErrors['graduation_year'] = 'Please enter a valid graduation year';
    }

    // Work experience validation (only if has experience)
    if (formData.has_work_experience) {
      if (!formData.work_experience_type.trim()) {
        newErrors['work_experience_type'] = 'Work experience type is required';
      }
      if (!formData.company_name.trim()) {
        newErrors['company_name'] = 'Company name is required';
      }

      // Validate work experience date range
      if (
        formData.work_start_year &&
        formData.work_start_month &&
        formData.work_end_year &&
        formData.work_end_month
      ) {
        if (
          !ValidationUtils.isValidWorkDateRange(
            formData.work_start_year,
            formData.work_start_month,
            formData.work_end_year,
            formData.work_end_month
          )
        ) {
          newErrors['work_end_year'] = 'End date must be after start date';
        }
      }
    }

    // Parental Information validation
    if (!formData.father_first_name.trim()) {
      newErrors['father_first_name'] = "Father's first name is required";
    }
    if (!formData.father_last_name.trim()) {
      newErrors['father_last_name'] = "Father's last name is required";
    }
    if (!formData.mother_first_name.trim()) {
      newErrors['mother_first_name'] = "Mother's first name is required";
    }
    if (!formData.mother_last_name.trim()) {
      newErrors['mother_last_name'] = "Mother's last name is required";
    }

    // Parental contact validation - now required
    if (!formData.father_contact_no.trim()) {
      newErrors['father_contact_no'] = "Father's contact number is required";
    } else if (!ValidationUtils.isValidPhone(formData.father_contact_no)) {
      newErrors['father_contact_no'] =
        'Please enter a valid Indian phone number';
    }

    if (!formData.father_email.trim()) {
      newErrors['father_email'] = "Father's email is required";
    } else if (!ValidationUtils.isValidEmail(formData.father_email)) {
      newErrors['father_email'] = 'Please enter a valid email address';
    }

    if (!formData.mother_contact_no.trim()) {
      newErrors['mother_contact_no'] = "Mother's contact number is required";
    } else if (!ValidationUtils.isValidPhone(formData.mother_contact_no)) {
      newErrors['mother_contact_no'] =
        'Please enter a valid Indian phone number';
    }

    if (!formData.mother_email.trim()) {
      newErrors['mother_email'] = "Mother's email is required";
    } else if (!ValidationUtils.isValidEmail(formData.mother_email)) {
      newErrors['mother_email'] = 'Please enter a valid email address';
    }

    // Financial Aid validation (only if applied for financial aid)
    if (formData.applied_financial_aid) {
      if (!formData.loan_applicant.trim()) {
        newErrors['loan_applicant'] = 'Please select who applied for the loan';
      }
      if (!formData.loan_type.trim()) {
        newErrors['loan_type'] = 'Please select the type of loan';
      }
      if (!formData.loan_amount.trim()) {
        newErrors['loan_amount'] = 'Loan amount is required';
      } else if (!ValidationUtils.isValidLoanAmount(formData.loan_amount)) {
        newErrors['loan_amount'] = 'Please enter a valid loan amount';
      }
      if (!formData.cibil_score.trim()) {
        newErrors['cibil_score'] = 'CIBIL score is required';
      } else if (!ValidationUtils.isValidCibilScore(formData.cibil_score)) {
        newErrors['cibil_score'] = 'CIBIL score must be between 300 and 900';
      }
      if (!formData.family_income.trim()) {
        newErrors['family_income'] = 'Family income is required';
      }
    }

    // Emergency Contact validation
    if (!formData.emergency_first_name.trim()) {
      newErrors['emergency_first_name'] =
        'Emergency contact first name is required';
    }
    if (!formData.emergency_last_name.trim()) {
      newErrors['emergency_last_name'] =
        'Emergency contact last name is required';
    }
    if (!formData.emergency_contact_no.trim()) {
      newErrors['emergency_contact_no'] =
        'Emergency contact number is required';
    } else if (!ValidationUtils.isValidPhone(formData.emergency_contact_no)) {
      newErrors['emergency_contact_no'] =
        'Please enter a valid Indian phone number';
    }
    if (!formData.emergency_relationship.trim()) {
      newErrors['emergency_relationship'] =
        'Emergency contact relationship is required';
    }

    console.log('🔍 [DEBUG] Validation complete. Errors found:', newErrors);
    console.log('🔍 [DEBUG] Total errors count:', Object.keys(newErrors).length);
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 [DEBUG] Form validation result:', isValid ? 'VALID' : 'INVALID');
    
    return isValid;
  };

  const handleSave = async () => {
    try {
      const service = ProfileExtendedService.getInstance();
      await service.forceSave(profileId);
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 [DEBUG] handleSubmit called');
    console.log('🔍 [DEBUG] feeInfo:', feeInfo);
    console.log('🔍 [DEBUG] isPaymentCompleted:', isPaymentCompleted);
    
    const isFormValid = validateForm();
    console.log('🔍 [DEBUG] Form validation result in handleSubmit:', isFormValid);
    
    if (isFormValid) {
      // Check if payment is required and not already completed
      if (feeInfo && feeInfo.amount > 0 && !isPaymentCompleted) {
        console.log('🔍 [DEBUG] Payment required, proceeding to payment flow');
        // First, save all pending data before initiating payment
        await submitAllDataAndProceedToPayment();
      } else {
        console.log('🔍 [DEBUG] No payment required or already completed, proceeding to next step');
        // No payment required or payment already completed, proceed directly
        proceedToNextStep();
      }
    } else {
      console.log('❌ [DEBUG] Form validation failed, showing error toast');
      toast.error('Please fill in all required fields');
    }
  };

  const submitAllDataAndProceedToPayment = async () => {
    try {
      console.log('🔍 [DEBUG] submitAllDataAndProceedToPayment called');
      
      // Notify parent that payment process is starting
      onPaymentInitiated?.();

      console.log('🔍 [DEBUG] Force saving all pending changes...');
      // Force save all pending changes using the unified auto-save system
      await forceSave();

      console.log('🔍 [DEBUG] Saving using ProfileExtendedService...');
      // Also save using the ProfileExtendedService and sync to Meritto
      const service = ProfileExtendedService.getInstance();
      await service.forceSaveAndSyncToMerito(profileId);

      // Show success message
      toast.success('All data saved successfully!');

      console.log('🔍 [DEBUG] Initiating payment...');
      // Now initiate payment with success callback
      await initiatePayment(() => {
        console.log('🔍 [DEBUG] Payment completed, proceeding to next step');
        onPaymentCompleted?.();
        proceedToNextStep();
      });
    } catch (error) {
      console.error('❌ [DEBUG] Error saving data before payment:', error);
      toast.error('Failed to save data. Please try again.');
      onPaymentCompleted?.();
    }
  };

  const proceedToNextStep = async () => {
    try {
      // Force save all pending changes and sync to Meritto before proceeding
      await forceSave();
      
      const service = ProfileExtendedService.getInstance();
      await service.forceSaveAndSyncToMerito(profileId);
      
      // Convert formData to ApplicationData format for compatibility
      const applicationData = {
        personalInfo: {
        firstName: formData.full_name.split(' ')[0] || '',
        lastName: formData.full_name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.contact_no,
        dateOfBirth: `${formData.date_of_birth.year}-${formData.date_of_birth.month.padStart(2, '0')}-${formData.date_of_birth.day.padStart(2, '0')}`,
        address: formData.current_address,
        city: formData.city,
        state: formData.state,
        pincode: formData.postal_zip_code,
      },
      education: {
        qualification: formData.highest_education_level,
        institution: formData.institution_name,
        yearOfPassing: formData.graduation_year?.toString() || '',
        percentage: '', // Not in new structure
      },
      experience: {
        hasExperience: formData.has_work_experience,
        yearsOfExperience: '', // Not in new structure
        currentCompany: formData.company_name,
        currentRole: formData.job_description,
        previousExperience: '', // Not in new structure
      },
      motivation: {
        whyJoin: '', // Not in new structure
        careerGoals: '', // Not in new structure
        expectations: '', // Not in new structure
      },
    };

      onComplete(applicationData);
    } catch (error) {
      console.error('Error completing extended registration:', error);
      toast.error('Failed to save extended registration data. Please try again.');
    }
  };

  const getError = (field: string) => {
    return errors[field] || '';
  };

  const handleVerifyContact = async () => {
    setIsVerifying(true);
    // TODO: Implement actual verification logic
    setTimeout(() => {
      handleInputChange('contact_no_verified', true);
      toast.success('Contact number verified!');
      setIsVerifying(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading profile data...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-12'>
      {/* Personal Information Section */}
      <PersonalInformationSection
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onDateOfBirthChange={handleDateOfBirthChange}
        onVerifyContact={handleVerifyContact}
        isVerifying={isVerifying}
        getError={getError}
      />

      {/* Education Information Section */}
      <EducationInformationSection
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onDateOfBirthChange={handleDateOfBirthChange}
        onVerifyContact={handleVerifyContact}
        isVerifying={isVerifying}
        getError={getError}
      />

      {/* Parental Information Section */}
      <ParentalInformationSection
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onDateOfBirthChange={handleDateOfBirthChange}
        onVerifyContact={handleVerifyContact}
        isVerifying={isVerifying}
        getError={getError}
      />

      {/* Emergency Contact Section */}
      <EmergencyContactSection
        formData={formData}
        errors={errors}
        onInputChange={handleInputChange}
        onInputBlur={handleInputBlur}
        onDateOfBirthChange={handleDateOfBirthChange}
        onVerifyContact={handleVerifyContact}
        isVerifying={isVerifying}
        getError={getError}
      />

      {/* Action Buttons */}
      <div className='space-y-4'>
        {/* Application Fee Information */}
        {feeLoading ? (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-4 w-4 animate-spin mr-2' />
            <span className='text-sm text-muted-foreground'>
              Loading application fee...
            </span>
          </div>
        ) : feeInfo && feeInfo.amount > 0 ? (
          isPaymentCompleted ? (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-medium text-green-900'>
                    Payment Complete
                  </h4>
                  <p className='text-sm text-green-700'>
                    Application fee has been successfully paid
                  </p>
                  {paymentCompletedAt && (
                    <p className='text-xs text-green-600 mt-1'>
                      Paid on{' '}
                      {new Date(paymentCompletedAt).toLocaleDateString(
                        'en-IN',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  )}
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-green-900'>
                    ₹{feeInfo.amount.toLocaleString()}
                  </div>
                  <div className='text-xs text-green-600'>
                    for {feeInfo.cohortName}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-medium text-orange-900'>
                    Application Fee Required
                  </h4>
                  <p className='text-sm text-orange-700'>
                    Complete your application by paying the application fee
                  </p>
                </div>
                <div className='text-right'>
                  <div className='text-2xl font-bold text-orange-900'>
                    ₹{feeInfo.amount.toLocaleString()}
                  </div>
                  <div className='text-xs text-orange-600'>
                    for {feeInfo.cohortName}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : feeInfo && feeInfo.amount === 0 ? (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center'>
              <div className='h-2 w-2 bg-green-500 rounded-full mr-3'></div>
              <span className='text-sm text-green-800'>
                No application fee required
              </span>
            </div>
          </div>
        ) : null}

        {/* Buttons */}
        <div className='flex justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={handleSave}
            disabled={saving || paymentProcessing}
          >
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </Button>
          <Button
            type='submit'
            disabled={saving || paymentProcessing || feeLoading}
            className='min-w-[200px]'
          >
            {saving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving & Processing...
              </>
            ) : paymentProcessing ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing Payment...
              </>
            ) : feeInfo && feeInfo.amount > 0 && !isPaymentCompleted ? (
              <>
                <CreditCard className='mr-2 h-4 w-4' />
                Pay ₹{feeInfo.amount.toLocaleString()}
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>

        {/* Application Fee Note */}
        {feeInfo && feeInfo.amount > 0 && !isPaymentCompleted && (
          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>
              Application fee: ₹{feeInfo.amount.toLocaleString()} • Secure
              payment via Razorpay
            </p>
          </div>
        )}
      </div>
    </form>
  );
};

export default ApplicationStep;
