import React, { useState } from 'react';
import { Plus, Trash2, Upload, Link, FileText, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Deliverable, DeliverableType } from '@/types/experience';

interface DeliverableBuilderProps {
  deliverables: Deliverable[];
  onChange: (deliverables: Deliverable[]) => void;
}

export const DeliverableBuilder: React.FC<DeliverableBuilderProps> = ({
  deliverables,
  onChange
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const createNewDeliverable = (): Deliverable => ({
    id: crypto.randomUUID(),
    type: 'file_upload',
    title: '',
    description: '',
    required: true
  });

  const handleAddDeliverable = () => {
    const newDeliverable = createNewDeliverable();
    onChange([...deliverables, newDeliverable]);
    setExpandedItems(prev => new Set(prev).add(newDeliverable.id));
  };

  const handleUpdateDeliverable = (id: string, updates: Partial<Deliverable>) => {
    onChange(deliverables.map(deliverable => 
      deliverable.id === id ? { ...deliverable, ...updates } : deliverable
    ));
  };

  const handleDeleteDeliverable = (id: string) => {
    onChange(deliverables.filter(deliverable => deliverable.id !== id));
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newDeliverables = [...deliverables];
    const [movedItem] = newDeliverables.splice(fromIndex, 1);
    newDeliverables.splice(toIndex, 0, movedItem);
    onChange(newDeliverables);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: DeliverableType) => {
    switch (type) {
      case 'file_upload':
        return <Upload className='h-4 w-4' />;
      case 'url':
        return <Link className='h-4 w-4' />;
      case 'text_submission':
        return <FileText className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const getTypeLabel = (type: DeliverableType) => {
    switch (type) {
      case 'file_upload':
        return 'File Upload';
      case 'url':
        return 'URL Submission';
      case 'text_submission':
        return 'Text Submission';
      default:
        return type;
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-lg font-semibold'>Deliverables</Label>
        <Button type='button' onClick={handleAddDeliverable} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Deliverable
        </Button>
      </div>

      {deliverables.length === 0 ? (
        <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
          <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>No deliverables added yet</p>
          <Button type='button' onClick={handleAddDeliverable}>
            Add First Deliverable
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {deliverables.map((deliverable, index) => (
            <Card key={deliverable.id} className='relative'>
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
                        disabled={index === 0}
                        onClick={() => handleReorder(index, index - 1)}
                        title='Move up'
                      >
                        <GripVertical className='h-3 w-3 rotate-90' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-4 w-4 p-0'
                        disabled={index === deliverables.length - 1}
                        onClick={() => handleReorder(index, index + 1)}
                        title='Move down'
                      >
                        <GripVertical className='h-3 w-3 -rotate-90' />
                      </Button>
                    </div>

                    {/* Type Icon */}
                    <div className='p-2 bg-muted rounded'>
                      {getTypeIcon(deliverable.type)}
                    </div>

                    {/* Title and Type */}
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <h4 className='font-medium'>
                          {deliverable.title || `Deliverable ${index + 1}`}
                        </h4>
                        {deliverable.required && (
                          <span className='text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full'>
                            Required
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {getTypeLabel(deliverable.type)}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleExpanded(deliverable.id)}
                    >
                      {expandedItems.has(deliverable.id) ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteDeliverable(deliverable.id)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedItems.has(deliverable.id) && (
                <CardContent className='space-y-4'>
                  {/* Title */}
                  <div className='space-y-2'>
                    <Label htmlFor={`title-${deliverable.id}`}>Title *</Label>
                    <Input
                      id={`title-${deliverable.id}`}
                      value={deliverable.title}
                      onChange={(e) => handleUpdateDeliverable(deliverable.id, { title: e.target.value })}
                      placeholder='Enter deliverable title'
                    />
                  </div>

                  {/* Type */}
                  <div className='space-y-2'>
                    <Label htmlFor={`type-${deliverable.id}`}>Type</Label>
                    <Select
                      value={deliverable.type}
                      onValueChange={(value: DeliverableType) => 
                        handleUpdateDeliverable(deliverable.id, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='file_upload'>
                          <div className='flex items-center space-x-2'>
                            <Upload className='h-4 w-4' />
                            <span>File Upload</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='url'>
                          <div className='flex items-center space-x-2'>
                            <Link className='h-4 w-4' />
                            <span>URL Submission</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='text_submission'>
                          <div className='flex items-center space-x-2'>
                            <FileText className='h-4 w-4' />
                            <span>Text Submission</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className='space-y-2'>
                    <Label htmlFor={`description-${deliverable.id}`}>Description</Label>
                    <Textarea
                      id={`description-${deliverable.id}`}
                      value={deliverable.description}
                      onChange={(e) => handleUpdateDeliverable(deliverable.id, { description: e.target.value })}
                      placeholder='Describe what students need to submit'
                      rows={3}
                    />
                  </div>

                  {/* URL field for URL type */}
                  {deliverable.type === 'url' && (
                    <div className='space-y-2'>
                      <Label htmlFor={`url-${deliverable.id}`}>Sample/Template URL</Label>
                      <Input
                        id={`url-${deliverable.id}`}
                        value={deliverable.url || ''}
                        onChange={(e) => handleUpdateDeliverable(deliverable.id, { url: e.target.value })}
                        placeholder='https://example.com/template'
                        type='url'
                      />
                    </div>
                  )}

                  {/* Required checkbox */}
                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id={`required-${deliverable.id}`}
                      checked={deliverable.required}
                      onCheckedChange={(checked) => 
                        handleUpdateDeliverable(deliverable.id, { required: checked as boolean })
                      }
                    />
                    <Label htmlFor={`required-${deliverable.id}`} className='text-sm'>
                      This deliverable is required
                    </Label>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {deliverables.length > 0 && (
        <div className='text-xs text-muted-foreground'>
          {deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''} configured
        </div>
      )}
    </div>
  );
};
