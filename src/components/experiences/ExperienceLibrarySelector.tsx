import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  BookOpen,
  Target,
  Users,
  Wrench,
  Sparkles,
  Calendar,
  CheckCircle,
  User,
  AlertTriangle,
} from 'lucide-react';
import { ExperiencesService } from '@/services/experiences.service';
import { sessionPlanningService } from '@/services/sessionPlanningService';
import { ExperienceToSessionService } from '@/services/experienceToSession/ExperienceToSessionService';
import { EXPERIENCE_TYPES } from '@/types/experience';
import type { Experience, ExperienceType } from '@/types/experience';
import { toast } from 'sonner';

interface ExperienceLibrarySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExperienceSelect: (
    experience: Experience,
    date: Date,
    sessionNumber: number
  ) => void;
  selectedDate: Date;
  selectedSessionNumber: number;
  epicId: string;
  cohortId: string;
}

const experienceTypeIcons: Record<
  ExperienceType,
  React.ComponentType<{ className?: string }>
> = {
  CBL: Target,
  'Mock Challenge': Target,
  Masterclass: BookOpen,
  Workshop: Wrench,
  GAP: Sparkles,
};

const experienceTypeColors: Record<ExperienceType, string> = {
  CBL: 'bg-blue-100 text-blue-800 border-blue-200',
  'Mock Challenge': 'bg-purple-100 text-purple-800 border-purple-200',
  Masterclass: 'bg-green-100 text-green-800 border-green-200',
  Workshop: 'bg-orange-100 text-orange-800 border-orange-200',
  GAP: 'bg-pink-100 text-pink-800 border-pink-200',
};

export const ExperienceLibrarySelector: React.FC<
  ExperienceLibrarySelectorProps
> = ({
  open,
  onOpenChange,
  onExperienceSelect,
  selectedDate,
  selectedSessionNumber,
  epicId,
  cohortId,
}) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>(
    []
  );
  const [usedExperienceIds, setUsedExperienceIds] = useState<Set<string>>(
    new Set()
  );
  const [insufficientSpaceIds, setInsufficientSpaceIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ExperienceType | 'all'>(
    'all'
  );

  // Fetch experiences when dialog opens
  useEffect(() => {
    if (open && epicId && cohortId) {
      fetchExperiences();
      fetchUsedExperiences();
    }
  }, [open, epicId, cohortId]);

  // Check space availability for all experiences when they're loaded
  useEffect(() => {
    if (experiences.length > 0 && selectedDate && selectedSessionNumber) {
      checkAllExperiencesSpace();
    }
  }, [experiences, selectedDate, selectedSessionNumber]);

  // Filter experiences based on search and type
  useEffect(() => {
    let filtered = experiences;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        exp =>
          exp.title.toLowerCase().includes(query) ||
          exp.learning_outcomes.some(outcome =>
            outcome.toLowerCase().includes(query)
          )
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(exp => exp.type === selectedType);
    }

    setFilteredExperiences(filtered);
  }, [experiences, searchQuery, selectedType]);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const result = await ExperiencesService.getExperiences({
        epicId: epicId,
        limit: 100,
      });

      setExperiences(result.data);
    } catch (error) {
      console.error('Error fetching experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsedExperiences = async () => {
    try {
      // Get all planned sessions for this cohort and epic
      const { data: sessions, error } =
        await sessionPlanningService.getPlannedSessions(cohortId, epicId);

      if (error) {
        console.error('Error fetching used experiences:', error);
        return;
      }

      // Extract unique experience IDs that have been used
      const usedIds = new Set<string>();
      sessions?.forEach(session => {
        if (session.experience_id) {
          usedIds.add(session.experience_id);
        }
      });

      console.log('🔍 Used experience IDs:', Array.from(usedIds));
      setUsedExperienceIds(usedIds);
    } catch (error) {
      console.error('Error fetching used experiences:', error);
    }
  };

  const checkAllExperiencesSpace = async () => {
    const insufficientSpaceIds = new Set<string>();

    for (const experience of experiences) {
      const spotsCheck = await checkAvailableSpots(
        experience,
        selectedDate,
        selectedSessionNumber
      );
      if (!spotsCheck.hasEnoughSpace) {
        insufficientSpaceIds.add(experience.id);
      }
    }

    setInsufficientSpaceIds(insufficientSpaceIds);
  };

  const handleExperienceSelect = async (experience: Experience) => {
    // Prevent selection if already used
    if (usedExperienceIds.has(experience.id)) {
      toast.error(
        `Experience "${experience.title}" has already been used in this cohort`
      );
      return;
    }

    // Check if there are enough spots available
    const spotsCheck = await checkAvailableSpots(
      experience,
      selectedDate,
      selectedSessionNumber
    );

    if (!spotsCheck.hasEnoughSpace) {
      const requiredSpots = spotsCheck.requiredSpots;
      const availableSpots = spotsCheck.availableSpots;

      if (spotsCheck.error) {
        toast.error(`Failed to check available spots: ${spotsCheck.error}`);
        return;
      }

      toast.error(
        `Not enough space for "${experience.title}". Requires ${requiredSpots} ${requiredSpots === 1 ? 'spot' : 'spots'} but only ${availableSpots} ${availableSpots === 1 ? 'spot is' : 'spots are'} available.`
      );
      return;
    }

    onExperienceSelect(experience, selectedDate, selectedSessionNumber);
    onOpenChange(false);
  };

  const getExperienceTypeInfo = (type: ExperienceType) => {
    return (
      EXPERIENCE_TYPES.find(t => t.value === type) || {
        value: type,
        label: type,
        description: '',
      }
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDynamicSpots = (experience: Experience) => {
    // If max_participants is explicitly set, use that
    if (experience.max_participants) {
      return experience.max_participants;
    }

    // Otherwise, calculate based on session count
    const sessionPreview =
      ExperienceToSessionService.getSessionPreview(experience);
    return sessionPreview.sessionCount;
  };

  const checkAvailableSpots = async (
    experience: Experience,
    startDate: Date,
    startSessionNumber: number
  ) => {
    const sessionPreview =
      ExperienceToSessionService.getSessionPreview(experience);

    // For single-session experiences, just check the current slot
    if (sessionPreview.sessionCount === 1) {
      const sessionDate = startDate.toISOString().split('T')[0];
      const checkResult = await sessionPlanningService.isSessionAlreadyPlanned(
        cohortId,
        epicId,
        sessionDate,
        startSessionNumber
      );

      return {
        hasEnoughSpace: !checkResult.isPlanned,
        availableSpots: checkResult.isPlanned ? 0 : 1,
        requiredSpots: 1,
        error: checkResult.error,
      };
    }

    // For multi-session experiences (like CBL), simulate the exact session creation logic
    if (experience.type === 'CBL') {
      return await checkCBLSessionAvailability(
        experience,
        startDate,
        startSessionNumber
      );
    }

    // For other multi-session experiences, use the simple consecutive check
    const requiredSpots = sessionPreview.sessionCount;
    const currentDate = new Date(startDate);
    let currentSlot = startSessionNumber;
    let availableConsecutiveSpots = 0;
    let checkedSlots = 0;

    while (checkedSlots < requiredSpots) {
      const sessionDate = currentDate.toISOString().split('T')[0];
      const checkResult = await sessionPlanningService.isSessionAlreadyPlanned(
        cohortId,
        epicId,
        sessionDate,
        currentSlot
      );

      if (!checkResult.success) {
        return {
          hasEnoughSpace: false,
          availableSpots: availableConsecutiveSpots,
          requiredSpots,
          error: checkResult.error,
        };
      }

      if (checkResult.isPlanned) {
        break;
      }

      availableConsecutiveSpots++;
      checkedSlots++;

      // Move to next slot (assuming max 2 sessions per day)
      if (currentSlot < 2) {
        currentSlot++;
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        currentSlot = 1;
      }
    }

    return {
      hasEnoughSpace: availableConsecutiveSpots >= requiredSpots,
      availableSpots: availableConsecutiveSpots,
      requiredSpots,
      error: null,
    };
  };

  const checkCBLSessionAvailability = async (
    experience: Experience,
    startDate: Date,
    startSessionNumber: number
  ) => {
    // Simulate the exact CBL session creation logic
    const lectures = Array.isArray(experience.lecture_sessions)
      ? [...experience.lecture_sessions].sort((a, b) => a.order - b.order)
      : [];

    const requiredSpots = getDynamicSpots(experience);
    const currentDate = new Date(startDate);
    let currentSlot = startSessionNumber;
    const sessionsPerDay = 2; // Assuming max 2 sessions per day

    // Pre-validate ALL required slots before proceeding
    for (let i = 0; i < requiredSpots; i++) {
      const sessionDate = currentDate.toISOString().split('T')[0];

      const checkResult = await sessionPlanningService.isSessionAlreadyPlanned(
        cohortId,
        epicId,
        sessionDate,
        currentSlot
      );

      if (!checkResult.success) {
        return {
          hasEnoughSpace: false,
          availableSpots: i,
          requiredSpots,
          error: checkResult.error,
        };
      }

      if (checkResult.isPlanned) {
        return {
          hasEnoughSpace: false,
          availableSpots: i,
          requiredSpots,
          error: `Slot ${currentSlot} on ${sessionDate} is already occupied. CBL requires ${requiredSpots} consecutive slots.`,
        };
      }

      // Advance to next slot, skipping Sundays during automatic allocation
      if (currentSlot < sessionsPerDay) {
        currentSlot++;
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        currentSlot = 1;

        // Skip Sundays during automatic allocation
        while (currentDate.getDay() === 0) {
          // 0 = Sunday
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return {
      hasEnoughSpace: true,
      availableSpots: requiredSpots,
      requiredSpots,
      error: null,
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Add Experience to Timetable
          </DialogTitle>
          <DialogDescription>
            Select an experience to add to {formatDate(selectedDate)} - Session{' '}
            {selectedSessionNumber}
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-6 flex-1 min-h-0'>
          {/* Search and Filter Controls */}
          <div className='space-y-4'>
            {/* Search Bar */}
            <div className='relative'>
              <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground' />
              <Input
                placeholder='Search experiences by title or learning outcomes...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-12 h-12 text-base'
              />
            </div>

            {/* Filter Buttons */}
            <div className='space-y-2'>
              <div className='text-sm font-medium text-muted-foreground'>
                Filter by Type:
              </div>
              <div className='flex gap-2 flex-wrap'>
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size='default'
                  onClick={() => setSelectedType('all')}
                  className='h-10 px-4'
                >
                  All Types
                </Button>
                {EXPERIENCE_TYPES.map(type => {
                  const Icon = experienceTypeIcons[type.value];
                  return (
                    <Button
                      key={type.value}
                      variant={
                        selectedType === type.value ? 'default' : 'outline'
                      }
                      size='default'
                      onClick={() => setSelectedType(type.value)}
                      className='flex items-center gap-2 h-10 px-4'
                    >
                      <Icon className='h-4 w-4' />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Experiences Grid */}
          <div className='flex-1 overflow-auto'>
            {loading ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className='h-4 w-3/4' />
                      <Skeleton className='h-3 w-1/2' />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className='h-16 w-full' />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredExperiences.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <BookOpen className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  No experiences found
                </h3>
                <p className='text-muted-foreground mb-4'>
                  {searchQuery || selectedType !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No experiences are available for this epic yet'}
                </p>
                {!searchQuery && selectedType === 'all' && (
                  <Button onClick={() => onOpenChange(false)} variant='outline'>
                    Close
                  </Button>
                )}
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {filteredExperiences.map(experience => {
                  const typeInfo = getExperienceTypeInfo(experience.type);
                  const Icon = experienceTypeIcons[experience.type];
                  const colorClass = experienceTypeColors[experience.type];
                  const isUsed = usedExperienceIds.has(experience.id);
                  const hasInsufficientSpace = insufficientSpaceIds.has(
                    experience.id
                  );

                  return (
                    <Card
                      key={experience.id}
                      className={`transition-all ${
                        isUsed
                          ? 'opacity-60 cursor-not-allowed bg-muted/30'
                          : hasInsufficientSpace
                            ? 'opacity-75 cursor-not-allowed bg-orange-50 border-orange-200'
                            : 'cursor-pointer hover:shadow-md'
                      }`}
                      onClick={() => handleExperienceSelect(experience)}
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1 min-w-0'>
                            <CardTitle className='text-base line-clamp-2 mb-2'>
                              {experience.title}
                            </CardTitle>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <Badge className={colorClass}>
                                <Icon className='h-3 w-3 mr-1' />
                                {typeInfo.label}
                              </Badge>
                              {(() => {
                                const spots = getDynamicSpots(experience);
                                return (
                                  <Badge
                                    variant='outline'
                                    className='bg-blue-50 text-blue-700 border-blue-200'
                                  >
                                    <User className='h-3 w-3 mr-1' />
                                    {spots} {spots === 1 ? 'spot' : 'spots'}
                                  </Badge>
                                );
                              })()}
                              {isUsed && (
                                <Badge
                                  variant='secondary'
                                  className='bg-green-100 text-green-800 border-green-200'
                                >
                                  <CheckCircle className='h-3 w-3 mr-1' />
                                  Already Added
                                </Badge>
                              )}
                              {hasInsufficientSpace && !isUsed && (
                                <Badge
                                  variant='secondary'
                                  className='bg-orange-100 text-orange-800 border-orange-200'
                                >
                                  <AlertTriangle className='h-3 w-3 mr-1' />
                                  Not enough space
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <CardDescription className='text-sm mb-3'>
                          {typeInfo.description}
                        </CardDescription>
                        <div className='space-y-2'>
                          <div className='text-xs font-medium text-muted-foreground'>
                            Learning Outcomes:
                          </div>
                          <div className='space-y-1'>
                            {experience.learning_outcomes
                              .slice(0, 3)
                              .map((outcome, index) => (
                                <div
                                  key={index}
                                  className='text-xs text-muted-foreground line-clamp-1'
                                >
                                  • {outcome}
                                </div>
                              ))}
                            {experience.learning_outcomes.length > 3 && (
                              <div className='text-xs text-muted-foreground'>
                                +{experience.learning_outcomes.length - 3}{' '}
                                more...
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
