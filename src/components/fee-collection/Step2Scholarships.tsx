import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scholarship, NewScholarshipInput } from '@/types/fee';
import { validateScholarshipRanges } from '@/utils/feeCalculations';

interface Step2ScholarshipsProps {
  scholarships: Scholarship[];
  onScholarshipsChange: (scholarships: Scholarship[]) => void;
  errors?: Record<string, string>;
}

export default function Step2Scholarships({ scholarships, onScholarshipsChange, errors }: Step2ScholarshipsProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addScholarship = () => {
    const newScholarship: Scholarship = {
      id: `temp-${Date.now()}`,
      cohort_id: '',
      name: '',
      description: '',
      start_percentage: 0,
      end_percentage: 0,
      amount_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const updatedScholarships = [...scholarships, newScholarship];
    onScholarshipsChange(updatedScholarships);
    validateScholarships(updatedScholarships);
  };

  const updateScholarship = (index: number, field: keyof NewScholarshipInput, value: string | number) => {
    const updatedScholarships = [...scholarships];
    
    // Handle different field types
    let processedValue: string | number;
    if (field === 'name' || field === 'description') {
      processedValue = value as string;
    } else {
      processedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    
    updatedScholarships[index] = {
      ...updatedScholarships[index],
      [field]: processedValue
    };
    
    onScholarshipsChange(updatedScholarships);
    validateScholarships(updatedScholarships);
  };

  const removeScholarship = (index: number) => {
    const updatedScholarships = scholarships.filter((_, i) => i !== index);
    onScholarshipsChange(updatedScholarships);
    validateScholarships(updatedScholarships);
  };

  const validateScholarships = (scholarshipsToValidate: Scholarship[]) => {
    const validation = validateScholarshipRanges(scholarshipsToValidate);
    setValidationErrors(validation.errors);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Step 2: Scholarships</h2>
        <p className="text-muted-foreground">
          Configure scholarship slabs based on test scores
        </p>
      </div>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {scholarships.map((scholarship, index) => (
          <Card key={scholarship.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Scholarship {index + 1}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeScholarship(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`scholarship-name-${index}`}>Scholarship Name *</Label>
                  <Input
                    id={`scholarship-name-${index}`}
                    value={scholarship.name}
                    onChange={(e) => updateScholarship(index, 'name', e.target.value)}
                    placeholder="e.g., Merit Scholarship"
                    className={errors?.[`scholarship-${index}-name`] ? 'border-red-500' : ''}
                  />
                  {errors?.[`scholarship-${index}-name`] && (
                    <p className="text-sm text-red-500">{errors[`scholarship-${index}-name`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`scholarship-amount-${index}`}>Amount (%) *</Label>
                  <Input
                    id={`scholarship-amount-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scholarship.amount_percentage}
                    onChange={(e) => updateScholarship(index, 'amount_percentage', e.target.value)}
                    placeholder="0.00"
                    className={errors?.[`scholarship-${index}-amount`] ? 'border-red-500' : ''}
                  />
                  {errors?.[`scholarship-${index}-amount`] && (
                    <p className="text-sm text-red-500">{errors[`scholarship-${index}-amount`]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`scholarship-description-${index}`}>Description</Label>
                <Textarea
                  id={`scholarship-description-${index}`}
                  value={scholarship.description || ''}
                  onChange={(e) => updateScholarship(index, 'description', e.target.value)}
                  placeholder="Brief description of this scholarship"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`scholarship-start-${index}`}>Start % (Test Score) *</Label>
                  <Input
                    id={`scholarship-start-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scholarship.start_percentage}
                    onChange={(e) => updateScholarship(index, 'start_percentage', e.target.value)}
                    placeholder="0.00"
                    className={errors?.[`scholarship-${index}-start`] ? 'border-red-500' : ''}
                  />
                  {errors?.[`scholarship-${index}-start`] && (
                    <p className="text-sm text-red-500">{errors[`scholarship-${index}-start`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`scholarship-end-${index}`}>End % (Test Score) *</Label>
                  <Input
                    id={`scholarship-end-${index}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={scholarship.end_percentage}
                    onChange={(e) => updateScholarship(index, 'end_percentage', e.target.value)}
                    placeholder="100.00"
                    className={errors?.[`scholarship-${index}-end`] ? 'border-red-500' : ''}
                  />
                  {errors?.[`scholarship-${index}-end`] && (
                    <p className="text-sm text-red-500">{errors[`scholarship-${index}-end`]}</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>This scholarship applies to students with test scores between {scholarship.start_percentage}% and {scholarship.end_percentage}%</p>
                <p>Students will receive a {scholarship.amount_percentage}% discount on their program fee</p>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          onClick={addScholarship}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Scholarship
        </Button>
      </div>

      {scholarships.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No scholarships configured yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Add Scholarship" to create scholarship slabs based on test scores
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
