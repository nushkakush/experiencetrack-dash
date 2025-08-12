import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UserPlus } from 'lucide-react';
import { CohortStudent } from '@/types/cohort';
import { StudentInfo } from './StudentInfo';
import { PasswordForm } from './PasswordForm';

interface InvitationFormProps {
  student: CohortStudent;
  cohortName: string;
  isExistingUser: boolean;
  password: string;
  confirmPassword: string;
  processing: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const InvitationForm: React.FC<InvitationFormProps> = ({
  student,
  cohortName,
  isExistingUser,
  password,
  confirmPassword,
  processing,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Welcome to ExperienceTrack!</CardTitle>
          <CardDescription>
            You've been invited to join {cohortName || "a cohort"}. Please set up your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StudentInfo student={student} cohortName={cohortName} />
          
          <PasswordForm
            isExistingUser={isExistingUser}
            password={password}
            confirmPassword={confirmPassword}
            processing={processing}
            onPasswordChange={onPasswordChange}
            onConfirmPasswordChange={onConfirmPasswordChange}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
};
