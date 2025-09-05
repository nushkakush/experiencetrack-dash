import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationService } from '@/services/registration.service';
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
    console.log('Validation errors:', newErrors);
    console.log('Form data:', formData);
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

      console.log('Submitting registration with data:', {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth,
        qualification: formData.qualification,
        cohortId: formData.cohortId,
      });

      const result = await RegistrationService.registerUser({
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth,
        qualification: formData.qualification,
        cohortId: formData.cohortId,
      });

      console.log('Registration result:', result);

      if (result.success) {
        toast.success(
          'Registration successful! Please check your email for an invitation link to complete your account setup.'
        );
        navigate('/auth/login?message=registration-success');
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

  return {
    formData,
    loading,
    errors,
    updateFormData,
    updateDateOfBirth,
    handleSubmit,
    handleLoginClick,
  };
};
