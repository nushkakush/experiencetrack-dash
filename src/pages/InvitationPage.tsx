import React from 'react';
import { useParams } from 'react-router-dom';
import { useInvitationLoading, useInvitationAcceptance } from './invitation/hooks';
import { LoadingState, ErrorState, InvitationForm } from './invitation/components';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();

  const {
    loading,
    student,
    cohortName,
    error,
    isExistingUser
  } = useInvitationLoading({ token });

  const {
    processing,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    handleAcceptInvitation
  } = useInvitationAcceptance({
    token,
    student,
    cohortName,
    isExistingUser
  });

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!student) {
    return null;
  }

  return (
    <InvitationForm
      student={student}
      cohortName={cohortName}
      isExistingUser={isExistingUser}
      password={password}
      confirmPassword={confirmPassword}
      processing={processing}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleAcceptInvitation}
    />
  );
}
