import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Home, ArrowLeft } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access Denied',
  description = "You don't have permission to access this page.",
  showBackButton = true,
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='p-3 bg-red-100 dark:bg-red-900/20 rounded-full'>
              <Shield className='h-8 w-8 text-red-600 dark:text-red-400' />
            </div>
          </div>
          <CardTitle className='text-xl'>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-3'>
            {showBackButton && (
              <Button
                variant='outline'
                onClick={handleGoBack}
                className='flex items-center gap-2'
              >
                <ArrowLeft className='h-4 w-4' />
                Go Back
              </Button>
            )}
            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                className='flex items-center gap-2'
              >
                <Home className='h-4 w-4' />
                Go to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
