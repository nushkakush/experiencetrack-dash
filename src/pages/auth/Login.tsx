import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SEO, PageSEO } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { useLoginState } from './login/hooks';
import { ForgotPasswordForm, MainLoginForm } from './login/components';

const Login = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const {
    email,
    password,
    showPassword,
    showForgotPassword,
    resetEmail,
    loading,
    setEmail,
    setPassword,
    setShowPassword,
    setShowForgotPassword,
    setResetEmail,
    handleSignIn,
    handleForgotPassword,
    handleBackToSignIn,
  } = useLoginState();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (user) {
    return null;
  }

  if (showForgotPassword) {
    return (
      <>
        <SEO {...PageSEO.resetPassword} />
        <div className='absolute top-4 right-4 z-10'>
          <ThemeToggle />
        </div>
        <ForgotPasswordForm
          resetEmail={resetEmail}
          loading={loading}
          onResetEmailChange={e => setResetEmail(e.target.value)}
          onBackToSignIn={handleBackToSignIn}
          onSubmit={handleForgotPassword}
        />
      </>
    );
  }

  return (
    <>
      <SEO {...PageSEO.login} />
      <div className='absolute top-4 right-4 z-10'>
        <ThemeToggle />
      </div>
      <MainLoginForm
        email={email}
        password={password}
        showPassword={showPassword}
        loading={loading}
        onEmailChange={e => setEmail(e.target.value)}
        onPasswordChange={e => setPassword(e.target.value)}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onForgotPassword={() => setShowForgotPassword(true)}
        onSignIn={handleSignIn}
      />
    </>
  );
};

export default Login;
