import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SEO, PageSEO } from '@/components/common';
import { useLoginState } from './login/hooks';
import { ForgotPasswordForm, MainLoginForm } from './login/components';

const Login = () => {
  const {
    email,
    password,
    firstName,
    lastName,
    showPassword,
    showSignupPassword,
    showForgotPassword,
    resetEmail,
    loading,
    setEmail,
    setPassword,
    setFirstName,
    setLastName,
    setShowPassword,
    setShowSignupPassword,
    setShowForgotPassword,
    setResetEmail,
    handleSignIn,
    handleSignUp,
    handleForgotPassword,
    handleBackToSignIn,
  } = useLoginState();

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
        firstName={firstName}
        lastName={lastName}
        showPassword={showPassword}
        showSignupPassword={showSignupPassword}
        loading={loading}
        onEmailChange={e => setEmail(e.target.value)}
        onPasswordChange={e => setPassword(e.target.value)}
        onFirstNameChange={e => setFirstName(e.target.value)}
        onLastNameChange={e => setLastName(e.target.value)}
        onTogglePassword={() => setShowPassword(!showPassword)}
        onToggleSignupPassword={() =>
          setShowSignupPassword(!showSignupPassword)
        }
        onForgotPassword={() => setShowForgotPassword(true)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    </>
  );
};

export default Login;
