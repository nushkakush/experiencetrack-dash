import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { CreateExperienceRequest, SkillLevel } from '@/types/experience';

interface WorkshopBuilderProps {
  formData: CreateExperienceRequest;
  onChange: (updates: Partial<CreateExperienceRequest>) => void;
}

interface Material {
  name: string;
  quantity: string;
  specifications?: string;
  supplier?: string;
  cost_estimate?: number;
}

export const WorkshopBuilder: React.FC<WorkshopBuilderProps> = ({
  formData,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'activity' | 'materials' | 'sop' | 'config'
  >('activity');
  const [newMaterial, setNewMaterial] = useState<Material>({
    name: '',
    quantity: '',
    specifications: '',
    supplier: '',
    cost_estimate: undefined,
  });

  const handleMaterialsChange = (materials: Material[]) => {
    onChange({ materials_required: materials });
  };

  const addMaterial = () => {
    if (newMaterial.name.trim()) {
      const materials = formData.materials_required || [];
      handleMaterialsChange([...materials, { ...newMaterial }]);
      setNewMaterial({
        name: '',
        quantity: '',
        specifications: '',
        supplier: '',
        cost_estimate: undefined,
      });
    }
  };

  const removeMaterial = (index: number) => {
    const materials = formData.materials_required || [];
    const updated = materials.filter((_, i) => i !== index);
    handleMaterialsChange(updated);
  };

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const materials = formData.materials_required || [];
    const updated = materials.map((material, i) =>
      i === index ? { ...material, [field]: value } : material
    );
    handleMaterialsChange(updated);
  };

  const tabs = [
    {
      id: 'activity',
      label: 'Activity Description',
      description: 'Workshop activity and objectives',
    },
    {
      id: 'materials',
      label: 'Materials & Procurement',
      description: 'Required materials and supplies',
    },
    {
      id: 'sop',
      label: 'Standard Procedures',
      description: 'Step-by-step workshop procedures',
    },
    {
      id: 'config',
      label: 'Workshop Configuration',
      description: 'Participants and skill level',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Tab Navigation */}
      <div className='flex space-x-1 bg-gray-100 p-1 rounded-lg'>
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setActiveTab(tab.id as any)}
            className='flex-1'
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        <CardHeader>
          <CardTitle>{tabs.find(t => t.id === activeTab)?.label}</CardTitle>
          <p className='text-sm text-gray-600'>
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </CardHeader>
        <CardContent>
          {activeTab === 'activity' && (
            <div className='space-y-6'>
              <div>
                <Label htmlFor='activity-description'>
                  Activity Description
                </Label>
                <Textarea
                  id='activity-description'
                  value={formData.activity_description || ''}
                  onChange={e =>
                    onChange({ activity_description: e.target.value })
                  }
                  placeholder='Describe the hands-on workshop activity...'
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor='activity-objectives'>Learning Objectives</Label>
                <Textarea
                  id='activity-objectives'
                  value={formData.learning_outcomes?.join('\n') || ''}
                  onChange={e =>
                    onChange({
                      learning_outcomes: e.target.value
                        .split('\n')
                        .filter(o => o.trim()),
                    })
                  }
                  placeholder='What skills will participants develop through this workshop?'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor='activity-outcomes'>Expected Outcomes</Label>
                <Textarea
                  id='activity-outcomes'
                  value={formData.activity_description || ''}
                  onChange={e =>
                    onChange({ activity_description: e.target.value })
                  }
                  placeholder='What will participants create or achieve by the end of the workshop?'
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className='space-y-6'>
              <div>
                <Label>Required Materials</Label>
                <div className='space-y-4'>
                  {/* Add New Material Form */}
                  <Card className='p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label htmlFor='material-name'>Material Name</Label>
                        <Input
                          id='material-name'
                          value={newMaterial.name}
                          onChange={e =>
                            setNewMaterial({
                              ...newMaterial,
                              name: e.target.value,
                            })
                          }
                          placeholder='e.g., Arduino Uno Board'
                        />
                      </div>
                      <div>
                        <Label htmlFor='material-quantity'>Quantity</Label>
                        <Input
                          id='material-quantity'
                          value={newMaterial.quantity}
                          onChange={e =>
                            setNewMaterial({
                              ...newMaterial,
                              quantity: e.target.value,
                            })
                          }
                          placeholder='e.g., 1 per participant'
                        />
                      </div>
                      <div>
                        <Label htmlFor='material-specs'>Specifications</Label>
                        <Input
                          id='material-specs'
                          value={newMaterial.specifications || ''}
                          onChange={e =>
                            setNewMaterial({
                              ...newMaterial,
                              specifications: e.target.value,
                            })
                          }
                          placeholder='e.g., Version 3.0, USB-C'
                        />
                      </div>
                      <div>
                        <Label htmlFor='material-supplier'>Supplier</Label>
                        <Input
                          id='material-supplier'
                          value={newMaterial.supplier || ''}
                          onChange={e =>
                            setNewMaterial({
                              ...newMaterial,
                              supplier: e.target.value,
                            })
                          }
                          placeholder='e.g., Amazon, Local Electronics Store'
                        />
                      </div>
                      <div>
                        <Label htmlFor='material-cost'>Cost Estimate (₹)</Label>
                        <Input
                          id='material-cost'
                          type='number'
                          value={newMaterial.cost_estimate || ''}
                          onChange={e =>
                            setNewMaterial({
                              ...newMaterial,
                              cost_estimate:
                                parseFloat(e.target.value) || undefined,
                            })
                          }
                          placeholder='e.g., 500'
                        />
                      </div>
                      <div className='flex items-end'>
                        <Button
                          onClick={addMaterial}
                          size='sm'
                          className='w-full'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Add Material
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Materials List */}
                  {formData.materials_required &&
                    formData.materials_required.length > 0 && (
                      <div className='space-y-2'>
                        {formData.materials_required.map((material, index) => (
                          <Card key={index} className='p-4'>
                            <div className='flex justify-between items-start'>
                              <div className='flex-1'>
                                <h4 className='font-medium'>{material.name}</h4>
                                <p className='text-sm text-gray-600'>
                                  Quantity: {material.quantity}
                                  {material.specifications &&
                                    ` • ${material.specifications}`}
                                  {material.supplier &&
                                    ` • Supplier: ${material.supplier}`}
                                  {material.cost_estimate &&
                                    ` • Cost: ₹${material.cost_estimate}`}
                                </p>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => removeMaterial(index)}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sop' && (
            <div className='space-y-6'>
              <div>
                <Label htmlFor='sop-document'>
                  Standard Operating Procedures
                </Label>
                <Textarea
                  id='sop-document'
                  value={formData.sop_document || ''}
                  onChange={e => onChange({ sop_document: e.target.value })}
                  placeholder='Provide detailed step-by-step procedures for conducting this workshop...'
                  rows={8}
                />
                <p className='text-sm text-gray-500 mt-2'>
                  Include setup instructions, safety guidelines, timing, and
                  troubleshooting tips.
                </p>
              </div>

              <div>
                <Label htmlFor='workshop-setup'>
                  Workshop Setup Requirements
                </Label>
                <Textarea
                  id='workshop-setup'
                  value={formData.activity_description || ''}
                  onChange={e =>
                    onChange({ activity_description: e.target.value })
                  }
                  placeholder='Describe the physical setup, space requirements, and equipment arrangement...'
                  rows={4}
                />
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='skill-level'>Skill Level</Label>
                  <Select
                    value={formData.skill_level || ''}
                    onValueChange={value =>
                      onChange({ skill_level: value as SkillLevel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select skill level' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='beginner'>Beginner</SelectItem>
                      <SelectItem value='intermediate'>Intermediate</SelectItem>
                      <SelectItem value='advanced'>Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='max-participants'>Max Participants</Label>
                  <Input
                    id='max-participants'
                    type='number'
                    value={formData.workshop_max_participants || ''}
                    onChange={e =>
                      onChange({
                        workshop_max_participants:
                          parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder='e.g., 20'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='prerequisites'>Prerequisites</Label>
                <Textarea
                  id='prerequisites'
                  value={formData.prerequisites?.join('\n') || ''}
                  onChange={e =>
                    onChange({
                      prerequisites: e.target.value
                        .split('\n')
                        .filter(p => p.trim()),
                    })
                  }
                  placeholder='What should participants know or have before attending this workshop?'
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor='workshop-duration'>
                  Workshop Duration (hours)
                </Label>
                <Input
                  id='workshop-duration'
                  type='number'
                  value={formData.activity_duration || ''}
                  onChange={e =>
                    onChange({
                      activity_duration: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder='e.g., 4'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
