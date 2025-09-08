import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionProps } from './types';

const ParentalInformationSection: React.FC<SectionProps> = ({
  formData,
  errors,
  onInputChange,
  onInputBlur,
  getError,
}) => {
  return (
    <div className='space-y-6'>
      <div className='border-b border-gray-200 dark:border-gray-700 pb-4'>
        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
          Parental Information
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
          Please provide your parents' contact details
        </p>
      </div>
      <div className='space-y-6'>
        {/* Father's Information */}
        <div className='space-y-4'>
          <h4 className='text-lg font-medium'>Father's Information</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='father_first_name'>Father's First Name *</Label>
              <Input
                id='father_first_name'
                value={formData.father_first_name}
                onChange={e =>
                  onInputChange('father_first_name', e.target.value)
                }
                onBlur={() => onInputBlur('father_first_name')}
                tabIndex={26}
                className={
                  getError('father_first_name') ? 'border-red-500' : ''
                }
                placeholder="Enter father's first name"
              />
              {getError('father_first_name') && (
                <p className='text-sm text-red-500'>
                  {getError('father_first_name')}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='father_last_name'>Father's Last Name *</Label>
              <Input
                id='father_last_name'
                value={formData.father_last_name}
                onChange={e =>
                  onInputChange('father_last_name', e.target.value)
                }
                onBlur={() => onInputBlur('father_last_name')}
                tabIndex={27}
                className={getError('father_last_name') ? 'border-red-500' : ''}
                placeholder="Enter father's last name"
              />
              {getError('father_last_name') && (
                <p className='text-sm text-red-500'>
                  {getError('father_last_name')}
                </p>
              )}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='father_contact_no'>
                Father's Contact Number *
              </Label>
              <Input
                id='father_contact_no'
                type='tel'
                value={formData.father_contact_no}
                onChange={e =>
                  onInputChange('father_contact_no', e.target.value)
                }
                onBlur={() => onInputBlur('father_contact_no')}
                tabIndex={28}
                className={
                  getError('father_contact_no') ? 'border-red-500' : ''
                }
                placeholder='+91 00000 00000'
              />
              {getError('father_contact_no') && (
                <p className='text-sm text-red-500'>
                  {getError('father_contact_no')}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='father_occupation'>Father's Occupation</Label>
              <Input
                id='father_occupation'
                value={formData.father_occupation}
                onChange={e =>
                  onInputChange('father_occupation', e.target.value)
                }
                onBlur={() => onInputBlur('father_occupation')}
                tabIndex={29}
                placeholder="Enter father's occupation"
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='father_email'>Father's Email *</Label>
            <Input
              id='father_email'
              type='email'
              value={formData.father_email}
              onChange={e => onInputChange('father_email', e.target.value)}
              onBlur={() => onInputBlur('father_email')}
              tabIndex={30}
              className={getError('father_email') ? 'border-red-500' : ''}
              placeholder='father@example.com'
            />
            {getError('father_email') && (
              <p className='text-sm text-red-500'>{getError('father_email')}</p>
            )}
          </div>
        </div>

        {/* Mother's Information */}
        <div className='space-y-4'>
          <h4 className='text-lg font-medium'>Mother's Information</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='mother_first_name'>Mother's First Name *</Label>
              <Input
                id='mother_first_name'
                value={formData.mother_first_name}
                onChange={e =>
                  onInputChange('mother_first_name', e.target.value)
                }
                onBlur={() => onInputBlur('mother_first_name')}
                tabIndex={31}
                className={
                  getError('mother_first_name') ? 'border-red-500' : ''
                }
                placeholder="Enter mother's first name"
              />
              {getError('mother_first_name') && (
                <p className='text-sm text-red-500'>
                  {getError('mother_first_name')}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='mother_last_name'>Mother's Last Name *</Label>
              <Input
                id='mother_last_name'
                value={formData.mother_last_name}
                onChange={e =>
                  onInputChange('mother_last_name', e.target.value)
                }
                onBlur={() => onInputBlur('mother_last_name')}
                tabIndex={32}
                className={getError('mother_last_name') ? 'border-red-500' : ''}
                placeholder="Enter mother's last name"
              />
              {getError('mother_last_name') && (
                <p className='text-sm text-red-500'>
                  {getError('mother_last_name')}
                </p>
              )}
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='mother_contact_no'>
                Mother's Contact Number *
              </Label>
              <Input
                id='mother_contact_no'
                type='tel'
                value={formData.mother_contact_no}
                onChange={e =>
                  onInputChange('mother_contact_no', e.target.value)
                }
                onBlur={() => onInputBlur('mother_contact_no')}
                tabIndex={33}
                className={
                  getError('mother_contact_no') ? 'border-red-500' : ''
                }
                placeholder='+91 00000 00000'
              />
              {getError('mother_contact_no') && (
                <p className='text-sm text-red-500'>
                  {getError('mother_contact_no')}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='mother_occupation'>Mother's Occupation</Label>
              <Input
                id='mother_occupation'
                value={formData.mother_occupation}
                onChange={e =>
                  onInputChange('mother_occupation', e.target.value)
                }
                onBlur={() => onInputBlur('mother_occupation')}
                tabIndex={34}
                placeholder="Enter mother's occupation"
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='mother_email'>Mother's Email *</Label>
            <Input
              id='mother_email'
              type='email'
              value={formData.mother_email}
              onChange={e => onInputChange('mother_email', e.target.value)}
              onBlur={() => onInputBlur('mother_email')}
              tabIndex={35}
              className={getError('mother_email') ? 'border-red-500' : ''}
              placeholder='mother@example.com'
            />
            {getError('mother_email') && (
              <p className='text-sm text-red-500'>{getError('mother_email')}</p>
            )}
          </div>
        </div>

        {/* Financial Aid */}
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='applied_financial_aid'
              checked={formData.applied_financial_aid}
              onCheckedChange={checked =>
                onInputChange('applied_financial_aid', checked)
              }
              tabIndex={36}
            />
            <Label htmlFor='applied_financial_aid'>
              I have applied for financial aid
            </Label>
          </div>

          {/* Financial Aid Form - Show when applied_financial_aid is true */}
          {formData.applied_financial_aid && (
            <div className='space-y-6 pl-4 border-l-2 border-orange-200 p-4 rounded-r-lg'>
              <h4 className='text-lg font-medium text-orange-800'>
                Financial Aid Application Details
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Left Column */}
                <div className='space-y-4'>
                  {/* Who Applied For This Loan */}
                  <div className='space-y-2'>
                    <Label htmlFor='loan_applicant'>
                      Who Applied For This Loan? *
                    </Label>
                    <Select
                      value={formData.loan_applicant || ''}
                      onValueChange={value =>
                        onInputChange('loan_applicant', value)
                      }
                      onOpenChange={open =>
                        !open && onInputBlur('loan_applicant')
                      }
                    >
                      <SelectTrigger
                        tabIndex={37}
                        className={
                          getError('loan_applicant') ? 'border-red-500' : ''
                        }
                      >
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Self'>Self</SelectItem>
                        <SelectItem value='Parent'>Parent</SelectItem>
                        <SelectItem value='Guardian'>Guardian</SelectItem>
                        <SelectItem value='Spouse'>Spouse</SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {getError('loan_applicant') && (
                      <p className='text-sm text-red-500'>
                        {getError('loan_applicant')}
                      </p>
                    )}
                  </div>

                  {/* Loan Amount */}
                  <div className='space-y-2'>
                    <Label htmlFor='loan_amount'>Loan Amount *</Label>
                    <Input
                      id='loan_amount'
                      value={formData.loan_amount || ''}
                      onChange={e =>
                        onInputChange('loan_amount', e.target.value)
                      }
                      onBlur={() => onInputBlur('loan_amount')}
                      tabIndex={39}
                      className={
                        getError('loan_amount') ? 'border-red-500' : ''
                      }
                      placeholder='INR 5,00,000'
                    />
                    {getError('loan_amount') && (
                      <p className='text-sm text-red-500'>
                        {getError('loan_amount')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  {/* Type of Loan */}
                  <div className='space-y-2'>
                    <Label htmlFor='loan_type'>Type of Loan *</Label>
                    <Select
                      value={formData.loan_type || ''}
                      onValueChange={value => onInputChange('loan_type', value)}
                      onOpenChange={open => !open && onInputBlur('loan_type')}
                    >
                      <SelectTrigger
                        tabIndex={38}
                        className={
                          getError('loan_type') ? 'border-red-500' : ''
                        }
                      >
                        <SelectValue placeholder='Select' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Education Loan'>
                          Education Loan
                        </SelectItem>
                        <SelectItem value='Personal Loan'>
                          Personal Loan
                        </SelectItem>
                        <SelectItem value='Home Loan'>Home Loan</SelectItem>
                        <SelectItem value='Business Loan'>
                          Business Loan
                        </SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {getError('loan_type') && (
                      <p className='text-sm text-red-500'>
                        {getError('loan_type')}
                      </p>
                    )}
                  </div>

                  {/* CIBIL Score */}
                  <div className='space-y-2'>
                    <Label htmlFor='cibil_score'>
                      CIBIL Score of the Borrower *
                    </Label>
                    <Input
                      id='cibil_score'
                      type='number'
                      min='300'
                      max='900'
                      value={formData.cibil_score || ''}
                      onChange={e =>
                        onInputChange('cibil_score', e.target.value)
                      }
                      onBlur={() => onInputBlur('cibil_score')}
                      tabIndex={40}
                      className={
                        getError('cibil_score') ? 'border-red-500' : ''
                      }
                      placeholder='300 to 900'
                    />
                    {getError('cibil_score') && (
                      <p className='text-sm text-red-500'>
                        {getError('cibil_score')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Combined Family Income - Full Width */}
              <div className='space-y-2'>
                <Label htmlFor='family_income'>
                  Combined Family Income Per Annum *
                </Label>
                <Select
                  value={formData.family_income || ''}
                  onValueChange={value => onInputChange('family_income', value)}
                  onOpenChange={open => !open && onInputBlur('family_income')}
                >
                  <SelectTrigger
                    tabIndex={41}
                    className={
                      getError('family_income') ? 'border-red-500' : ''
                    }
                  >
                    <SelectValue placeholder='INR 5,00,000–10,00,000' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='0-2,50,000'>INR 0 - 2,50,000</SelectItem>
                    <SelectItem value='2,50,000-5,00,000'>
                      INR 2,50,000 - 5,00,000
                    </SelectItem>
                    <SelectItem value='5,00,000-10,00,000'>
                      INR 5,00,000 - 10,00,000
                    </SelectItem>
                    <SelectItem value='10,00,000-15,00,000'>
                      INR 10,00,000 - 15,00,000
                    </SelectItem>
                    <SelectItem value='15,00,000-25,00,000'>
                      INR 15,00,000 - 25,00,000
                    </SelectItem>
                    <SelectItem value='25,00,000+'>INR 25,00,000+</SelectItem>
                  </SelectContent>
                </Select>
                {getError('family_income') && (
                  <p className='text-sm text-red-500'>
                    {getError('family_income')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentalInformationSection;
