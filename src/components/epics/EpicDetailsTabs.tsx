import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, BookOpen, Package, AlertCircle } from 'lucide-react';
import { ExperiencesService } from '@/services/experiences.service';
import type { Epic } from '@/types/epic';
import type { Experience, LectureModule, Deliverable } from '@/types/experience';
import { LearningOutcomesTab } from './tabs/LearningOutcomesTab';
import { LecturesTab } from './tabs/LecturesTab';
import { DeliverablesTab } from './tabs/DeliverablesTab';

interface EpicDetailsTabsProps {
  epic: Epic;
}

interface GroupedContent {
  [challengeTitle: string]: {
    lectures: LectureModule[];
    deliverables: Deliverable[];
  };
}

export const EpicDetailsTabs: React.FC<EpicDetailsTabsProps> = ({ epic }) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedContent, setGroupedContent] = useState<GroupedContent>({});

  useEffect(() => {
    loadExperiences();
  }, [epic.id]);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await ExperiencesService.getExperiences({ epicId: epic.id });
      setExperiences(data);
      
      // Group lectures and deliverables by challenge
      const grouped: GroupedContent = {};
      data.forEach(experience => {
        const challengeTitle = experience.title;
        grouped[challengeTitle] = {
          lectures: experience.lecture_sessions || [],
          deliverables: experience.deliverables || []
        };
      });
      setGroupedContent(grouped);
    } catch (err) {
      console.error('Error loading experiences:', err);
      setError('Failed to load epic content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="outcomes" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="outcomes" className="flex items-center space-x-2">
          <Target className="h-4 w-4" />
          <span>Learning Outcomes</span>
        </TabsTrigger>
        <TabsTrigger value="lectures" className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4" />
          <span>Lectures</span>
        </TabsTrigger>
        <TabsTrigger value="deliverables" className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <span>Deliverables</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="outcomes" className="mt-6">
        <LearningOutcomesTab outcomes={epic.outcomes || []} />
      </TabsContent>

      <TabsContent value="lectures" className="mt-6">
        <LecturesTab groupedContent={groupedContent} />
      </TabsContent>

      <TabsContent value="deliverables" className="mt-6">
        <DeliverablesTab groupedContent={groupedContent} />
      </TabsContent>
    </Tabs>
  );
};
