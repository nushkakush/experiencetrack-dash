import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SEO, PageSEO } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useRegistrationState } from './register/hooks/useRegistrationState';
import RegistrationForm from './register/components/RegistrationForm';

const Register = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    formData,
    loading,
    errors,
    updateFormData,
    updateDateOfBirth,
    handleSubmit,
    handleLoginClick,
  } = useRegistrationState();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render registration form if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <>
      <SEO {...PageSEO.register} />
      <div className='absolute top-4 right-4 z-10'>
        <ThemeToggle />
      </div>
      <div className='min-h-screen flex items-center justify-center bg-background p-4'>
        <RegistrationForm
          formData={formData}
          loading={loading}
          errors={errors}
          onFormDataChange={updateFormData}
          onDateOfBirthChange={updateDateOfBirth}
          onSubmit={handleSubmit}
          onLoginClick={handleLoginClick}
        />
      </div>
    </>
  );
};

export default Register;
