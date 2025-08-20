import React from 'react';
import { useParams } from 'react-router-dom';
import { SEO, PageSEO } from '@/components/common';
import {
  useInvitationLoading,
  useInvitationAcceptance,
} from './invitation/hooks';
import {
  LoadingState,
  ErrorState,
  InvitationForm,
} from './invitation/components';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();

  const { loading, student, cohortName, error, isExistingUser } =
    useInvitationLoading({ token });

  const {
    processing,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    handleAcceptInvitation,
    isExistingUser: effectiveExistingUser,
    canJoinWithoutPassword,
    toggleExistingUserMode,
  } = useInvitationAcceptance({
    token,
    student,
    cohortName,
    isExistingUser,
  });

  if (loading) {
    return (
      <>
        <SEO {...PageSEO.invitation} />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO {...PageSEO.notFound} />
        <ErrorState error={error} />
      </>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <>
      <SEO {...PageSEO.invitation} />
      <InvitationForm
        student={student}
        cohortName={cohortName}
        isExistingUser={effectiveExistingUser}
        canJoinWithoutPassword={canJoinWithoutPassword}
        password={password}
        confirmPassword={confirmPassword}
        processing={processing}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleAcceptInvitation}
        onToggleMode={toggleExistingUserMode}
      />
    </>
  );
}
