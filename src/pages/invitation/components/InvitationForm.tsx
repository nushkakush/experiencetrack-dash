import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
import { UserPlus } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { StudentInfo } from './StudentInfo';
import { PasswordForm } from './PasswordForm';
import { Button } from '@/components/ui/button';

interface InvitationFormProps {
  student: CohortStudent;
  cohortName: string;
  isExistingUser: boolean;
  canJoinWithoutPassword?: boolean;
  password: string;
  confirmPassword: string;
  processing: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onToggleMode?: () => void;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  student,
  cohortName,
  isExistingUser,
  canJoinWithoutPassword = false,
  password,
  confirmPassword,
  processing,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onToggleMode,
}) => {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4 relative'>
      {/* Theme Toggle in top-right corner */}
      <div className='absolute top-4 right-4'>
        <ThemeToggle />
      </div>

      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Logo size='lg' showText={false} />
          </div>
          <CardTitle>Welcome to ExperienceTrack!</CardTitle>
          <CardDescription>
            You've been invited to join {cohortName || 'a cohort'}.{' '}
            {canJoinWithoutPassword
              ? "You're already signed in. Join directly."
              : 'Please set up your account to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <StudentInfo student={student} cohortName={cohortName} />

          {!canJoinWithoutPassword ? (
            <PasswordForm
              isExistingUser={isExistingUser}
              password={password}
              confirmPassword={confirmPassword}
              processing={processing}
              onPasswordChange={onPasswordChange}
              onConfirmPasswordChange={onConfirmPasswordChange}
              onSubmit={onSubmit}
              onToggleMode={onToggleMode}
            />
          ) : (
            <div className='space-y-3'>
              <p className='text-sm text-gray-600 text-center'>
                You're signed in as the invited email. Click below to join the
                cohort.
              </p>
              <Button
                onClick={onSubmit}
                disabled={processing}
                className='w-full'
              >
                {processing ? 'Joining...' : 'Join Cohort'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
