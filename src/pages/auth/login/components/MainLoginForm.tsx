import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { SignInForm } from './SignInForm';
import { ValidationUtils } from '@/utils/validation';

interface MainLoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onForgotPassword: () => void;
  onSignIn: (e: React.FormEvent) => void;
}

export const MainLoginForm: React.FC<MainLoginFormProps> = ({
  email,
  password,
  showPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onForgotPassword,
  onSignIn,
}) => {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Logo size='lg' showText={false} />
          </div>
          <CardDescription>
            Experiential Learning Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm
            email={email}
            password={password}
            showPassword={showPassword}
            loading={loading}
            onEmailChange={onEmailChange}
            onPasswordChange={onPasswordChange}
            onTogglePassword={onTogglePassword}
            onForgotPassword={onForgotPassword}
            onSubmit={onSignIn}
          />
        </CardContent>
      </Card>
    </div>
  );
};
