import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MentorPickerDialog } from './MentorPickerDialog';
import type { SampleProfile } from '@/types/experience';

interface SampleProfilesBuilderProps {
  profiles: SampleProfile[];
  onChange: (profiles: SampleProfile[]) => void;
  profileType: 'brand' | 'mentor' | 'judge';
}

export const SampleProfilesBuilder: React.FC<SampleProfilesBuilderProps> = ({
  profiles,
  onChange,
  profileType
}) => {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [mentorPickerOpen, setMentorPickerOpen] = useState(false);

  const createNewProfile = (): SampleProfile => ({
    id: crypto.randomUUID(),
    name: '',
    url: ''
  });

  const handleAddProfile = () => {
    const newProfile = createNewProfile();
    onChange([...profiles, newProfile]);
    setExpandedProfiles(prev => new Set(prev).add(newProfile.id));
  };

  const handleUpdateProfile = (profileId: string, updates: Partial<SampleProfile>) => {
    onChange(profiles.map(profile => 
      profile.id === profileId ? { ...profile, ...updates } : profile
    ));
  };

  const handleDeleteProfile = (profileId: string) => {
    onChange(profiles.filter(profile => profile.id !== profileId));
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(profileId);
      return newSet;
    });
  };

  const toggleProfileExpanded = (profileId: string) => {
    setExpandedProfiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  const handleSelectMentor = (profile: SampleProfile) => {
    onChange([...profiles, profile]);
    setMentorPickerOpen(false);
  };

  const canPickFromMentors = profileType === 'mentor' || profileType === 'judge';

  const getProfileTypeConfig = (type: string) => {
    switch (type) {
      case 'brand':
        return {
          label: 'Brand',
          color: 'bg-blue-100 text-blue-600',
          icon: '🏢',
          placeholder: 'e.g., Nike, Apple, Tesla'
        };
      case 'mentor':
        return {
          label: 'Mentor',
          color: 'bg-green-100 text-green-600',
          icon: '👨‍🏫',
          placeholder: 'e.g., John Smith, Sarah Johnson'
        };
      case 'judge':
        return {
          label: 'Judge',
          color: 'bg-purple-100 text-purple-600',
          icon: '⚖️',
          placeholder: 'e.g., Industry Expert, CEO'
        };
      default:
        return {
          label: 'Profile',
          color: 'bg-gray-100 text-gray-600',
          icon: '👤',
          placeholder: 'Profile name'
        };
    }
  };

  const config = getProfileTypeConfig(profileType);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <Label className='text-lg font-semibold'>Sample {config.label} Profiles</Label>
          <div className='flex items-center space-x-2 mt-1'>
            <Badge variant='outline'>
              {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          {canPickFromMentors && (
            <Button 
              type='button' 
              variant='outline' 
              onClick={() => setMentorPickerOpen(true)} 
              size='sm'
            >
              <Users className='h-4 w-4 mr-2' />
              Pick from Mentors
            </Button>
          )}
          <Button type='button' onClick={handleAddProfile} size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            Add {config.label} Profile
          </Button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className='border-2 border-dashed border-muted rounded-lg p-8 text-center'>
          <div className='text-4xl mb-2'>{config.icon}</div>
          <p className='text-muted-foreground mb-4'>No {config.label.toLowerCase()} profiles added yet</p>
          <Button type='button' onClick={handleAddProfile}>
            Add First {config.label} Profile
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {profiles.map((profile, index) => (
            <Card key={profile.id} className='border-l-4 border-l-blue-500'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    {/* Profile Icon and Number */}
                    <div className='flex items-center space-x-2'>
                      <div className={`p-2 rounded ${config.color}`}>
                        <span className='text-lg'>{config.icon}</span>
                      </div>
                      <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
                        {index + 1}
                      </div>
                    </div>

                    {/* Profile Name */}
                    <div className='flex-1'>
                      <h4 className='font-medium'>
                        {profile.name || `${config.label} Profile ${index + 1}`}
                      </h4>
                      <p className='text-sm text-muted-foreground'>
                        {profile.url ? (
                          <a 
                            href={profile.url} 
                            target='_blank' 
                            rel='noopener noreferrer'
                            className='text-blue-600 hover:underline flex items-center space-x-1'
                          >
                            <span>View Profile</span>
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        ) : (
                          'No URL provided'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => toggleProfileExpanded(profile.id)}
                    >
                      {expandedProfiles.has(profile.id) ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDeleteProfile(profile.id)}
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedProfiles.has(profile.id) && (
                <CardContent className='space-y-4'>
                  {/* Profile Name and URL */}
                  <div className='grid grid-cols-1 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor={`profile-name-${profile.id}`}>
                        {config.label} Name *
                      </Label>
                      <Input
                        id={`profile-name-${profile.id}`}
                        value={profile.name}
                        onChange={(e) => handleUpdateProfile(profile.id, { name: e.target.value })}
                        placeholder={config.placeholder}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`profile-url-${profile.id}`}>
                        Profile URL *
                      </Label>
                      <Input
                        id={`profile-url-${profile.id}`}
                        value={profile.url}
                        onChange={(e) => handleUpdateProfile(profile.id, { url: e.target.value })}
                        placeholder='https://example.com/profile'
                        type='url'
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {profiles.length > 0 && (
        <div className='text-xs text-muted-foreground'>
          {profiles.length} {config.label.toLowerCase()} profile{profiles.length !== 1 ? 's' : ''} configured
        </div>
      )}

      {/* Mentor Picker Dialog */}
      {canPickFromMentors && (
        <MentorPickerDialog
          open={mentorPickerOpen}
          onOpenChange={setMentorPickerOpen}
          onSelectMentor={handleSelectMentor}
          profileType={profileType}
          existingProfiles={profiles}
        />
      )}
    </div>
  );
};
