import React, { useState, useEffect } from 'react';
import { Search, User, ExternalLink, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MentorsService } from '@/services/mentors.service';
import type { Mentor } from '@/types/mentor';
import type { SampleProfile } from '@/types/experience';

interface MentorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMentor: (profile: SampleProfile) => void;
  profileType: 'mentor' | 'judge';
  existingProfiles: SampleProfile[];
}

export const MentorPickerDialog: React.FC<MentorPickerDialogProps> = ({
  open,
  onOpenChange,
  onSelectMentor,
  profileType,
  existingProfiles
}) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  // Load mentors when dialog opens
  useEffect(() => {
    if (open) {
      loadMentors();
    }
  }, [open]);

  // Filter mentors based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMentors(mentors);
    } else {
      const filtered = mentors.filter(mentor => {
        const fullName = `${mentor.first_name} ${mentor.last_name}`.toLowerCase();
        const company = mentor.current_company?.toLowerCase() || '';
        const specialization = mentor.specialization?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               company.includes(search) || 
               specialization.includes(search);
      });
      setFilteredMentors(filtered);
    }
  }, [mentors, searchTerm]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const response = await MentorsService.listMentors();
      if (response.success && response.data) {
        // Filter out mentors that are already selected
        const existingMentorIds = existingProfiles.map(p => p.url).filter(url => 
          mentors.some(m => m.linkedin_url === url || m.id === url)
        );
        
        const availableMentors = response.data.filter(mentor => 
          !existingMentorIds.includes(mentor.linkedin_url || mentor.id)
        );
        
        setMentors(availableMentors);
        setFilteredMentors(availableMentors);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
  };

  const handleConfirmSelection = () => {
    if (selectedMentor) {
      const profile: SampleProfile = {
        id: crypto.randomUUID(),
        name: `${selectedMentor.first_name} ${selectedMentor.last_name}`,
        url: selectedMentor.linkedin_url || `https://mentor-profile/${selectedMentor.id}`
      };
      
      onSelectMentor(profile);
      onOpenChange(false);
      setSelectedMentor(null);
      setSearchTerm('');
    }
  };

  const getProfileTypeConfig = (type: string) => {
    switch (type) {
      case 'mentor':
        return {
          label: 'Mentor',
          icon: '👨‍🏫',
          color: 'bg-green-100 text-green-600'
        };
      case 'judge':
        return {
          label: 'Judge',
          icon: '⚖️',
          color: 'bg-purple-100 text-purple-600'
        };
      default:
        return {
          label: 'Profile',
          icon: '👤',
          color: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const config = getProfileTypeConfig(profileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <span className={`p-2 rounded ${config.color}`}>
              <span className='text-lg'>{config.icon}</span>
            </span>
            <span>Select {config.label} from Existing Mentors</span>
          </DialogTitle>
          <DialogDescription>
            Choose a mentor from your existing mentor database to use as a sample {config.label.toLowerCase()} profile.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search */}
          <div className='space-y-2'>
            <Label htmlFor='mentor-search'>Search Mentors</Label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                id='mentor-search'
                placeholder='Search by name, company, or specialization...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Mentors List */}
          <div className='space-y-2'>
            <Label>Available Mentors</Label>
            <ScrollArea className='h-64 border rounded-md'>
              {loading ? (
                <div className='p-4 text-center text-muted-foreground'>
                  Loading mentors...
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className='p-4 text-center text-muted-foreground'>
                  {searchTerm ? 'No mentors found matching your search.' : 'No mentors available.'}
                </div>
              ) : (
                <div className='p-2 space-y-2'>
                  {filteredMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMentor?.id === mentor.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleSelectMentor(mentor)}
                    >
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={mentor.avatar_url || undefined} />
                          <AvatarFallback>
                            {mentor.first_name[0]}{mentor.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2'>
                            <h4 className='font-medium truncate'>
                              {mentor.first_name} {mentor.last_name}
                            </h4>
                            {selectedMentor?.id === mentor.id && (
                              <Check className='h-4 w-4 text-primary' />
                            )}
                          </div>
                          
                          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                            {mentor.current_company && (
                              <span>{mentor.current_company}</span>
                            )}
                            {mentor.specialization && (
                              <>
                                <span>•</span>
                                <span>{mentor.specialization}</span>
                              </>
                            )}
                          </div>
                          
                          {mentor.linkedin_url && (
                            <div className='flex items-center space-x-1 text-xs text-blue-600 mt-1'>
                              <ExternalLink className='h-3 w-3' />
                              <span>LinkedIn Profile</span>
                            </div>
                          )}
                        </div>
                        
                        <div className='flex flex-col items-end space-y-1'>
                          <Badge variant={mentor.status === 'active' ? 'default' : 'secondary'}>
                            {mentor.status}
                          </Badge>
                          {mentor.experience_years && (
                            <span className='text-xs text-muted-foreground'>
                              {mentor.experience_years} years exp.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedMentor}
          >
            Select {config.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
