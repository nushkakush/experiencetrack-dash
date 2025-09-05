import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  List,
  CheckSquare,
  ChevronDown,
  Sliders,
  Grid,
  Calendar,
  Clock,
  Upload,
} from 'lucide-react';
import {
  FormQuestion,
  QuestionType,
  QuestionOption,
  GridOption,
} from '@/types/applications';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';
import { toast } from 'sonner';

interface QuestionEditorProps {
  question: FormQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: FormQuestion) => void;
  isSaving?: boolean;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState<Partial<FormQuestion>>({});
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [gridRows, setGridRows] = useState<GridOption[]>([]);
  const [gridColumns, setGridColumns] = useState<QuestionOption[]>([]);

  // Initialize form data when question changes
  useEffect(() => {
    if (question) {
      setFormData(question);
      setOptions(question.options || []);
      setGridRows(question.grid_rows || []);
      setGridColumns(question.grid_columns || []);
    } else {
      setFormData({});
      setOptions([]);
      setGridRows([]);
      setGridColumns([]);
    }
  }, [question]);

  // Handle form field changes
  const handleFieldChange = (field: keyof FormQuestion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add new option
  const addOption = () => {
    const newOption: QuestionOption = {
      id: Date.now().toString(),
      text: '',
      value: '',
    };
    setOptions(prev => [...prev, newOption]);
  };

  // Update option
  const updateOption = (
    index: number,
    field: keyof QuestionOption,
    value: string
  ) => {
    setOptions(prev =>
      prev.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      )
    );
  };

  // Remove option
  const removeOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  // Add new grid row
  const addGridRow = () => {
    const newRow: GridOption = {
      id: Date.now().toString(),
      text: '',
    };
    setGridRows(prev => [...prev, newRow]);
  };

  // Update grid row
  const updateGridRow = (
    index: number,
    field: keyof GridOption,
    value: string
  ) => {
    setGridRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Remove grid row
  const removeGridRow = (index: number) => {
    setGridRows(prev => prev.filter((_, i) => i !== index));
  };

  // Add new grid column
  const addGridColumn = () => {
    const newColumn: QuestionOption = {
      id: Date.now().toString(),
      text: '',
      value: '',
    };
    setGridColumns(prev => [...prev, newColumn]);
  };

  // Update grid column
  const updateGridColumn = (
    index: number,
    field: keyof QuestionOption,
    value: string
  ) => {
    setGridColumns(prev =>
      prev.map((column, i) =>
        i === index ? { ...column, [field]: value } : column
      )
    );
  };

  // Remove grid column
  const removeGridColumn = (index: number) => {
    setGridColumns(prev => prev.filter((_, i) => i !== index));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.question_text?.trim()) {
      toast.error('Question text is required');
      return;
    }

    const updatedQuestion: FormQuestion = {
      ...(formData as FormQuestion),
      options: options.filter(opt => opt.text.trim() && opt.value.trim()),
      grid_rows: gridRows.filter(row => row.text.trim()),
      grid_columns: gridColumns.filter(
        col => col.text.trim() && col.value.trim()
      ),
    };

    try {
      if (question?.id) {
        // Update existing question
        const savedQuestion =
          await ApplicationConfigurationService.updateQuestion(
            question.id,
            updatedQuestion
          );
        if (savedQuestion) {
          onSave(savedQuestion);
          toast.success('Question updated successfully');
        } else {
          toast.error('Failed to update question');
        }
      }
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  // Check if question type needs options
  const needsOptions = (type: QuestionType) => {
    return ['multiple_choice', 'checkboxes', 'dropdown'].includes(type);
  };

  // Check if question type needs grid
  const needsGrid = (type: QuestionType) => {
    return ['multiple_choice_grid', 'checkbox_grid'].includes(type);
  };

  // Check if question type needs validation rules
  const needsValidation = (type: QuestionType) => {
    return ['short_text', 'long_text', 'linear_scale', 'file_upload'].includes(
      type
    );
  };

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>
            Customize your question settings and options
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Question Text */}
          <div className='space-y-2'>
            <Label htmlFor='question-text'>Question Text *</Label>
            <Textarea
              id='question-text'
              value={formData.question_text || ''}
              onChange={e => handleFieldChange('question_text', e.target.value)}
              placeholder='Enter your question...'
              rows={3}
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description (Optional)</Label>
            <Input
              id='description'
              value={formData.description || ''}
              onChange={e => handleFieldChange('description', e.target.value)}
              placeholder='Add a description or help text...'
            />
          </div>

          {/* Question Type */}
          <div className='space-y-2'>
            <Label>Question Type</Label>
            <Select
              value={formData.question_type || 'short_text'}
              onValueChange={value => handleFieldChange('question_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='short_text'>
                  <div className='flex items-center gap-2'>
                    <Type className='h-4 w-4' />
                    Short Text
                  </div>
                </SelectItem>
                <SelectItem value='long_text'>
                  <div className='flex items-center gap-2'>
                    <Type className='h-4 w-4' />
                    Long Text
                  </div>
                </SelectItem>
                <SelectItem value='multiple_choice'>
                  <div className='flex items-center gap-2'>
                    <List className='h-4 w-4' />
                    Multiple Choice
                  </div>
                </SelectItem>
                <SelectItem value='checkboxes'>
                  <div className='flex items-center gap-2'>
                    <CheckSquare className='h-4 w-4' />
                    Checkboxes
                  </div>
                </SelectItem>
                <SelectItem value='dropdown'>
                  <div className='flex items-center gap-2'>
                    <ChevronDown className='h-4 w-4' />
                    Dropdown
                  </div>
                </SelectItem>
                <SelectItem value='linear_scale'>
                  <div className='flex items-center gap-2'>
                    <Sliders className='h-4 w-4' />
                    Linear Scale
                  </div>
                </SelectItem>
                <SelectItem value='multiple_choice_grid'>
                  <div className='flex items-center gap-2'>
                    <Grid className='h-4 w-4' />
                    Multiple Choice Grid
                  </div>
                </SelectItem>
                <SelectItem value='checkbox_grid'>
                  <div className='flex items-center gap-2'>
                    <Grid className='h-4 w-4' />
                    Checkbox Grid
                  </div>
                </SelectItem>
                <SelectItem value='date'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    Date
                  </div>
                </SelectItem>
                <SelectItem value='time'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4' />
                    Time
                  </div>
                </SelectItem>
                <SelectItem value='file_upload'>
                  <div className='flex items-center gap-2'>
                    <Upload className='h-4 w-4' />
                    File Upload
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Required Toggle */}
          <div className='flex items-center space-x-2'>
            <Switch
              id='required'
              checked={formData.is_required || false}
              onCheckedChange={checked =>
                handleFieldChange('is_required', checked)
              }
            />
            <Label htmlFor='required'>Required question</Label>
          </div>

          {/* Options for choice-based questions */}
          {needsOptions(formData.question_type as QuestionType) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Options</CardTitle>
                <CardDescription>
                  Add the choices for this question
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {options.map((option, index) => (
                  <div key={option.id} className='flex items-center gap-2'>
                    <GripVertical className='h-4 w-4 text-muted-foreground' />
                    <Input
                      value={option.text}
                      onChange={e =>
                        updateOption(index, 'text', e.target.value)
                      }
                      placeholder='Option text'
                      className='flex-1'
                    />
                    <Input
                      value={option.value}
                      onChange={e =>
                        updateOption(index, 'value', e.target.value)
                      }
                      placeholder='Value'
                      className='w-24'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addOption}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Option
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Grid rows for grid questions */}
          {needsGrid(formData.question_type as QuestionType) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Grid Rows</CardTitle>
                <CardDescription>
                  Add the row labels for your grid
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {gridRows.map((row, index) => (
                  <div key={row.id} className='flex items-center gap-2'>
                    <GripVertical className='h-4 w-4 text-muted-foreground' />
                    <Input
                      value={row.text}
                      onChange={e =>
                        updateGridRow(index, 'text', e.target.value)
                      }
                      placeholder='Row label'
                      className='flex-1'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeGridRow(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addGridRow}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Row
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Grid columns for grid questions */}
          {needsGrid(formData.question_type as QuestionType) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Grid Columns</CardTitle>
                <CardDescription>
                  Add the column options for your grid
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                {gridColumns.map((column, index) => (
                  <div key={column.id} className='flex items-center gap-2'>
                    <GripVertical className='h-4 w-4 text-muted-foreground' />
                    <Input
                      value={column.text}
                      onChange={e =>
                        updateGridColumn(index, 'text', e.target.value)
                      }
                      placeholder='Column text'
                      className='flex-1'
                    />
                    <Input
                      value={column.value}
                      onChange={e =>
                        updateGridColumn(index, 'value', e.target.value)
                      }
                      placeholder='Value'
                      className='w-24'
                    />
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeGridColumn(index)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={addGridColumn}
                  className='w-full'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Column
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Validation Rules */}
          {needsValidation(formData.question_type as QuestionType) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Validation Rules</CardTitle>
                <CardDescription>
                  Set validation rules for this question
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Text validation rules for short_text and long_text */}
                {(formData.question_type === 'short_text' ||
                  formData.question_type === 'long_text') && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>Minimum Length</Label>
                        <Input
                          type='number'
                          value={formData.validation_rules?.min_length || ''}
                          onChange={e =>
                            handleFieldChange('validation_rules', {
                              ...formData.validation_rules,
                              min_length: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder='e.g., 5'
                        />
                        <p className='text-xs text-muted-foreground'>
                          Minimum number of characters required
                        </p>
                      </div>
                      <div className='space-y-2'>
                        <Label>Maximum Length</Label>
                        <Input
                          type='number'
                          value={formData.validation_rules?.max_length || ''}
                          onChange={e =>
                            handleFieldChange('validation_rules', {
                              ...formData.validation_rules,
                              max_length: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            })
                          }
                          placeholder='e.g., 100'
                        />
                        <p className='text-xs text-muted-foreground'>
                          Maximum number of characters allowed
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Linear scale validation rules */}
                {formData.question_type === 'linear_scale' && (
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Minimum Value</Label>
                      <Input
                        type='number'
                        value={formData.validation_rules?.scale_min || 1}
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            scale_min: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Maximum Value</Label>
                      <Input
                        type='number'
                        value={formData.validation_rules?.scale_max || 5}
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            scale_max: parseInt(e.target.value) || 5,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Minimum Label</Label>
                      <Input
                        value={formData.validation_rules?.scale_min_label || ''}
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            scale_min_label: e.target.value,
                          })
                        }
                        placeholder='e.g., Poor'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Maximum Label</Label>
                      <Input
                        value={formData.validation_rules?.scale_max_label || ''}
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            scale_max_label: e.target.value,
                          })
                        }
                        placeholder='e.g., Excellent'
                      />
                    </div>
                  </div>
                )}

                {/* File upload validation rules */}
                {formData.question_type === 'file_upload' && (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>Allowed File Types</Label>
                      <Input
                        value={
                          formData.validation_rules?.file_types?.join(', ') ||
                          ''
                        }
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            file_types: e.target.value
                              .split(',')
                              .map(t => t.trim())
                              .filter(t => t),
                          })
                        }
                        placeholder='e.g., pdf, doc, docx'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label>Maximum File Size (MB)</Label>
                      <Input
                        type='number'
                        value={formData.validation_rules?.max_file_size || 5}
                        onChange={e =>
                          handleFieldChange('validation_rules', {
                            ...formData.validation_rules,
                            max_file_size: parseInt(e.target.value) || 5,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-2 pt-4 border-t'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Question'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
