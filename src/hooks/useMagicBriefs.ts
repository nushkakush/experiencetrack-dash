import { useState, useEffect } from 'react';
import { useActiveEpic } from '@/contexts/ActiveEpicContext';
import { MagicBriefsService } from '@/services/magicBriefs.service';
import { MagicBriefGenerator } from '@/services/openai/magicBriefGenerator';
import { EpicsService } from '@/services/epics.service';
import { ExperiencesService } from '@/services/experiences.service';
import type { 
  MagicBrief, 
  MagicBriefState, 
  EpicContext 
} from '@/types/magicBrief';

/**
 * Hook for managing magic brief data and operations
 * Handles fetching, caching, and state management
 */
export const useMagicBriefs = () => {
  const { activeEpicId } = useActiveEpic();
  const [state, setState] = useState<MagicBriefState>({
    isGenerating: false,
    isExpanding: false,
    error: null,
    generatedBriefs: [],
    savedBriefs: [],
  });

  // Load magic briefs when epic changes
  useEffect(() => {
    if (activeEpicId) {
      loadMagicBriefs();
    } else {
      setState(prev => ({ ...prev, savedBriefs: [] }));
    }
  }, [activeEpicId]);

  const loadMagicBriefs = async () => {
    if (!activeEpicId) return;

    try {
      const briefs = await MagicBriefsService.getMagicBriefs(activeEpicId);
      setState(prev => ({ 
        ...prev, 
        savedBriefs: briefs,
        error: null 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        savedBriefs: []
      }));
    }
  };

  const deleteMagicBrief = async (briefId: string) => {
    try {
      await MagicBriefsService.deleteMagicBrief(briefId);
      setState(prev => ({
        ...prev,
        savedBriefs: prev.savedBriefs.filter(brief => brief.id !== briefId),
        error: null
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message 
      }));
      throw error;
    }
  };

  return {
    ...state,
    activeEpicId,
    loadMagicBriefs,
    deleteMagicBrief,
  };
};

/**
 * Hook for magic brief generation
 * Separated for focused responsibility
 */
export const useMagicBriefGeneration = () => {
  const { activeEpicId } = useActiveEpic();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMagicBriefs = async (brandNames?: string[], challengeCount?: number) => {
    if (!activeEpicId) {
      throw new Error('No active epic selected');
    }

    setIsGenerating(true);
    
    try {
      // Get epic context
      const epic = await EpicsService.getEpic(activeEpicId);
      
      // Generate briefs using AI
      const generatedBriefs = await MagicBriefGenerator.generateMagicBriefs({
        epic_id: activeEpicId,
        epic_name: epic.name,
        epic_description: epic.description,
        epic_outcomes: epic.outcomes || [],
        brand_names: brandNames,
        challenge_count: challengeCount,
      });

      // Save to database
      const briefsToSave = generatedBriefs.map(brief => ({
        title: brief.title,
        brand_name: brief.brand_name,
        challenge_statement: brief.challenge_statement,
        connected_learning_outcomes: brief.connected_learning_outcomes,
        skill_focus: brief.skill_focus,
        challenge_order: brief.challenge_order,
        prerequisite_skills: brief.prerequisite_skills,
        skill_compounding: brief.skill_compounding,
        epic_id: activeEpicId,
        created_at: new Date().toISOString(),
      }));

      await MagicBriefsService.createMagicBriefs(briefsToSave);
      
      return generatedBriefs;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateMagicBriefs,
    isGenerating,
  };
};

/**
 * Hook for magic brief expansion
 * Handles the complex expansion logic
 */
export const useMagicBriefExpansion = () => {
  const [isExpanding, setIsExpanding] = useState(false);

  const expandMagicBrief = async (brief: MagicBrief) => {
    setIsExpanding(true);
    
    try {
      // Get epic context
      const epic = await EpicsService.getEpic(brief.epic_id);
      
      // Expand brief using AI
      const expandedExperience = await MagicBriefGenerator.expandMagicBrief({
        brief_id: brief.id,
        brief_title: brief.title,
        brand_name: brief.brand_name,
        challenge_statement: brief.challenge_statement,
        epic_id: brief.epic_id,
        epic_name: epic.name,
        epic_description: epic.description,
        epic_outcomes: epic.outcomes || [],
      });

      // Save the experience
      const savedExperience = await ExperiencesService.upsertExperience(expandedExperience);

      // Mark brief as expanded (still track for reference but allow re-expansion)
      await MagicBriefsService.markBriefAsExpanded(brief.id, savedExperience.id);

      return savedExperience;
    } finally {
      setIsExpanding(false);
    }
  };

  return {
    expandMagicBrief,
    isExpanding,
  };
};
