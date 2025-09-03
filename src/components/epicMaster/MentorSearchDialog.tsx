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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, Building, MapPin, Check } from 'lucide-react';
import { MentorsService } from '@/services/mentors.service';
import type { Mentor } from '@/types/mentor';
import { toast } from 'sonner';

interface MentorSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mentor: Mentor) => void;
  title: string;
  description: string;
  excludeMentorId?: string; // To exclude already assigned mentor
}

export const MentorSearchDialog: React.FC<MentorSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  excludeMentorId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  // Load available mentors when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMentors();
    } else {
      // Reset state when dialog closes
      setSearchTerm('');
      setSelectedMentor(null);
    }
  }, [isOpen]);

  const loadMentors = async () => {
    setLoading(true);
    try {
      const result = await MentorsService.listMentors();
      if (result.success && result.data) {
        // Filter out inactive mentors and excluded mentor
        const availableMentors = result.data.filter(
          mentor => 
            mentor.status === 'active' && 
            mentor.id !== excludeMentorId
        );
        setMentors(availableMentors);
      } else {
        toast.error('Failed to load mentors');
        setMentors([]);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
      toast.error('Failed to load mentors');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      mentor.first_name.toLowerCase().includes(searchLower) ||
      mentor.last_name.toLowerCase().includes(searchLower) ||
      mentor.email.toLowerCase().includes(searchLower) ||
      mentor.specialization?.toLowerCase().includes(searchLower) ||
      mentor.current_company?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = () => {
    if (selectedMentor) {
      onSelect(selectedMentor);
      onClose();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search mentors by name, email, specialization, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mentors List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No mentors found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            ) : (
              filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMentor?.id === mentor.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMentor(mentor)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={mentor.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(mentor.first_name, mentor.last_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {mentor.first_name} {mentor.last_name}
                      </h4>
                      {selectedMentor?.id === mentor.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {mentor.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {mentor.specialization && (
                        <Badge variant="secondary" className="text-xs">
                          {mentor.specialization}
                        </Badge>
                      )}
                      {mentor.current_company && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{mentor.current_company}</span>
                        </div>
                      )}
                    </div>
                    {mentor.experience_years && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {mentor.experience_years} years experience
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelect} 
              disabled={!selectedMentor}
            >
              Select Mentor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
