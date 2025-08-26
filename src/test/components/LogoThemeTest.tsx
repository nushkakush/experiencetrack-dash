import React from 'react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LogoThemeTest: React.FC = () => {
  return (
    <div className='min-h-screen bg-background p-8'>
      <div className='max-w-2xl mx-auto space-y-8'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Logo Theme Test</h1>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logo Display Test</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-4'>
              <div>
                <h3 className='text-sm font-medium mb-2'>Small Logo</h3>
                <Logo size='sm' showText={false} />
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Medium Logo</h3>
                <Logo size='md' showText={false} />
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Large Logo</h3>
                <Logo size='lg' showText={false} />
              </div>

              <div>
                <h3 className='text-sm font-medium mb-2'>Logo with Text</h3>
                <Logo size='md' showText={true} />
              </div>
            </div>

            <div className='p-4 bg-muted rounded-lg'>
              <p className='text-sm text-muted-foreground'>
                <strong>Instructions:</strong> Use the theme toggle in the
                top-right corner to switch between light, dark, and system
                themes. The logo should automatically update to show the
                appropriate version for each theme.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
