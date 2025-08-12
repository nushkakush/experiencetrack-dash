import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  onSignUp
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LIT DASHBOARD</CardTitle>
          <CardDescription>
            Experiential Learning Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
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
            
            <TabsContent value="signup">
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
