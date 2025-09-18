import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordField } from './PasswordField';
import { Link } from 'react-router-dom';

interface SignInFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onForgotPassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  email,
  password,
  showPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onForgotPassword,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='email' className='text-left block'>
          Email
        </Label>
        <Input
          id='email'
          type='email'
          value={email}
          onChange={onEmailChange}
          placeholder='Enter your email'
          autoComplete='email'
          required
        />
      </div>

      <PasswordField
        id='password'
        label='Password'
        value={password}
        onChange={onPasswordChange}
        placeholder='Enter your password'
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        autoComplete='current-password'
        required
      />

      <div className='flex justify-end'>
        <Button
          type='button'
          variant='link'
          className='px-0 text-sm'
          onClick={onForgotPassword}
        >
          Forgot password?
        </Button>
      </div>

      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className='text-center text-sm text-muted-foreground'>
        Wanna join LIT?{' '}
        <Link
          to='/auth/apply'
          className='text-primary hover:underline font-medium'
        >
          Apply Here
        </Link>
      </div>
    </form>
  );
};
