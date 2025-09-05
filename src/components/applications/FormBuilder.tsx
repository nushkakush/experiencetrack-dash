import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Edit3,
  Eye,
  Type,
  List,
  CheckSquare,
  ChevronDown,
  Sliders,
  Grid,
  Calendar,
  Clock,
  Upload,
  MoreHorizontal,
} from 'lucide-react';
import {
  FormQuestion,
  QuestionType,
  QuestionOption,
  GridOption,
} from '@/types/applications';
import { ApplicationConfigurationService } from '@/services/applicationConfiguration.service';
import { toast } from 'sonner';

interface FormBuilderProps {
  configurationId: string;
  questions: FormQuestion[];
  onQuestionsChange: (questions: FormQuestion[]) => void;
  onEditQuestion: (question: FormQuestion) => void;
  onSave: () => void;
  isSaving?: boolean;
}

// Question type templates
const questionTemplates = [
  {
    type: 'short_text' as QuestionType,
    name: 'Short Text',
    description: 'Single line text input',
    icon: Type,
    defaultQuestion: {
      question_text: 'What is your name?',
      question_type: 'short_text' as QuestionType,
      is_required: true,
      options: [],
    },
  },
  {
    type: 'long_text' as QuestionType,
    name: 'Long Text',
    description: 'Multi-line text input',
    icon: Type,
    defaultQuestion: {
      question_text: 'Tell us about yourself',
      question_type: 'long_text' as QuestionType,
      is_required: false,
      options: [],
    },
  },
  {
    type: 'multiple_choice' as QuestionType,
    name: 'Multiple Choice',
    description: 'Single selection from options',
    icon: List,
    defaultQuestion: {
      question_text: 'What is your preferred programming language?',
      question_type: 'multiple_choice' as QuestionType,
      is_required: true,
      options: [
        { id: '1', text: 'JavaScript', value: 'javascript' },
        { id: '2', text: 'Python', value: 'python' },
        { id: '3', text: 'Java', value: 'java' },
      ],
    },
  },
  {
    type: 'checkboxes' as QuestionType,
    name: 'Checkboxes',
    description: 'Multiple selections from options',
    icon: CheckSquare,
    defaultQuestion: {
      question_text: 'What technologies are you familiar with?',
      question_type: 'checkboxes' as QuestionType,
      is_required: false,
      options: [
        { id: '1', text: 'React', value: 'react' },
        { id: '2', text: 'Vue', value: 'vue' },
        { id: '3', text: 'Angular', value: 'angular' },
      ],
    },
  },
  {
    type: 'dropdown' as QuestionType,
    name: 'Dropdown',
    description: 'Single selection dropdown',
    icon: ChevronDown,
    defaultQuestion: {
      question_text: 'What is your experience level?',
      question_type: 'dropdown' as QuestionType,
      is_required: true,
      options: [
        { id: '1', text: 'Beginner', value: 'beginner' },
        { id: '2', text: 'Intermediate', value: 'intermediate' },
        { id: '3', text: 'Advanced', value: 'advanced' },
      ],
    },
  },
  {
    type: 'linear_scale' as QuestionType,
    name: 'Linear Scale',
    description: 'Rating scale (1-5, 1-10, etc.)',
    icon: Sliders,
    defaultQuestion: {
      question_text: 'How would you rate your programming skills?',
      question_type: 'linear_scale' as QuestionType,
      is_required: true,
      options: [],
      validation_rules: {
        scale_min: 1,
        scale_max: 5,
        scale_min_label: 'Poor',
        scale_max_label: 'Excellent',
      },
    },
  },
  {
    type: 'multiple_choice_grid' as QuestionType,
    name: 'Multiple Choice Grid',
    description: 'Grid with single selection per row',
    icon: Grid,
    defaultQuestion: {
      question_text: 'Rate the following aspects:',
      question_type: 'multiple_choice_grid' as QuestionType,
      is_required: true,
      options: [
        { id: '1', text: 'Excellent', value: 'excellent' },
        { id: '2', text: 'Good', value: 'good' },
        { id: '3', text: 'Average', value: 'average' },
        { id: '4', text: 'Poor', value: 'poor' },
      ],
      grid_rows: [
        { id: '1', text: 'Communication' },
        { id: '2', text: 'Technical Skills' },
        { id: '3', text: 'Problem Solving' },
      ],
    },
  },
  {
    type: 'checkbox_grid' as QuestionType,
    name: 'Checkbox Grid',
    description: 'Grid with multiple selections per row',
    icon: Grid,
    defaultQuestion: {
      question_text: 'Select all that apply:',
      question_type: 'checkbox_grid' as QuestionType,
      is_required: false,
      options: [
        { id: '1', text: 'Yes', value: 'yes' },
        { id: '2', text: 'No', value: 'no' },
      ],
      grid_rows: [
        { id: '1', text: 'I have a computer' },
        { id: '2', text: 'I have internet access' },
        { id: '3', text: 'I can attend online sessions' },
      ],
    },
  },
  {
    type: 'date' as QuestionType,
    name: 'Date',
    description: 'Date picker input',
    icon: Calendar,
    defaultQuestion: {
      question_text: 'What is your date of birth?',
      question_type: 'date' as QuestionType,
      is_required: true,
      options: [],
    },
  },
  {
    type: 'time' as QuestionType,
    name: 'Time',
    description: 'Time picker input',
    icon: Clock,
    defaultQuestion: {
      question_text: 'What time works best for you?',
      question_type: 'time' as QuestionType,
      is_required: false,
      options: [],
    },
  },
  {
    type: 'file_upload' as QuestionType,
    name: 'File Upload',
    description: 'File upload input',
    icon: Upload,
    defaultQuestion: {
      question_text: 'Upload your resume',
      question_type: 'file_upload' as QuestionType,
      is_required: true,
      options: [],
      validation_rules: {
        file_types: ['pdf', 'doc', 'docx'],
        max_file_size: 5, // 5MB
      },
    },
  },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  configurationId,
  questions,
  onQuestionsChange,
  onEditQuestion,
  onSave,
  isSaving = false,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<FormQuestion | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Add new question
  const addQuestion = async (template: (typeof questionTemplates)[0]) => {
    try {
      const nextOrder = questions.length + 1;
      const newQuestion: Omit<
        FormQuestion,
        'id' | 'created_at' | 'updated_at'
      > = {
        configuration_id: configurationId,
        question_text: template.defaultQuestion.question_text,
        question_type: template.defaultQuestion.question_type,
        is_required: template.defaultQuestion.is_required,
        question_order: nextOrder,
        options: template.defaultQuestion.options || [],
        grid_rows: template.defaultQuestion.grid_rows || [],
        grid_columns: template.defaultQuestion.grid_columns || [],
        validation_rules: template.defaultQuestion.validation_rules || {},
        description: '',
      };

      const savedQuestion =
        await ApplicationConfigurationService.addQuestion(newQuestion);
      if (savedQuestion) {
        onQuestionsChange([...questions, savedQuestion]);
        toast.success('Question added successfully');
      } else {
        toast.error('Failed to add question');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    }
  };

  // Update question
  const updateQuestion = async (
    questionId: string,
    updates: Partial<FormQuestion>
  ) => {
    try {
      const updatedQuestion =
        await ApplicationConfigurationService.updateQuestion(
          questionId,
          updates
        );
      if (updatedQuestion) {
        const updatedQuestions = questions.map(q =>
          q.id === questionId ? updatedQuestion : q
        );
        onQuestionsChange(updatedQuestions);
        toast.success('Question updated successfully');
      } else {
        toast.error('Failed to update question');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  // Delete question
  const deleteQuestion = async (questionId: string) => {
    try {
      const success =
        await ApplicationConfigurationService.deleteQuestion(questionId);
      if (success) {
        const updatedQuestions = questions.filter(q => q.id !== questionId);
        onQuestionsChange(updatedQuestions);
        toast.success('Question deleted successfully');
      } else {
        toast.error('Failed to delete question');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  // Duplicate question
  const duplicateQuestion = async (question: FormQuestion) => {
    try {
      const nextOrder = questions.length + 1;
      const duplicatedQuestion: Omit<
        FormQuestion,
        'id' | 'created_at' | 'updated_at'
      > = {
        configuration_id: configurationId,
        question_text: `${question.question_text} (Copy)`,
        question_type: question.question_type,
        is_required: question.is_required,
        question_order: nextOrder,
        options: question.options || [],
        grid_rows: question.grid_rows || [],
        grid_columns: question.grid_columns || [],
        validation_rules: question.validation_rules || {},
        description: question.description || '',
      };

      const savedQuestion =
        await ApplicationConfigurationService.addQuestion(duplicatedQuestion);
      if (savedQuestion) {
        onQuestionsChange([...questions, savedQuestion]);
        toast.success('Question duplicated successfully');
      } else {
        toast.error('Failed to duplicate question');
      }
    } catch (error) {
      console.error('Error duplicating question:', error);
      toast.error('Failed to duplicate question');
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order in database
    const reorderData = items.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));

    const success = await ApplicationConfigurationService.reorderQuestions(
      configurationId,
      reorderData
    );

    if (success) {
      const updatedQuestions = items.map((item, index) => ({
        ...item,
        question_order: index + 1,
      }));
      onQuestionsChange(updatedQuestions);
    }
  };

  // Render question preview
  const renderQuestionPreview = (question: FormQuestion) => {
    const isRequired = question.is_required;

    return (
      <div className='space-y-3'>
        <div className='flex items-start gap-2'>
          <Label className='text-sm font-medium'>
            {question.question_text}
            {isRequired && <span className='text-red-500 ml-1'>*</span>}
          </Label>
        </div>

        {question.description && (
          <p className='text-sm text-muted-foreground'>
            {question.description}
          </p>
        )}

        {/* Render different question types */}
        {question.question_type === 'short_text' && (
          <Input placeholder='Enter your answer...' disabled />
        )}

        {question.question_type === 'long_text' && (
          <Textarea placeholder='Enter your answer...' disabled rows={3} />
        )}

        {question.question_type === 'multiple_choice' && (
          <div className='space-y-2'>
            {question.options?.map(option => (
              <div key={option.id} className='flex items-center space-x-2'>
                <input type='radio' disabled className='rounded' />
                <Label className='text-sm'>{option.text}</Label>
              </div>
            ))}
          </div>
        )}

        {question.question_type === 'checkboxes' && (
          <div className='space-y-2'>
            {question.options?.map(option => (
              <div key={option.id} className='flex items-center space-x-2'>
                <input type='checkbox' disabled className='rounded' />
                <Label className='text-sm'>{option.text}</Label>
              </div>
            ))}
          </div>
        )}

        {question.question_type === 'dropdown' && (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder='Select an option...' />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map(option => (
                <SelectItem key={option.id} value={option.value}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.question_type === 'linear_scale' && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>
                {question.validation_rules?.scale_min_label || 'Poor'}
              </span>
              <span>
                {question.validation_rules?.scale_max_label || 'Excellent'}
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              {Array.from(
                {
                  length:
                    (question.validation_rules?.scale_max || 5) -
                    (question.validation_rules?.scale_min || 1) +
                    1,
                },
                (_, i) => (
                  <input key={i} type='radio' disabled className='rounded' />
                )
              )}
            </div>
          </div>
        )}

        {question.question_type === 'date' && <Input type='date' disabled />}

        {question.question_type === 'time' && <Input type='time' disabled />}

        {question.question_type === 'file_upload' && (
          <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center'>
            <Upload className='h-8 w-8 mx-auto text-gray-400 mb-2' />
            <p className='text-sm text-gray-500'>Click to upload file</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold'>Form Builder</h3>
          <p className='text-sm text-muted-foreground'>
            Add and customize questions for your application form
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className='h-4 w-4 mr-2' />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={onSave} disabled={isSaving} size='sm'>
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Question Templates Sidebar */}
        {!previewMode && (
          <div className='lg:col-span-1'>
            <div className='space-y-4'>
              <div>
                <h4 className='text-sm font-medium'>Add Question</h4>
                <p className='text-xs text-muted-foreground'>
                  Choose a question type to add to your form
                </p>
              </div>
              <div className='space-y-2'>
                {questionTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <Button
                      key={template.type}
                      variant='outline'
                      className='w-full justify-start h-auto p-3'
                      onClick={() => addQuestion(template)}
                    >
                      <div className='flex items-start gap-3'>
                        <Icon className='h-4 w-4 mt-0.5' />
                        <div className='text-left'>
                          <p className='font-medium text-sm'>{template.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className={previewMode ? 'lg:col-span-3' : 'lg:col-span-2'}>
          <div className='space-y-4'>
            <div>
              <h4 className='text-sm font-medium'>
                Form Questions ({questions.length})
              </h4>
              <p className='text-xs text-muted-foreground'>
                {previewMode
                  ? 'Preview of how your form will look to students'
                  : 'Drag to reorder questions, click to edit'}
              </p>
            </div>
            <div>
              {questions.length === 0 ? (
                <div className='text-center py-8'>
                  <Type className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No questions yet
                  </h3>
                  <p className='text-muted-foreground mb-4'>
                    Add your first question to get started
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId='questions'>
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className='space-y-4'
                      >
                        {questions
                          .sort((a, b) => a.question_order - b.question_order)
                          .map((question, index) => (
                            <Draggable
                              key={question.id}
                              draggableId={question.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`p-4 border rounded-lg bg-white ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className='flex items-start gap-3'>
                                    {!previewMode && (
                                      <div
                                        {...provided.dragHandleProps}
                                        className='mt-1 cursor-grab'
                                      >
                                        <GripVertical className='h-4 w-4 text-muted-foreground' />
                                      </div>
                                    )}

                                    <div className='flex-1'>
                                      {previewMode ? (
                                        renderQuestionPreview(question)
                                      ) : (
                                        <div className='space-y-2'>
                                          <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                              <Badge
                                                variant='outline'
                                                className='text-xs'
                                              >
                                                {question.question_type.replace(
                                                  '_',
                                                  ' '
                                                )}
                                              </Badge>
                                              {question.is_required && (
                                                <Badge
                                                  variant='destructive'
                                                  className='text-xs'
                                                >
                                                  Required
                                                </Badge>
                                              )}
                                              {/* Validation rules badges */}
                                              {question.validation_rules && (
                                                <>
                                                  {question.validation_rules
                                                    .min_length && (
                                                    <Badge
                                                      variant='secondary'
                                                      className='text-xs'
                                                    >
                                                      Min:{' '}
                                                      {
                                                        question
                                                          .validation_rules
                                                          .min_length
                                                      }
                                                    </Badge>
                                                  )}
                                                  {question.validation_rules
                                                    .max_length && (
                                                    <Badge
                                                      variant='secondary'
                                                      className='text-xs'
                                                    >
                                                      Max:{' '}
                                                      {
                                                        question
                                                          .validation_rules
                                                          .max_length
                                                      }
                                                    </Badge>
                                                  )}
                                                  {question.validation_rules
                                                    .scale_min &&
                                                    question.validation_rules
                                                      .scale_max && (
                                                      <Badge
                                                        variant='secondary'
                                                        className='text-xs'
                                                      >
                                                        Scale:{' '}
                                                        {
                                                          question
                                                            .validation_rules
                                                            .scale_min
                                                        }
                                                        -
                                                        {
                                                          question
                                                            .validation_rules
                                                            .scale_max
                                                        }
                                                      </Badge>
                                                    )}
                                                  {question.validation_rules
                                                    .file_types &&
                                                    question.validation_rules
                                                      .file_types.length >
                                                      0 && (
                                                      <Badge
                                                        variant='secondary'
                                                        className='text-xs'
                                                      >
                                                        Files:{' '}
                                                        {question.validation_rules.file_types.join(
                                                          ', '
                                                        )}
                                                      </Badge>
                                                    )}
                                                  {question.validation_rules
                                                    .max_file_size && (
                                                    <Badge
                                                      variant='secondary'
                                                      className='text-xs'
                                                    >
                                                      Max:{' '}
                                                      {
                                                        question
                                                          .validation_rules
                                                          .max_file_size
                                                      }
                                                      MB
                                                    </Badge>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant='ghost'
                                                  size='sm'
                                                >
                                                  <MoreHorizontal className='h-4 w-4' />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    onEditQuestion(question)
                                                  }
                                                >
                                                  <Edit3 className='h-4 w-4 mr-2' />
                                                  Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    duplicateQuestion(question)
                                                  }
                                                >
                                                  <Copy className='h-4 w-4 mr-2' />
                                                  Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    deleteQuestion(question.id)
                                                  }
                                                  className='text-red-600'
                                                >
                                                  <Trash2 className='h-4 w-4 mr-2' />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                          <p className='font-medium'>
                                            {question.question_text}
                                          </p>
                                          {question.description && (
                                            <p className='text-sm text-muted-foreground'>
                                              {question.description}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
