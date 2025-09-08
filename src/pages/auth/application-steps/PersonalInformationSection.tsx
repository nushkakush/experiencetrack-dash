import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Phone, Linkedin, Instagram, Loader2 } from 'lucide-react';
import { SectionProps, qualifications, months, days, years } from './types';
import { useLocation } from '@/hooks/useLocation';

const PersonalInformationSection: React.FC<SectionProps> = ({
  formData,
  errors,
  onInputChange,
  onInputBlur,
  onDateOfBirthChange,
  onVerifyContact,
  isVerifying,
  getError,
}) => {
  // Location service hook
  const {
    states,
    cities,
    selectedState,
    selectedCity,
    loading: locationLoading,
    setSelectedState,
    setSelectedCity,
  } = useLocation();

  // Handle state change
  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    const state = states.find(s => s.id === stateId);
    if (state) {
      onInputChange('state', state.name);
      // Clear city when state changes
      onInputChange('city', '');
    }
  };

  // Handle city change
  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    const city = cities.find(c => c.id === cityId);
    if (city) {
      onInputChange('city', city.name);
    }
  };

  // Sync form data with location service on mount
  useEffect(() => {
    if (formData.state && states.length > 0) {
      const state = states.find(s => s.name === formData.state);
      if (state) {
        setSelectedState(state.id);
      }
    }
  }, [formData.state, states, setSelectedState]);

  useEffect(() => {
    if (formData.city && cities.length > 0) {
      const city = cities.find(c => c.name === formData.city);
      if (city) {
        setSelectedCity(city.id);
      }
    }
  }, [formData.city, cities, setSelectedCity]);
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 dark:border-gray-700 pb-4 mt-8'>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Personal Information
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
          Please provide your personal details
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Full Name - Disabled */}
          <div className='space-y-2'>
            <Label htmlFor='full_name' className='text-foreground font-medium'>
              Full Name *
            </Label>
            <div className='relative'>
              <Input
                id='full_name'
                value={formData.full_name}
                disabled
                tabIndex={-1}
                className='bg-muted/30 border-muted-foreground/20 text-muted-foreground cursor-not-allowed pr-10'
                placeholder='Enter your full name'
              />
              <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </div>
            </div>
            <p className='text-xs text-muted-foreground flex items-center gap-1'>
              <CheckCircle className='h-3 w-3 text-green-600' />
              Loaded from registration data
            </p>
          </div>

          {/* Contact Number - Editable */}
          <div className='space-y-2'>
            <Label htmlFor='contact_no'>Contact No. *</Label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Phone className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  id='contact_no'
                  type='tel'
                  value={formData.contact_no}
                  onChange={e => onInputChange('contact_no', e.target.value)}
                  onBlur={() => onInputBlur('contact_no')}
                  tabIndex={1}
                  className={`pl-10 ${getError('contact_no') ? 'border-red-500' : ''}`}
                  placeholder='+91 00000 00000'
                />
              </div>
              <button
                type='button'
                onClick={onVerifyContact}
                disabled={
                  isVerifying ||
                  !formData.contact_no ||
                  formData.contact_no_verified
                }
                tabIndex={2}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'
              >
                {formData.contact_no_verified
                  ? 'VERIFIED'
                  : isVerifying
                    ? 'VERIFYING...'
                    : 'VERIFY'}
              </button>
            </div>
            {getError('contact_no') && (
              <p className='text-sm text-red-500'>{getError('contact_no')}</p>
            )}
          </div>

          {/* Current Address - Right after contact number */}
          <div className='space-y-2'>
            <Label htmlFor='current_address'>Your Current Address *</Label>
            <Input
              id='current_address'
              value={formData.current_address}
              onChange={e => onInputChange('current_address', e.target.value)}
              onBlur={() => onInputBlur('current_address')}
              tabIndex={3}
              className={getError('current_address') ? 'border-red-500' : ''}
              placeholder='Street Address'
            />
            {getError('current_address') && (
              <p className='text-sm text-red-500'>
                {getError('current_address')}
              </p>
            )}
          </div>

          {/* State and City in a row */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='state'>State *</Label>
              <Select
                value={selectedState?.id || ''}
                onValueChange={handleStateChange}
              >
                <SelectTrigger
                  tabIndex={4}
                  className={getError('state') ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder='Select your state' />
                </SelectTrigger>
                <SelectContent>
                  {locationLoading ? (
                    <div className='flex items-center justify-center py-2'>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      <span className='text-sm'>Loading states...</span>
                    </div>
                  ) : (
                    states.map(state => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {getError('state') && (
                <p className='text-sm text-red-500'>{getError('state')}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='city'>City *</Label>
              <Select
                value={selectedCity?.id || ''}
                onValueChange={handleCityChange}
                disabled={!selectedState}
              >
                <SelectTrigger
                  tabIndex={5}
                  className={getError('city') ? 'border-red-500' : ''}
                >
                  <SelectValue
                    placeholder={
                      selectedState ? 'Select your city' : 'Select state first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locationLoading ? (
                    <div className='flex items-center justify-center py-2'>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      <span className='text-sm'>Loading cities...</span>
                    </div>
                  ) : cities.length > 0 ? (
                    cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className='py-2 text-center text-sm text-muted-foreground'>
                      {selectedState
                        ? 'No cities found'
                        : 'Select a state first'}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {getError('city') && (
                <p className='text-sm text-red-500'>{getError('city')}</p>
              )}
            </div>
          </div>

          {/* Postal/Zip Code */}
          <div className='space-y-2'>
            <Label htmlFor='postal_zip_code'>Postal/Zip Code *</Label>
            <Input
              id='postal_zip_code'
              value={formData.postal_zip_code}
              onChange={e => onInputChange('postal_zip_code', e.target.value)}
              onBlur={() => onInputBlur('postal_zip_code')}
              tabIndex={6}
              className={getError('postal_zip_code') ? 'border-red-500' : ''}
              placeholder='Postal/Zip Code'
            />
            {getError('postal_zip_code') && (
              <p className='text-sm text-red-500'>
                {getError('postal_zip_code')}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Email - Disabled with verified indicator */}
          <div className='space-y-2'>
            <Label htmlFor='email' className='text-foreground font-medium'>
              Email *
            </Label>
            <div className='relative'>
              <Input
                id='email'
                type='email'
                value={formData.email}
                disabled
                tabIndex={-1}
                className='bg-muted/30 border-muted-foreground/20 text-muted-foreground cursor-not-allowed pr-20'
                placeholder='Enter your email'
              />
              <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span className='text-xs text-green-600 font-medium'>
                  Verified
                </span>
              </div>
            </div>
            <p className='text-xs text-muted-foreground flex items-center gap-1'>
              <CheckCircle className='h-3 w-3 text-green-600' />
              Loaded from registration data
            </p>
          </div>

          {/* Date of Birth - Editable with dropdowns */}
          <div className='space-y-2'>
            <Label>Date of Birth *</Label>
            <div className='grid grid-cols-3 gap-2'>
              <Select
                value={formData.date_of_birth.day}
                onValueChange={value => onDateOfBirthChange('day', value)}
              >
                <SelectTrigger
                  tabIndex={7}
                  className={getError('date_of_birth') ? 'border-red-500' : ''}
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
                value={formData.date_of_birth.month}
                onValueChange={value => onDateOfBirthChange('month', value)}
              >
                <SelectTrigger
                  tabIndex={8}
                  className={getError('date_of_birth') ? 'border-red-500' : ''}
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
                value={formData.date_of_birth.year}
                onValueChange={value => onDateOfBirthChange('year', value)}
              >
                <SelectTrigger
                  tabIndex={9}
                  className={getError('date_of_birth') ? 'border-red-500' : ''}
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
            {getError('date_of_birth') && (
              <p className='text-sm text-red-500'>
                {getError('date_of_birth')}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className='space-y-2'>
            <Label>Select Your Gender *</Label>
            <div className='flex gap-4'>
              {['Male', 'Female', 'Other'].map((option, index) => (
                <label
                  key={option}
                  className='flex items-center space-x-2 cursor-pointer'
                >
                  <input
                    type='radio'
                    name='gender'
                    value={option}
                    checked={formData.gender === option}
                    onChange={e => onInputChange('gender', e.target.value)}
                    onBlur={() => onInputBlur('gender')}
                    tabIndex={10}
                    className='h-4 w-4 text-orange-500'
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {getError('gender') && (
              <p className='text-sm text-red-500'>{getError('gender')}</p>
            )}
          </div>

          {/* LinkedIn Profile */}
          <div className='space-y-2'>
            <Label htmlFor='linkedin_profile'>
              Your LinkedIn Profile Link (Optional)
            </Label>
            <div className='relative'>
              <Linkedin className='absolute right-3 top-3 h-4 w-4 text-blue-600' />
              <Input
                id='linkedin_profile'
                type='url'
                value={formData.linkedin_profile}
                onChange={e =>
                  onInputChange('linkedin_profile', e.target.value)
                }
                onBlur={() => onInputBlur('linkedin_profile')}
                tabIndex={11}
                placeholder='https://www.linkedin.com/JohnDoe'
              />
            </div>
          </div>

          {/* Instagram ID */}
          <div className='space-y-2'>
            <Label htmlFor='instagram_id'>Your Instagram ID (Optional)</Label>
            <div className='relative'>
              <Instagram className='absolute right-3 top-3 h-4 w-4 text-pink-600' />
              <Input
                id='instagram_id'
                value={formData.instagram_id}
                onChange={e => onInputChange('instagram_id', e.target.value)}
                onBlur={() => onInputBlur('instagram_id')}
                tabIndex={12}
                placeholder='@john_doe'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationSection;
