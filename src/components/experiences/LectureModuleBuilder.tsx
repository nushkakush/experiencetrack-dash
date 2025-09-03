import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, BookOpen, ExternalLink, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulletedInput } from '@/components/ui/bulleted-input';
import type { LectureModule, Resource, Deliverable } from '@/types/experience';

interface LectureModuleBuilderProps {
  modules: LectureModule[];
  onChange: (modules: LectureModule[]) => void;
  deliverables?: Deliverable[]; // Available deliverables to connect to
}

export const LectureModuleBuilder: React.FC<LectureModuleBuilderProps> = ({
  modules,
  onChange,
  deliverables = []
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);

  const createNewModule = (): LectureModule => ({
    id: crypto.randomUUID(),
    order: modules.length + 1,
    title: '',
    description: '',
    learning_outcomes: [],
    canva_deck_links: [],
    canva_notes_links: [],
    resources: [],
    connected_deliverables: []
  });

  const createNewResource = (): Resource => ({
    id: crypto.randomUUID(),
    type: 'url',
    title: ''
  });

  // Module operations
  const handleAddModule = () => {
    const newModule = createNewModule();
    onChange([...modules, newModule]);
    setExpandedModules(prev => new Set(prev).add(newModule.id));
  };

  const handleUpdateModule = (moduleId: string, updates: Partial<LectureModule>) => {
    onChange(modules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  };

  const handleDeliverableToggle = (moduleId: string, deliverableId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const currentDeliverables = module.connected_deliverables || [];
    const isConnected = currentDeliverables.includes(deliverableId);
    
    const updatedDeliverables = isConnected
      ? currentDeliverables.filter(id => id !== deliverableId)
      : [...currentDeliverables, deliverableId];

    handleUpdateModule(moduleId, { connected_deliverables: updatedDeliverables });
  };

  const handleDeleteModule = (moduleId: string) => {
    const filteredModules = modules.filter(module => module.id !== moduleId);
    // Reorder remaining modules
    const reorderedModules = filteredModules.map((module, index) => ({
      ...module,
      order: index + 1
    }));
    onChange(reorderedModules);
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      newSet.delete(moduleId);
      return newSet;
    });
  };

  const handleReorderModule = (fromIndex: number, toIndex: number) => {
    const newModules = [...modules];
    const [movedItem] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, movedItem);
    
    // Update order numbers
    const reorderedModules = newModules.map((module, index) => ({
      ...module,
      order: index + 1
    }));
    
    onChange(reorderedModules);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggedModuleId(moduleId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', moduleId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetModuleId: string) => {
    e.preventDefault();
    
    if (!draggedModuleId || draggedModuleId === targetModuleId) {
      setDraggedModuleId(null);
      return;
    }

    const draggedIndex = modules.findIndex(m => m.id === draggedModuleId);
    const targetIndex = modules.findIndex(m => m.id === targetModuleId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      handleReorderModule(draggedIndex, targetIndex);
    }

    setDraggedModuleId(null);
  };

  const handleDragEnd = () => {
    setDraggedModuleId(null);
  };

  // Resource operations
  const handleAddResource = (moduleId: string) => {
    const newResource = createNewResource();
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    handleUpdateModule(moduleId, {
      resources: [...module.resources, newResource]
    });
    setExpandedResources(prev => new Set(prev).add(newResource.id));
  };

  const handleUpdateResource = (moduleId: string, resourceId: string, updates: Partial<Resource>) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const updatedResources = module.resources.map(resource =>
      resource.id === resourceId ? { ...resource, ...updates } : resource
    );
    handleUpdateModule(moduleId, { resources: updatedResources });
  };

  const handleDeleteResource = (moduleId: string, resourceId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    const updatedResources = module.resources.filter(resource => resource.id !== resourceId);
    handleUpdateModule(moduleId, { resources: updatedResources });
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      newSet.delete(resourceId);
      return newSet;
    });
  };

  // Multi-input helpers
  const handleCanvaLinksChange = (moduleId: string, links: string[], type: 'deck' | 'notes') => {
    const field = type === 'deck' ? 'canva_deck_links' : 'canva_notes_links';
    handleUpdateModule(moduleId, { [field]: links });
  };

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleResourceExpanded = (resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <Label className='text-lg font-semibold'>Lecture Sessions</Label>
        <Button type='button' onClick={handleAddModule} size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
          <BookOpen className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-muted-foreground mb-4'>No lecture modules added yet</p>
          <Button type='button' onClick={handleAddModule}>
            Add First Module
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {modules.map((module, index) => (
            <Card 
              key={module.id} 
              className={`border-l-4 border-l-purple-500 cursor-move transition-opacity ${
                draggedModuleId === module.id ? 'opacity-50' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, module.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, module.id)}
              onDragEnd={handleDragEnd}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    {/* Drag Handle */}
                    <div className='flex flex-col space-y-1'>
                      <div 
                        className='p-1 cursor-move hover:bg-gray-100 rounded'
                        title='Drag to reorder'
                      >
                        <GripVertical className='h-4 w-4 text-gray-400' />
                      </div>
                    </div>

                    {/* Module Icon and Order */}
                    <div className='flex items-center space-x-2'>
                      <div className='p-2 bg-purple-100 rounded'>
                        <BookOpen className='h-4 w-4 text-purple-600' />
                      </div>
                      <div className='w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                        {module.order}
                      </div>
                    </div>

                    {/* Module Title */}
                    <div className='flex-1'>
                      <h4 className='font-medium'>
                        {module.title || `Module ${module.order}`}
                      </h4>
                      <p className='text-sm text-muted-foreground'>
                        {module.learning_outcomes.length} outcomes, {module.canva_deck_links.length} decks, {module.resources.length} resources
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleModuleExpanded(module.id)}
                    >
                      {expandedModules.has(module.id) ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteModule(module.id)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedModules.has(module.id) && (
                <CardContent className='space-y-4'>
                  {/* Title and Description */}
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor={`module-title-${module.id}`}>Module Title *</Label>
                      <Input
                        id={`module-title-${module.id}`}
                        value={module.title}
                        onChange={(e) => handleUpdateModule(module.id, { title: e.target.value })}
                        placeholder='e.g., Introduction to Design Thinking'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor={`module-description-${module.id}`}>Description</Label>
                      <Textarea
                        id={`module-description-${module.id}`}
                        value={module.description}
                        onChange={(e) => handleUpdateModule(module.id, { description: e.target.value })}
                        placeholder='Describe what this module covers'
                        rows={3}
                      />
                    </div>

                    <BulletedInput
                      value={module.learning_outcomes}
                      onChange={(outcomes) => handleUpdateModule(module.id, { learning_outcomes: outcomes })}
                      placeholder='What will students learn from this module?'
                      label='Learning Outcomes'
                      maxItems={6}
                    />

                    {/* Connected Deliverables */}
                    {deliverables.length > 0 && (
                      <div className='space-y-2'>
                        <Label>Connected Deliverables</Label>
                        <div className='text-sm text-muted-foreground mb-2'>
                          Select which deliverables this lecture supports
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {deliverables.map((deliverable) => {
                            const isConnected = (module.connected_deliverables || []).includes(deliverable.id);
                            return (
                              <div
                                key={deliverable.id}
                                className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                                  isConnected 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-muted hover:bg-muted/50'
                                }`}
                                onClick={() => handleDeliverableToggle(module.id, deliverable.id)}
                              >
                                <input
                                  type='checkbox'
                                  checked={isConnected}
                                  onChange={() => handleDeliverableToggle(module.id, deliverable.id)}
                                  className='rounded border-gray-300'
                                />
                                <div className='flex-1 min-w-0'>
                                  <div className='font-medium text-sm truncate'>
                                    {deliverable.title}
                                  </div>
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {deliverable.description}
                                  </div>
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  {deliverable.type.replace('_', ' ')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canva Links */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label>Canva Deck Links</Label>
                      <div className='space-y-2'>
                        {module.canva_deck_links.map((link, linkIndex) => (
                          <div key={linkIndex} className='flex items-center space-x-2'>
                            <Input
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...module.canva_deck_links];
                                newLinks[linkIndex] = e.target.value;
                                handleCanvaLinksChange(module.id, newLinks, 'deck');
                              }}
                              placeholder='https://canva.com/design/...'
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                const newLinks = module.canva_deck_links.filter((_, i) => i !== linkIndex);
                                handleCanvaLinksChange(module.id, newLinks, 'deck');
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            handleCanvaLinksChange(module.id, [...module.canva_deck_links, ''], 'deck');
                          }}
                        >
                          <Plus className='h-3 w-3 mr-1' />
                          Add Deck Link
                        </Button>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label>Canva Notes Links</Label>
                      <div className='space-y-2'>
                        {module.canva_notes_links.map((link, linkIndex) => (
                          <div key={linkIndex} className='flex items-center space-x-2'>
                            <Input
                              value={link}
                              onChange={(e) => {
                                const newLinks = [...module.canva_notes_links];
                                newLinks[linkIndex] = e.target.value;
                                handleCanvaLinksChange(module.id, newLinks, 'notes');
                              }}
                              placeholder='https://canva.com/design/...'
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                const newLinks = module.canva_notes_links.filter((_, i) => i !== linkIndex);
                                handleCanvaLinksChange(module.id, newLinks, 'notes');
                              }}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            handleCanvaLinksChange(module.id, [...module.canva_notes_links, ''], 'notes');
                          }}
                        >
                          <Plus className='h-3 w-3 mr-1' />
                          Add Notes Link
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label className='font-medium'>Resources</Label>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={() => handleAddResource(module.id)}
                      >
                        <Plus className='h-3 w-3 mr-1' />
                        Add Resource
                      </Button>
                    </div>

                    {module.resources.length === 0 ? (
                      <div className='border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground'>
                        No resources added yet
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {module.resources.map((resource) => (
                          <Card key={resource.id} className='border-l-2 border-l-orange-400'>
                            <CardHeader className='pb-2'>
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                  {resource.type === 'url' ? (
                                    <LinkIcon className='h-4 w-4 text-orange-600' />
                                  ) : (
                                    <Upload className='h-4 w-4 text-orange-600' />
                                  )}
                                  <span className='text-sm font-medium'>
                                    {resource.title || 'Untitled Resource'}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    ({resource.type === 'url' ? 'URL' : 'File'})
                                  </span>
                                </div>

                                <div className='flex items-center space-x-1'>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => toggleResourceExpanded(resource.id)}
                                    className='text-xs'
                                  >
                                    {expandedResources.has(resource.id) ? 'Collapse' : 'Expand'}
                                  </Button>
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteResource(module.id, resource.id)}
                                    className='text-destructive hover:text-destructive h-6 w-6 p-0'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            {expandedResources.has(resource.id) && (
                              <CardContent className='pt-0 space-y-3'>
                                <div className='grid grid-cols-2 gap-3'>
                                  <div className='space-y-2'>
                                    <Label htmlFor={`resource-title-${resource.id}`} className='text-xs'>
                                      Resource Title *
                                    </Label>
                                    <Input
                                      id={`resource-title-${resource.id}`}
                                      value={resource.title}
                                      onChange={(e) => handleUpdateResource(module.id, resource.id, { title: e.target.value })}
                                      placeholder='e.g., Design Thinking Guide'
                                      className='text-sm'
                                    />
                                  </div>
                                  <div className='space-y-2'>
                                    <Label htmlFor={`resource-type-${resource.id}`} className='text-xs'>
                                      Type
                                    </Label>
                                    <Select
                                      value={resource.type}
                                      onValueChange={(value: 'url' | 'file_upload') => 
                                        handleUpdateResource(module.id, resource.id, { type: value })
                                      }
                                    >
                                      <SelectTrigger className='text-sm'>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value='url'>URL Link</SelectItem>
                                        <SelectItem value='file_upload'>File Upload</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {resource.type === 'url' && (
                                  <div className='space-y-2'>
                                    <Label htmlFor={`resource-url-${resource.id}`} className='text-xs'>
                                      URL
                                    </Label>
                                    <Input
                                      id={`resource-url-${resource.id}`}
                                      value={resource.url || ''}
                                      onChange={(e) => handleUpdateResource(module.id, resource.id, { url: e.target.value })}
                                      placeholder='https://example.com/resource'
                                      type='url'
                                      className='text-sm'
                                    />
                                  </div>
                                )}
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

      {modules.length > 0 && (
        <div className='text-xs text-muted-foreground'>
          {modules.length} module{modules.length !== 1 ? 's' : ''} configured
        </div>
      )}
    </div>
  );
};
