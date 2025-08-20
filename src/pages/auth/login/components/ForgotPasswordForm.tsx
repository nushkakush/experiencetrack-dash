import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  resetEmail: string;
  loading: boolean;
  onResetEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackToSignIn: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  resetEmail,
  loading,
  onResetEmailChange,
  onBackToSignIn,
  onSubmit,
}) => {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onBackToSignIn}
            className='absolute top-4 left-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div className='flex justify-center mb-4'>
            <Logo size='lg' showText={false} />
          </div>
          <CardTitle className='text-2xl font-bold'>Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='resetEmail' className='text-left block'>
                Email
              </Label>
              <Input
                id='resetEmail'
                type='email'
                value={resetEmail}
                onChange={onResetEmailChange}
                placeholder='Enter your email address'
                autoComplete='email'
                required
              />
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
