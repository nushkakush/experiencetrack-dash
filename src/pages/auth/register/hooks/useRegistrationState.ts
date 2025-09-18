import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationService } from '@/services/registration.service';
import { DuplicateEmailCheckService, DuplicateEmailStatus } from '@/services/duplicateEmailCheck.service';
import { toast } from 'sonner';
import { ValidationUtils } from '@/utils/validation';

export const useRegistrationState = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: {
      day: '',
      month: '',
      year: '',
    },
    qualification: '',
    cohortId: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateEmailStatus | null>(null);

  const navigate = useNavigate();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const updateDateOfBirth = (
    field: 'day' | 'month' | 'year',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: {
        ...prev.dateOfBirth,
        [field]: value,
      },
    }));

    // Clear date errors when user starts typing
    if (errors.dateOfBirth) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!ValidationUtils.isValidSignupEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!ValidationUtils.isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Date of birth validation
    const { day, month, year } = formData.dateOfBirth;
    if (!day || !month || !year) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        // Adjust age if birthday hasn't occurred this year
        const adjustedAge = age - 1;
        if (adjustedAge < 18) {
          newErrors.dateOfBirth =
            'You must be at least 18 years old to register';
        }
      } else if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old to register';
      }
    }

    if (!formData.qualification) {
      newErrors.qualification = 'Qualification is required';
    }

    if (!formData.cohortId) {
      newErrors.cohortId = 'Please select a cohort';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Format date of birth as YYYY-MM-DD
      const dateOfBirth = `${formData.dateOfBirth.year}-${formData.dateOfBirth.month.padStart(2, '0')}-${formData.dateOfBirth.day.padStart(2, '0')}`;

      const result = await RegistrationService.registerUser({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth,
        qualification: formData.qualification,
        cohortId: formData.cohortId,
      });

      if (result.success) {
        toast.success(
          'Registration successful! Please check your email for an invitation link to complete your account setup.'
        );
        navigate('/auth/login?message=registration-success');
      } else if (result.duplicateStatus) {
        // Handle duplicate email case
        setDuplicateStatus(result.duplicateStatus);
        setShowDuplicateModal(true);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/auth/login');
  };

  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setDuplicateStatus(null);
  };

  const handleResendConfirmation = () => {
    // This will be handled by the modal component
    setShowDuplicateModal(false);
  };

  const handleRedirectToPasswordReset = () => {
    navigate('/auth/login?showForgotPassword=true');
  };

  const handleStartFresh = async () => {
    if (!duplicateStatus?.profileId || !duplicateStatus?.applicationId) {
      toast.error('Unable to start fresh. Please try registering again.');
      return;
    }

    setLoading(true);
    try {
      const result = await DuplicateEmailCheckService.deleteExistingRecords(
        duplicateStatus.profileId,
        duplicateStatus.applicationId
      );

      if (result.success) {
        toast.success('Previous application deleted. You can now apply fresh!');
        // Clear the duplicate status and close modal
        setDuplicateStatus(null);
        setShowDuplicateModal(false);
        // Clear the email field so user can re-enter it
        setFormData(prev => ({ ...prev, email: '' }));
      } else {
        toast.error(result.error || 'Failed to delete previous application. Please try again.');
      }
    } catch (error) {
      console.error('Error starting fresh:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    errors,
    showDuplicateModal,
    duplicateStatus,
    updateFormData,
    updateDateOfBirth,
    handleSubmit,
    handleLoginClick,
    handleCloseDuplicateModal,
    handleResendConfirmation,
    handleRedirectToPasswordReset,
    handleStartFresh,
  };
};
