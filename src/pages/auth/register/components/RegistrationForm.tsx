import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Mail, Phone } from 'lucide-react';
import { useCohortsWithOpenApplications } from '@/hooks/useCohortsWithOpenApplications';
import { Skeleton } from '@/components/ui/skeleton';
import { DuplicateEmailModal } from './DuplicateEmailModal';
import { DuplicateEmailStatus } from '@/services/duplicateEmailCheck.service';

interface RegistrationFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: {
      day: string;
      month: string;
      year: string;
    };
    qualification: string;
    cohortId: string;
  };
  loading: boolean;
  errors: Record<string, string>;
  showDuplicateModal: boolean;
  duplicateStatus: DuplicateEmailStatus | null;
  onFormDataChange: (field: string, value: string) => void;
  onDateOfBirthChange: (field: 'day' | 'month' | 'year', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onLoginClick: () => void;
  onCloseDuplicateModal: () => void;
  onResendConfirmation: () => void;
  onRedirectToPasswordReset: () => void;
  onStartFresh: () => void;
}

const qualifications = [
  'High School',
  'Associate Degree',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate',
  'Professional Certificate',
  'Other',
];

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function RegistrationForm({
  formData,
  loading,
  errors,
  showDuplicateModal,
  duplicateStatus,
  onFormDataChange,
  onDateOfBirthChange,
  onSubmit,
  onLoginClick,
  onCloseDuplicateModal,
  onResendConfirmation,
  onRedirectToPasswordReset,
  onStartFresh,
}: RegistrationFormProps) {
  const {
    cohorts,
    isLoading: cohortsLoading,
    error: cohortsError,
  } = useCohortsWithOpenApplications();

  // Log any errors for debugging
  if (cohortsError) {
    console.error('Error loading cohorts:', cohortsError);
  }

  return (
    <>
      <Card className='w-full max-w-4xl mx-auto'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Logo size='lg' showText={false} />
          </div>
          <CardTitle className='text-3xl font-bold'>
            Join the Education Revolution!
          </CardTitle>
          <CardDescription className='text-lg'>
            Register with us to begin your application process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Left Column */}
              <div className='space-y-4'>
                {/* First Name */}
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name</Label>
                  <Input
                    id='firstName'
                    type='text'
                    value={formData.firstName}
                    onChange={e => onFormDataChange('firstName', e.target.value)}
                    placeholder='John'
                    className={errors.firstName ? 'border-red-500' : ''}
                    tabIndex={1}
                  />
                  {errors.firstName && (
                    <p className='text-sm text-red-500'>{errors.firstName}</p>
                  )}
                </div>

                {/* Email */}
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e => onFormDataChange('email', e.target.value)}
                      placeholder='john@gmail.com'
                      className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      tabIndex={3}
                    />
                  </div>
                  {errors.email && (
                    <p className='text-sm text-red-500'>{errors.email}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className='space-y-2'>
                  <Label>Date of Birth</Label>
                  <div className='grid grid-cols-3 gap-2'>
                    <Select
                      value={formData.dateOfBirth.day}
                      onValueChange={value => onDateOfBirthChange('day', value)}
                    >
                      <SelectTrigger
                        className={errors.dateOfBirth ? 'border-red-500' : ''}
                        tabIndex={6}
                      >
                        <SelectValue placeholder='DD' />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map(day => (
                          <SelectItem
                            key={day}
                            value={day.toString().padStart(2, '0')}
                          >
                            {day.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={formData.dateOfBirth.month}
                      onValueChange={value => onDateOfBirthChange('month', value)}
                    >
                      <SelectTrigger
                        className={errors.dateOfBirth ? 'border-red-500' : ''}
                        tabIndex={7}
                      >
                        <SelectValue placeholder='MM' />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={formData.dateOfBirth.year}
                      onValueChange={value => onDateOfBirthChange('year', value)}
                    >
                      <SelectTrigger
                        className={errors.dateOfBirth ? 'border-red-500' : ''}
                        tabIndex={8}
                      >
                        <SelectValue placeholder='YYYY' />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.dateOfBirth && (
                    <p className='text-sm text-red-500'>{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* Select Cohort */}
                <div className='space-y-2'>
                  <Label htmlFor='cohortId'>Select Cohort</Label>
                  {cohortsLoading ? (
                    <Skeleton className='h-10 w-full' />
                  ) : (
                    <Select
                      value={formData.cohortId}
                      onValueChange={value => onFormDataChange('cohortId', value)}
                    >
                      <SelectTrigger
                        className={errors.cohortId ? 'border-red-500' : ''}
                        tabIndex={9}
                      >
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts.length === 0 ? (
                          <SelectItem value='no-cohorts' disabled>
                            No cohorts available for registration
                          </SelectItem>
                        ) : (
                          cohorts.map(cohort => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.cohortId && (
                    <p className='text-sm text-red-500'>{errors.cohortId}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className='space-y-4'>
                {/* Last Name */}
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name</Label>
                  <Input
                    id='lastName'
                    type='text'
                    value={formData.lastName}
                    onChange={e => onFormDataChange('lastName', e.target.value)}
                    placeholder='Doe'
                    className={errors.lastName ? 'border-red-500' : ''}
                    tabIndex={2}
                  />
                  {errors.lastName && (
                    <p className='text-sm text-red-500'>{errors.lastName}</p>
                  )}
                </div>

                {/* Contact No. */}
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Contact No.</Label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={e => onFormDataChange('phone', e.target.value)}
                      placeholder='+91 00000 00000'
                      className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      tabIndex={4}
                    />
                  </div>
                  {errors.phone && (
                    <p className='text-sm text-red-500'>{errors.phone}</p>
                  )}
                </div>

                {/* Qualification */}
                <div className='space-y-2'>
                  <Label htmlFor='qualification'>Qualification</Label>
                  <Select
                    value={formData.qualification}
                    onValueChange={value =>
                      onFormDataChange('qualification', value)
                    }
                  >
                    <SelectTrigger
                      className={errors.qualification ? 'border-red-500' : ''}
                      tabIndex={5}
                    >
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {qualifications.map(qual => (
                        <SelectItem key={qual} value={qual}>
                          {qual}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.qualification && (
                    <p className='text-sm text-red-500'>{errors.qualification}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Info Text */}
            <div className='text-center'>
              <p className='text-sm text-blue-600'>
                We'll send you an invitation link to complete your registration
                and set up your password.
              </p>
            </div>

            {/* Buttons */}
            <div className='flex justify-between'>
              <Button
                type='button'
                variant='outline'
                onClick={onLoginClick}
                className='px-8'
              >
                Login to Dashboard
              </Button>
              <Button
                type='submit'
                disabled={loading || cohortsLoading}
                className='px-8 bg-purple-600 hover:bg-purple-700'
              >
                {loading ? 'Applying...' : 'Apply Now'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Duplicate Email Modal */}
      {duplicateStatus && (
        <DuplicateEmailModal
          isOpen={showDuplicateModal}
          onClose={onCloseDuplicateModal}
          email={formData.email}
          duplicateStatus={duplicateStatus}
        onResendConfirmation={onResendConfirmation}
        onRedirectToPasswordReset={onRedirectToPasswordReset}
        onStartFresh={onStartFresh}
        />
      )}
    </>
  );
}
