import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface PasswordFormProps {
  isExistingUser: boolean;
  password: string;
  confirmPassword: string;
  processing: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  isExistingUser,
  password,
  confirmPassword,
  processing,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">
          {isExistingUser ? "Password" : "Create Password"}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={isExistingUser ? "Enter your password" : "Create a password"}
        />
      </div>

      {!isExistingUser && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm your password"
          />
        </div>
      )}

      <Button 
        onClick={onSubmit} 
        disabled={processing || !password}
        className="w-full"
      >
        {processing ? (
          "Processing..."
        ) : isExistingUser ? (
          "Join Cohort"
        ) : (
          "Create Account & Join Cohort"
        )}
      </Button>

      {isExistingUser && (
        <p className="text-sm text-gray-600 text-center">
          You already have an account. Please enter your password to join this cohort.
        </p>
      )}
    </div>
  );
};
