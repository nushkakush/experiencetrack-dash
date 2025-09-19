import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormQuestion, QuestionType } from '@/types/applications';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';
import { toast } from 'sonner';

interface DynamicApplicationFormProps {
  cohortId: string;
  onComplete: (answers: Record<string, any>) => void;
  onSave: (answers: Record<string, any>) => void;
  initialAnswers?: Record<string, any>;
  saving?: boolean;
}

interface FormAnswers {
  [questionId: string]: any;
}

export const DynamicApplicationForm: React.FC<DynamicApplicationFormProps> = ({
  cohortId,
  onComplete,
  onSave,
  initialAnswers = {},
  saving = false,
}) => {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<FormAnswers>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load form configuration
  useEffect(() => {
    loadFormConfiguration();
  }, [cohortId]);

  // Auto-save when answers change
  useEffect(() => {
    if (hasUnsavedChanges && Object.keys(answers).length > 0) {
      const timeoutId = setTimeout(() => {
        onSave(answers);
        setHasUnsavedChanges(false);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [answers, hasUnsavedChanges, onSave]);

  const loadFormConfiguration = async () => {
    try {
      setLoading(true);
      console.log('Loading form configuration for cohortId:', cohortId);
      const { configuration, isSetupComplete } =
        await ApplicationConfigurationService.getCompleteConfiguration(
          cohortId
        );

      console.log('Configuration result:', { configuration, isSetupComplete });

      if (!configuration) {
        console.log('No configuration found for cohort:', cohortId);
        toast.error('Application form is not configured for this cohort');
        return;
      }

      if (!isSetupComplete) {
        console.log('Configuration exists but setup is not complete');
        toast.error('Application form setup is not complete for this cohort');
        return;
      }

      console.log('Questions found:', configuration.questions?.length || 0);
      setQuestions(configuration.questions || []);
    } catch (error) {
      console.error('Error loading form configuration:', error);
      toast.error('Failed to load application form');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    setHasUnsavedChanges(true);

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    questions.forEach(question => {
      if (question.is_required) {
        const answer = answers[question.id];
        if (
          !answer ||
          (Array.isArray(answer) && answer.length === 0) ||
          (typeof answer === 'string' && !answer.trim())
        ) {
          newErrors[question.id] = 'This field is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(answers);
    } else {
      // Show the first validation error or a summary if multiple errors
      const errorKeys = Object.keys(errors);
      if (errorKeys.length === 1) {
        toast.error(errors[errorKeys[0]]);
      } else {
        toast.error(
          `Please fix the following errors: ${errorKeys
            .slice(0, 3)
            .map(key => errors[key])
            .join(', ')}${errorKeys.length > 3 ? '...' : ''}`
        );
      }
    }
  };

  const renderQuestion = (question: FormQuestion) => {
    const value = answers[question.id];
    const error = errors[question.id];

    const baseProps = {
      id: question.id,
      value: value || '',
      onChange: (newValue: any) => handleAnswerChange(question.id, newValue),
    };

    switch (question.question_type) {
      case 'short_text':
        return (
          <div key={question.id} className='space-y-2'>
            <Label htmlFor={question.id} className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <Input
              {...baseProps}
              placeholder='Enter your answer'
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'long_text':
        return (
          <div key={question.id} className='space-y-2'>
            <Label htmlFor={question.id} className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <Textarea
              {...baseProps}
              placeholder='Enter your answer'
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={question.id} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <RadioGroup
              value={value || ''}
              onValueChange={newValue =>
                handleAnswerChange(question.id, newValue)
              }
              className={error ? 'border-red-500' : ''}
            >
              {question.options?.map(option => (
                <div key={option.id} className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value={option.id}
                    id={`${question.id}-${option.id}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.id}`}
                    className='text-sm'
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'checkboxes':
        return (
          <div key={question.id} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <div className='space-y-2'>
              {question.options?.map(option => (
                <div key={option.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={
                      Array.isArray(value) ? value.includes(option.id) : false
                    }
                    onCheckedChange={checked => {
                      const currentValues = Array.isArray(value) ? value : [];
                      if (checked) {
                        handleAnswerChange(question.id, [
                          ...currentValues,
                          option.id,
                        ]);
                      } else {
                        handleAnswerChange(
                          question.id,
                          currentValues.filter((v: string) => v !== option.id)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.id}`}
                    className='text-sm'
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <div key={question.id} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <Select
              value={value || ''}
              onValueChange={newValue =>
                handleAnswerChange(question.id, newValue)
              }
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder='Select an option' />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={question.id} className='space-y-2'>
            <Label htmlFor={question.id} className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <Input
              {...baseProps}
              type='date'
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'time':
        return (
          <div key={question.id} className='space-y-2'>
            <Label htmlFor={question.id} className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <Input
              {...baseProps}
              type='time'
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      case 'linear_scale':
        return (
          <div key={question.id} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            {question.description && (
              <p className='text-xs text-muted-foreground'>
                {question.description}
              </p>
            )}
            <div className='space-y-2'>
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>1 (Strongly Disagree)</span>
                <span>5 (Strongly Agree)</span>
              </div>
              <RadioGroup
                value={value?.toString() || ''}
                onValueChange={newValue =>
                  handleAnswerChange(question.id, parseInt(newValue))
                }
                className='flex justify-between'
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className='flex items-center space-x-1'>
                    <RadioGroupItem
                      value={num.toString()}
                      id={`${question.id}-${num}`}
                    />
                    <Label
                      htmlFor={`${question.id}-${num}`}
                      className='text-sm'
                    >
                      {num}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {error && <p className='text-xs text-red-500'>{error}</p>}
          </div>
        );

      default:
        return (
          <div key={question.id} className='space-y-2'>
            <Label className='text-sm font-medium'>
              {question.question_text}
              {question.is_required && (
                <span className='text-red-500 ml-1'>*</span>
              )}
            </Label>
            <p className='text-xs text-muted-foreground'>
              Question type "{question.question_type}" is not yet supported
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading application form...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          No application form has been configured for this cohort yet. Please
          contact the administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-6'>{questions.map(renderQuestion)}</div>

      <div className='flex justify-between pt-6 border-t'>
        <Button
          type='button'
          variant='outline'
          onClick={() => onSave(answers)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            'Save Draft'
          )}
        </Button>
        <Button type='submit' disabled={saving}>
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Submitting...
            </>
          ) : (
            'Submit Application Form'
          )}
        </Button>
      </div>
    </form>
  );
};

export default DynamicApplicationForm;
