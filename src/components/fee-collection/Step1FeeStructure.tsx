import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NewFeeStructureInput } from '@/types/fee';

interface Step1FeeStructureProps {
  data: NewFeeStructureInput;
  onChange: (data: NewFeeStructureInput) => void;
  errors?: Record<string, string>;
  isReadOnly?: boolean;
}

export default function Step1FeeStructure({ data, onChange, errors, isReadOnly = false }: Step1FeeStructureProps) {
  const handleChange = (field: keyof NewFeeStructureInput, value: string | number) => {
    if (isReadOnly) return; // Prevent changes in read-only mode
    
    let numericValue: number;
    
    if (typeof value === 'string') {
      // Remove commas and convert to number
      const cleanValue = value.replace(/,/g, '');
      numericValue = parseFloat(cleanValue) || 0;
    } else {
      numericValue = value;
    }
    
    onChange({
      ...data,
      [field]: numericValue
    });
  };

  const formatIndianNumber = (value: number): string => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const ReadOnlyField = ({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      <div className="p-3 bg-muted/50 rounded-md border">
        <span className="text-lg font-semibold">{value}{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {isReadOnly ? 'Fee Structure Overview' : 'Step 1: Fee Structure'}
        </h2>
        <p className="text-muted-foreground">
          {isReadOnly 
            ? 'Current fee structure configuration for this cohort'
            : 'Configure the basic fee structure for this cohort'
          }
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Configuration</CardTitle>
            <CardDescription>
              {isReadOnly 
                ? 'Current fee structure including admission fee and program fee'
                : 'Set up the basic fee structure including admission fee and program fee'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isReadOnly ? (
                <>
                  <ReadOnlyField 
                    label="Admission Fee" 
                    value={`₹${formatIndianNumber(data.admission_fee)}`} 
                  />
                  <ReadOnlyField 
                    label="Total Program Fee" 
                    value={`₹${formatIndianNumber(data.total_program_fee)}`} 
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admission_fee">Admission Fee (₹)</Label>
                    <Input
                      id="admission_fee"
                      type="text"
                      value={formatIndianNumber(data.admission_fee)}
                      onChange={(e) => handleChange('admission_fee', e.target.value)}
                      placeholder="0.00"
                      className={errors?.admission_fee ? 'border-red-500' : ''}
                    />
                    {errors?.admission_fee && (
                      <p className="text-sm text-red-500">{errors.admission_fee}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_program_fee">Total Program Fee (₹)</Label>
                    <Input
                      id="total_program_fee"
                      type="text"
                      value={formatIndianNumber(data.total_program_fee)}
                      onChange={(e) => handleChange('total_program_fee', e.target.value)}
                      placeholder="0.00"
                      className={errors?.total_program_fee ? 'border-red-500' : ''}
                    />
                    {errors?.total_program_fee && (
                      <p className="text-sm text-red-500">{errors.total_program_fee}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semester Configuration</CardTitle>
            <CardDescription>
              {isReadOnly 
                ? 'Current semester and instalment configuration'
                : 'Configure the number of semesters and instalments per semester'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isReadOnly ? (
                <>
                  <ReadOnlyField 
                    label="Number of Semesters" 
                    value={data.number_of_semesters} 
                  />
                  <ReadOnlyField 
                    label="Instalments per Semester" 
                    value={data.instalments_per_semester} 
                  />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="number_of_semesters">Number of Semesters</Label>
                    <Input
                      id="number_of_semesters"
                      type="number"
                      min="1"
                      max="12"
                      value={data.number_of_semesters}
                      onChange={(e) => handleChange('number_of_semesters', e.target.value)}
                      placeholder="4"
                      className={errors?.number_of_semesters ? 'border-red-500' : ''}
                    />
                    {errors?.number_of_semesters && (
                      <p className="text-sm text-red-500">{errors.number_of_semesters}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instalments_per_semester">Instalments per Semester</Label>
                    <Input
                      id="instalments_per_semester"
                      type="number"
                      min="1"
                      max="12"
                      value={data.instalments_per_semester}
                      onChange={(e) => handleChange('instalments_per_semester', e.target.value)}
                      placeholder="3"
                      className={errors?.instalments_per_semester ? 'border-red-500' : ''}
                    />
                    {errors?.instalments_per_semester && (
                      <p className="text-sm text-red-500">{errors.instalments_per_semester}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      This setting is used for "Instalment-wise Payment" plan. For "Semester-wise Payment", there will be only 1 payment per semester.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Discount</CardTitle>
            <CardDescription>
              {isReadOnly 
                ? 'Current discount percentage for one-shot payments'
                : 'Set the discount percentage for one-shot payments'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {isReadOnly ? (
                <ReadOnlyField 
                  label="One-Shot Payment Discount" 
                  value={`${data.one_shot_discount_percentage}%`} 
                />
              ) : (
                <>
                  <Label htmlFor="one_shot_discount_percentage">One-Shot Payment Discount (%)</Label>
                  <Input
                    id="one_shot_discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={data.one_shot_discount_percentage}
                    onChange={(e) => handleChange('one_shot_discount_percentage', e.target.value)}
                    placeholder="0.00"
                    className={errors?.one_shot_discount_percentage ? 'border-red-500' : ''}
                  />
                  {errors?.one_shot_discount_percentage && (
                    <p className="text-sm text-red-500">{errors.one_shot_discount_percentage}</p>
                  )}
                </>
              )}
              <p className="text-sm text-muted-foreground">
                This discount will be applied when students choose to pay the entire program fee upfront
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
