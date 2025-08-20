import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/ui/logo';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface MainLoginFormProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  showPassword: boolean;
  showSignupPassword: boolean;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleSignupPassword: () => void;
  onForgotPassword: () => void;
  onSignIn: (e: React.FormEvent) => void;
  onSignUp: (e: React.FormEvent) => void;
}

export const MainLoginForm: React.FC<MainLoginFormProps> = ({
  email,
  password,
  firstName,
  lastName,
  showPassword,
  showSignupPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onFirstNameChange,
  onLastNameChange,
  onTogglePassword,
  onToggleSignupPassword,
  onForgotPassword,
  onSignIn,
  onSignUp,
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
          <div className='mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800'>
            <p className='text-xs text-blue-700 dark:text-blue-300'>
              <strong>Note:</strong> Only @litschool.in email addresses are
              allowed for signup
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='signin' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='signin'>Sign In</TabsTrigger>
              <TabsTrigger value='signup'>Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value='signin'>
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
            </TabsContent>

            <TabsContent value='signup'>
              <SignUpForm
                email={email}
                password={password}
                firstName={firstName}
                lastName={lastName}
                showSignupPassword={showSignupPassword}
                loading={loading}
                onEmailChange={onEmailChange}
                onPasswordChange={onPasswordChange}
                onFirstNameChange={onFirstNameChange}
                onLastNameChange={onLastNameChange}
                onTogglePassword={onToggleSignupPassword}
                onSubmit={onSignUp}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
