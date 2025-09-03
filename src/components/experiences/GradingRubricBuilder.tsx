import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Target, Award, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RubricSection, RubricCriteria } from '@/types/experience';

interface GradingRubricBuilderProps {
  rubricSections: RubricSection[];
  onChange: (sections: RubricSection[]) => void;
}

export const GradingRubricBuilder: React.FC<GradingRubricBuilderProps> = ({
  rubricSections,
  onChange
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  const createNewSection = (): RubricSection => ({
    id: crypto.randomUUID(),
    title: '',
    weight_percentage: 0,
    criteria: []
  });

  const createNewCriteria = (): RubricCriteria => ({
    id: crypto.randomUUID(),
    name: '',
    weight_percentage: 0,
    description: ''
  });

  // Section operations
  const handleAddSection = () => {
    const newSection = createNewSection();
    onChange([...rubricSections, newSection]);
    setExpandedSections(prev => new Set(prev).add(newSection.id));
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<RubricSection>) => {
    onChange(rubricSections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const handleDeleteSection = (sectionId: string) => {
    onChange(rubricSections.filter(section => section.id !== sectionId));
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  const handleReorderSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...rubricSections];
    const [movedItem] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedItem);
    onChange(newSections);
  };

  // Criteria operations
  const handleAddCriteria = (sectionId: string) => {
    const newCriteria = createNewCriteria();
    handleUpdateSection(sectionId, {
      criteria: [...(rubricSections.find(s => s.id === sectionId)?.criteria || []), newCriteria]
    });
    setExpandedCriteria(prev => new Set(prev).add(newCriteria.id));
  };

  const handleUpdateCriteria = (sectionId: string, criteriaId: string, updates: Partial<RubricCriteria>) => {
    const section = rubricSections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedCriteria = section.criteria.map(criteria =>
      criteria.id === criteriaId ? { ...criteria, ...updates } : criteria
    );
    handleUpdateSection(sectionId, { criteria: updatedCriteria });
  };

  const handleDeleteCriteria = (sectionId: string, criteriaId: string) => {
    const section = rubricSections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedCriteria = section.criteria.filter(criteria => criteria.id !== criteriaId);
    handleUpdateSection(sectionId, { criteria: updatedCriteria });
    setExpandedCriteria(prev => {
      const newSet = new Set(prev);
      newSet.delete(criteriaId);
      return newSet;
    });
  };

  const handleReorderCriteria = (sectionId: string, fromIndex: number, toIndex: number) => {
    const section = rubricSections.find(s => s.id === sectionId);
    if (!section) return;

    const newCriteria = [...section.criteria];
    const [movedItem] = newCriteria.splice(fromIndex, 1);
    newCriteria.splice(toIndex, 0, movedItem);
    handleUpdateSection(sectionId, { criteria: newCriteria });
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleCriteriaExpanded = (criteriaId: string) => {
    setExpandedCriteria(prev => {
      const newSet = new Set(prev);
      if (newSet.has(criteriaId)) {
        newSet.delete(criteriaId);
      } else {
        newSet.add(criteriaId);
      }
      return newSet;
    });
  };

  const getTotalWeight = () => {
    return rubricSections.reduce((total, section) => total + (section.weight_percentage || 0), 0);
  };

  const getSectionTotalWeight = (section: RubricSection) => {
    return section.criteria.reduce((total, criteria) => total + (criteria.weight_percentage || 0), 0);
  };

  const isSectionWeightExceeded = (section: RubricSection) => {
    const sectionWeight = section.weight_percentage || 0;
    const criteriaTotalWeight = getSectionTotalWeight(section);
    return criteriaTotalWeight > sectionWeight;
  };

  const hasAnySectionWeightExceeded = () => {
    return rubricSections.some(section => isSectionWeightExceeded(section));
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <Label className='text-lg font-semibold'>Grading Rubric</Label>
          <div className='flex items-center space-x-2 mt-1'>
            <Badge variant={getTotalWeight() === 100 ? 'default' : 'destructive'}>
              Total: {getTotalWeight()}%
            </Badge>
            {getTotalWeight() !== 100 && (
              <span className='text-xs text-muted-foreground'>
                Should total 100%
              </span>
            )}
          </div>
        </div>
        <Button type='button' onClick={handleAddSection} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Section
        </Button>
      </div>

      {/* Global Warning for Weight Exceeded */}
      {hasAnySectionWeightExceeded() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cannot save:</strong> One or more sections have criteria weights that exceed the section weight. 
            Please adjust the criteria weights or increase the section weight to continue.
          </AlertDescription>
        </Alert>
      )}

      {rubricSections.length === 0 ? (
        <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
          <Target className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>No grading sections added yet</p>
          <Button type='button' onClick={handleAddSection}>
            Add First Section
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {rubricSections.map((section, sectionIndex) => (
            <Card key={section.id} className='border-l-4 border-l-blue-500'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    {/* Reorder Handle */}
                    <div className='flex flex-col space-y-1'>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-4 w-4 p-0'
                        disabled={sectionIndex === 0}
                        onClick={() => handleReorderSection(sectionIndex, sectionIndex - 1)}
                        title='Move up'
                      >
                        <GripVertical className='h-3 w-3 rotate-90' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-4 w-4 p-0'
                        disabled={sectionIndex === rubricSections.length - 1}
                        onClick={() => handleReorderSection(sectionIndex, sectionIndex + 1)}
                        title='Move down'
                      >
                        <GripVertical className='h-3 w-3 -rotate-90' />
                      </Button>
                    </div>

                    {/* Section Icon */}
                    <div className='p-2 bg-blue-100 rounded'>
                      <Target className='h-4 w-4 text-blue-600' />
                    </div>

                    {/* Section Title and Weight */}
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <h4 className='font-medium'>
                          {section.title || `Section ${sectionIndex + 1}`}
                        </h4>
                        <Badge variant='outline'>
                          {section.weight_percentage || 0}%
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {section.criteria.length} criteria
                        {section.criteria.length > 0 && (
                          <span className={`ml-2 ${isSectionWeightExceeded(section) ? 'text-destructive font-medium' : ''}`}>
                            (Criteria total: {getSectionTotalWeight(section)}%)
                            {isSectionWeightExceeded(section) && (
                              <span className='ml-1 text-destructive'>⚠️ Exceeds section weight!</span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleSectionExpanded(section.id)}
                    >
                      {expandedSections.has(section.id) ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteSection(section.id)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedSections.has(section.id) && (
                <CardContent className='space-y-4'>
                  {/* Section Title and Weight */}
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='col-span-2 space-y-2'>
                      <Label htmlFor={`section-title-${section.id}`}>Section Title *</Label>
                      <Input
                        id={`section-title-${section.id}`}
                        value={section.title}
                        onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                        placeholder='e.g., Hypothesis Matrix'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`section-weight-${section.id}`}>Weight %</Label>
                      <Input
                        id={`section-weight-${section.id}`}
                        type='number'
                        min='0'
                        max='100'
                        value={section.weight_percentage || ''}
                        onChange={(e) => handleUpdateSection(section.id, { 
                          weight_percentage: parseFloat(e.target.value) || 0 
                        })}
                        placeholder='40'
                      />
                    </div>
                  </div>

                  {/* Criteria */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label className='font-medium'>Criteria</Label>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => handleAddCriteria(section.id)}
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Add Criteria
                      </Button>
                    </div>

                    {section.criteria.length === 0 ? (
                      <div className='border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground'>
                        No criteria added yet
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {section.criteria.map((criteria, criteriaIndex) => (
                          <Card key={criteria.id} className='border-l-2 border-l-green-400'>
                            <CardHeader className='pb-2'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                  {/* Reorder Handle */}
                                  <div className='flex flex-col space-y-1'>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      className='h-3 w-3 p-0'
                                      disabled={criteriaIndex === 0}
                                      onClick={() => handleReorderCriteria(section.id, criteriaIndex, criteriaIndex - 1)}
                                      title='Move up'
                                    >
                                      <GripVertical className='h-2 w-2 rotate-90' />
                                    </Button>
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      className='h-3 w-3 p-0'
                                      disabled={criteriaIndex === section.criteria.length - 1}
                                      onClick={() => handleReorderCriteria(section.id, criteriaIndex, criteriaIndex + 1)}
                                      title='Move down'
                                    >
                                      <GripVertical className='h-2 w-2 -rotate-90' />
                                    </Button>
                                  </div>

                                  <Award className='h-3 w-3 text-green-600' />
                                  <span className='text-sm font-medium'>
                                    {criteria.name || `Criteria ${criteriaIndex + 1}`}
                                  </span>
                                  <Badge variant='outline' className='text-xs'>
                                    {criteria.weight_percentage || 0}%
                                  </Badge>
                                </div>

                                <div className='flex items-center space-x-1'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => toggleCriteriaExpanded(criteria.id)}
                                    className='text-xs'
                                  >
                                    {expandedCriteria.has(criteria.id) ? 'Collapse' : 'Expand'}
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteCriteria(section.id, criteria.id)}
                                    className='text-destructive hover:text-destructive h-6 w-6 p-0'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            {expandedCriteria.has(criteria.id) && (
                              <CardContent className='pt-0 space-y-3'>
                                <div className='grid grid-cols-3 gap-3'>
                                  <div className='col-span-2 space-y-2'>
                                    <Label htmlFor={`criteria-name-${criteria.id}`} className='text-xs'>
                                      Criteria Name *
                                    </Label>
                                    <Input
                                      id={`criteria-name-${criteria.id}`}
                                      value={criteria.name}
                                      onChange={(e) => handleUpdateCriteria(section.id, criteria.id, { name: e.target.value })}
                                      placeholder='e.g., Falsifiability & Precision'
                                      className='text-sm'
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor={`criteria-weight-${criteria.id}`} className='text-xs'>
                                      Weight %
                                    </Label>
                                    <Input
                                      id={`criteria-weight-${criteria.id}`}
                                      type='number'
                                      min='0'
                                      max='100'
                                      value={criteria.weight_percentage || ''}
                                      onChange={(e) => handleUpdateCriteria(section.id, criteria.id, { 
                                        weight_percentage: parseFloat(e.target.value) || 0 
                                      })}
                                      placeholder='15'
                                      className='text-sm'
                                    />
                                  </div>
                                </div>

                                <div className='space-y-2'>
                                  <Label htmlFor={`criteria-description-${criteria.id}`} className='text-xs'>
                                    Description
                                  </Label>
                                  <Textarea
                                    id={`criteria-description-${criteria.id}`}
                                    value={criteria.description}
                                    onChange={(e) => handleUpdateCriteria(section.id, criteria.id, { description: e.target.value })}
                                    placeholder='clear metric, threshold, time window'
                                    rows={2}
                                    className='text-sm'
                                  />
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {rubricSections.length > 0 && (
        <div className='text-xs text-muted-foreground'>
          {rubricSections.length} section{rubricSections.length !== 1 ? 's' : ''} configured
        </div>
      )}
    </div>
  );
};
