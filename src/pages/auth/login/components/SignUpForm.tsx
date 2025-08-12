import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordField } from './PasswordField';

interface SignUpFormProps {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  showSignupPassword: boolean;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  email,
  password,
  firstName,
  lastName,
  showSignupPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onFirstNameChange,
  onLastNameChange,
  onTogglePassword,
  onSubmit
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-left block">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={onFirstNameChange}
            placeholder="Enter first name"
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-left block">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={onLastNameChange}
            placeholder="Enter last name"
            autoComplete="family-name"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signupEmail" className="text-left block">Email</Label>
        <Input
          id="signupEmail"
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
      </div>
      
      <PasswordField
        id="signupPassword"
        label="Password"
        value={password}
        onChange={onPasswordChange}
        placeholder="Create a password"
        showPassword={showSignupPassword}
        onTogglePassword={onTogglePassword}
        autoComplete="new-password"
        required
      />
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>
    </form>
  );
};
