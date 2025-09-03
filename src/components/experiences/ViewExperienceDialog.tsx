import React from 'react';
import { Calendar, User, FileText, Target, Award, BookOpen, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Experience } from '@/types/experience';
import { generateConditionDescription, generateConditionFields } from '@/types/conditions';

// Helper function to convert markdown-like format to HTML (same as WYSIWYG editor)
const markdownToHtml = (markdown: string): string => {
  return markdown
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items
    .replace(/(<li>.*<\/li>)/g, '<ul class="list-disc list-inside space-y-1 ml-4">$1</ul>')
    .replace(/(<ul[^>]*>.*?<\/ul>)\s*(<ul[^>]*>.*?<\/ul>)/gs, '$1$2')
    // Fix multiple ul tags
    .replace(/<\/ul>\s*<ul[^>]*>/g, '');
};

interface ViewExperienceDialogProps {
  experience: Experience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewExperienceDialog: React.FC<ViewExperienceDialogProps> = ({
  experience,
  open,
  onOpenChange,
}) => {
  if (!experience) return null;

  const availableFields = generateConditionFields(experience.grading_rubric || []);
  
  const passDescription = experience.pass_conditions 
    ? generateConditionDescription(experience.pass_conditions, availableFields)
    : '';
    
  const distinctionDescription = experience.distinction_conditions 
    ? generateConditionDescription(experience.distinction_conditions, availableFields)
    : '';

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CBL': return 'bg-blue-100 text-blue-800';
      case 'Mock Challenge': return 'bg-green-100 text-green-800';
      case 'Masterclass': return 'bg-purple-100 text-purple-800';
      case 'Workshop': return 'bg-orange-100 text-orange-800';
      case 'GAP': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <FileText className='h-5 w-5' />
            <span>{experience.title}</span>
          </DialogTitle>
          <DialogDescription>
            View experience details and configuration
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Target className='h-4 w-4' />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center space-x-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Type</label>
                  <div className='mt-1'>
                    <Badge className={getTypeColor(experience.type)}>
                      {experience.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Created</label>
                  <div className='mt-1 flex items-center space-x-1 text-sm'>
                    <Calendar className='h-3 w-3' />
                    <span>{new Date(experience.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {experience.learning_outcomes && experience.learning_outcomes.length > 0 && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>Learning Outcomes</label>
                  <ul className='mt-2 space-y-1'>
                    {experience.learning_outcomes.map((outcome, index) => (
                      <li key={index} className='flex items-start space-x-2 text-sm'>
                        <span className='text-primary font-medium mt-0.5'>•</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CBL Content */}
          {experience.type === 'CBL' && (
            <>
              {/* Challenge */}
              {experience.challenge && (
                <Card>
                  <CardHeader>
                    <CardTitle>Challenge Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className='prose prose-sm max-w-none'
                      dangerouslySetInnerHTML={{ 
                        __html: markdownToHtml(experience.challenge) 
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Deliverables */}
              {experience.deliverables && experience.deliverables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {experience.deliverables.map((deliverable, index) => (
                        <div key={deliverable.id || index} className='border rounded-lg p-3'>
                          <div className='flex items-center justify-between mb-2'>
                            <h4 className='font-medium'>{deliverable.title}</h4>
                            <div className='flex items-center space-x-2'>
                              <Badge variant='outline'>{deliverable.type}</Badge>
                              {deliverable.required && (
                                <Badge variant='destructive' className='text-xs'>Required</Badge>
                              )}
                            </div>
                          </div>
                          {deliverable.description && (
                            <p className='text-sm text-muted-foreground'>{deliverable.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grading Rubric */}
              {experience.grading_rubric && experience.grading_rubric.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Grading Rubric</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {experience.grading_rubric.map((section, sectionIndex) => (
                        <div key={section.id || sectionIndex} className='border rounded-lg p-4'>
                          <div className='flex items-center justify-between mb-3'>
                            <h4 className='font-medium'>{section.title}</h4>
                            <Badge variant='outline'>{section.weight_percentage}%</Badge>
                          </div>
                          {section.criteria && section.criteria.length > 0 && (
                            <div className='space-y-2'>
                              {section.criteria.map((criteria, criteriaIndex) => (
                                <div key={criteria.id || criteriaIndex} className='flex items-center justify-between text-sm'>
                                  <span>{criteria.name}</span>
                                  <span className='text-muted-foreground'>{criteria.weight_percentage}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pass & Distinction Conditions */}
              {(passDescription || distinctionDescription) && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <Award className='h-4 w-4' />
                      <span>Assessment Conditions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {passDescription && (
                      <div>
                        <h4 className='font-medium text-green-700 mb-2'>Pass Conditions</h4>
                        <div className='bg-green-50 p-3 rounded-lg'>
                          <code className='text-sm'>{passDescription}</code>
                        </div>
                      </div>
                    )}
                    {distinctionDescription && (
                      <div>
                        <h4 className='font-medium text-blue-700 mb-2'>Distinction Conditions</h4>
                        <div className='bg-blue-50 p-3 rounded-lg'>
                          <code className='text-sm'>{distinctionDescription}</code>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lecture Sessions */}
              {experience.lecture_sessions && experience.lecture_sessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <BookOpen className='h-4 w-4' />
                      <span>Lecture Sessions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {experience.lecture_sessions.map((module, index) => (
                        <div key={module.id || index} className='border rounded-lg p-4'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <div className='w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium'>
                              {module.order}
                            </div>
                            <h4 className='font-medium'>{module.title}</h4>
                          </div>
                          {module.description && (
                            <p className='text-sm text-muted-foreground mb-2'>{module.description}</p>
                          )}
                          
                          {/* Connected Deliverables */}
                          {module.connected_deliverables && module.connected_deliverables.length > 0 && (
                            <div className='mb-2'>
                              <div className='text-xs font-medium text-muted-foreground mb-1'>Connected Deliverables:</div>
                              <div className='flex flex-wrap gap-1'>
                                {module.connected_deliverables.map((deliverableId) => {
                                  const deliverable = experience.deliverables?.find(d => d.id === deliverableId);
                                  return deliverable ? (
                                    <Badge key={deliverableId} variant='secondary' className='text-xs'>
                                      {deliverable.title}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className='grid grid-cols-3 gap-4 text-xs text-muted-foreground'>
                            <span>{module.learning_outcomes?.length || 0} outcomes</span>
                            <span>{module.canva_deck_links?.length || 0} decks</span>
                            <span>{module.resources?.length || 0} resources</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sample Profiles */}
              {(experience.sample_brand_profile_url || experience.sample_mentor_profile_url || experience.sample_judge_profile_url) && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <ExternalLink className='h-4 w-4' />
                      <span>Sample Profiles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      {experience.sample_brand_profile_url && (
                        <div>
                          <label className='text-sm font-medium text-muted-foreground'>Brand Profile</label>
                          <div className='mt-1'>
                            <a 
                              href={experience.sample_brand_profile_url} 
                              target='_blank' 
                              rel='noopener noreferrer'
                              className='text-sm text-blue-600 hover:underline'
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                      {experience.sample_mentor_profile_url && (
                        <div>
                          <label className='text-sm font-medium text-muted-foreground'>Mentor Profile</label>
                          <div className='mt-1'>
                            <a 
                              href={experience.sample_mentor_profile_url} 
                              target='_blank' 
                              rel='noopener noreferrer'
                              className='text-sm text-blue-600 hover:underline'
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                      {experience.sample_judge_profile_url && (
                        <div>
                          <label className='text-sm font-medium text-muted-foreground'>Judge Profile</label>
                          <div className='mt-1'>
                            <a 
                              href={experience.sample_judge_profile_url} 
                              target='_blank' 
                              rel='noopener noreferrer'
                              className='text-sm text-blue-600 hover:underline'
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
