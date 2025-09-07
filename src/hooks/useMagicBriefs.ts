import { useState, useEffect } from 'react';
import { useActiveEpic } from '@/contexts/ActiveEpicContext';
import { MagicBriefsService } from '@/services/magicBriefs.service';
import { MagicBriefGenerator } from '@/services/openai/magicBriefGenerator';
import { EpicsService } from '@/services/epics.service';
import { ExperiencesService } from '@/services/experiences.service';
import type {
  MagicBrief,
  MagicBriefState,
  EpicContext,
} from '@/types/magicBrief';
import type { Epic } from '@/types/epic';

/**
 * Validates if an epic is complete enough for magic brief generation
 * @param epic The epic to validate
 * @returns Object with validation result and error message
 */
const validateEpicForMagicBriefs = (
  epic: Epic
): { isValid: boolean; error?: string } => {
  if (!epic.description || epic.description.trim().length === 0) {
    return {
      isValid: false,
      error:
        'Epic description is required for magic brief generation. Please add a description to this epic first.',
    };
  }

  if (!epic.outcomes || epic.outcomes.length === 0) {
    return {
      isValid: false,
      error:
        'Epic learning outcomes are required for magic brief generation. Please add learning outcomes to this epic first.',
    };
  }

  // Check if outcomes are meaningful (not just empty strings)
  const meaningfulOutcomes = epic.outcomes.filter(
    outcome => outcome && outcome.trim().length > 0
  );

  if (meaningfulOutcomes.length === 0) {
    return {
      isValid: false,
      error:
        'Epic must have at least one meaningful learning outcome for magic brief generation.',
    };
  }

  return { isValid: true };
};

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
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        savedBriefs: [],
      }));
    }
  };

  const deleteMagicBrief = async (briefId: string) => {
    try {
      await MagicBriefsService.deleteMagicBrief(briefId);
      setState(prev => ({
        ...prev,
        savedBriefs: prev.savedBriefs.filter(brief => brief.id !== briefId),
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
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

  const generateMagicBriefs = async (
    numberOfBriefs: number = 7,
    progressCallback?: (progress: {current: number, total: number}) => void
  ) => {
    if (!activeEpicId) {
      throw new Error('No active epic selected');
    }

    setIsGenerating(true);

    try {
      // Get epic context
      const epic = await EpicsService.getEpic(activeEpicId);

      // Validate epic completeness
      const validation = validateEpicForMagicBriefs(epic);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate exactly the requested number of briefs with guaranteed 100% coverage
      const result = await MagicBriefGenerator.generateExactNumberWithFullCoverage({
        epic_id: activeEpicId,
        epic_name: epic.name,
        epic_description: epic.description,
        epic_outcomes: epic.outcomes || [],
        total_briefs: numberOfBriefs,
      }, progressCallback);

      const allGeneratedBriefs = result.briefs;
      const totalBriefs = allGeneratedBriefs.length;
      const coverage = result.coverage;

      // Save all briefs to database
      const briefsToSave = allGeneratedBriefs.map(brief => ({
        title: brief.title,
        brand_name: brief.brand_name,
        challenge_statement: brief.challenge_statement,
        connected_learning_outcomes: brief.connected_learning_outcomes,
        skill_focus: brief.skill_focus,
        challenge_order: brief.challenge_order,
        prerequisite_skills: brief.prerequisite_skills,
        skill_compounding: brief.skill_compounding,
        citations: brief.citations, // Include Perplexity citations
        raw_response: brief.rawResponse, // Include raw response for debugging
        epic_id: activeEpicId,
        created_at: new Date().toISOString(),
      }));

      await MagicBriefsService.createMagicBriefs(briefsToSave);

      return allGeneratedBriefs;
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

      // Validate epic completeness
      const validation = validateEpicForMagicBriefs(epic);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

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
      const savedExperience =
        await ExperiencesService.upsertExperience(expandedExperience);

      // Mark brief as expanded (still track for reference but allow re-expansion)
      await MagicBriefsService.markBriefAsExpanded(
        brief.id,
        savedExperience.id
      );

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

/**
 * Hook to check if the current epic is valid for magic brief generation
 * Provides real-time validation status for UI components
 */
export const useEpicValidation = () => {
  const { activeEpicId } = useActiveEpic();
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    error?: string;
    isLoading: boolean;
  }>({
    isValid: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkEpicValidation = async () => {
      if (!activeEpicId) {
        setValidationStatus({
          isValid: false,
          error: 'No active epic selected',
          isLoading: false,
        });
        return;
      }

      try {
        const epic = await EpicsService.getEpic(activeEpicId);
        const validation = validateEpicForMagicBriefs(epic);

        setValidationStatus({
          isValid: validation.isValid,
          error: validation.error,
          isLoading: false,
        });
      } catch (error) {
        setValidationStatus({
          isValid: false,
          error: 'Failed to load epic details',
          isLoading: false,
        });
      }
    };

    checkEpicValidation();
  }, [activeEpicId]);

  return validationStatus;
};

/**
 * Hook for magic brief regeneration
 * Handles regenerating individual magic briefs with existing metadata
 */
export const useMagicBriefRegeneration = () => {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateMagicBrief = async (brief: MagicBrief) => {
    setIsRegenerating(true);

    try {
      // Get epic context for regeneration
      const epic = await EpicsService.getEpic(brief.epic_id);

      // Validate epic completeness
      const validation = validateEpicForMagicBriefs(epic);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Regenerate the brief using AI
      const regeneratedBrief = await MagicBriefGenerator.regenerateMagicBrief(brief, {
        epic_name: epic.name,
        epic_description: epic.description,
        epic_outcomes: epic.outcomes || [],
      });

      // Update the brief in the database
      const updatedBrief = await MagicBriefsService.updateMagicBrief(brief.id, {
        title: regeneratedBrief.title,
        challenge_statement: regeneratedBrief.challenge_statement,
        citations: regeneratedBrief.citations,
        rawResponse: regeneratedBrief.rawResponse,
      });

      return updatedBrief;
    } finally {
      setIsRegenerating(false);
    }
  };

  return {
    regenerateMagicBrief,
    isRegenerating,
  };
};

/**
 * Hook for targeted magic brief generation
 * Handles generating magic briefs for specific learning outcomes
 */
export const useTargetedMagicBriefGeneration = () => {
  const { activeEpicId } = useActiveEpic();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTargetedMagicBrief = async (targetOutcome: string, existingBriefs: MagicBrief[] = []) => {
    console.log('🚀 generateTargetedMagicBrief called with:', { targetOutcome, existingBriefsCount: existingBriefs.length });
    
    if (!activeEpicId) {
      throw new Error('No active epic selected');
    }

    setIsGenerating(true);

    try {
      // Get epic context
      const epic = await EpicsService.getEpic(activeEpicId);

      // Validate epic completeness
      const validation = validateEpicForMagicBriefs(epic);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Generate targeted brief using AI
      const targetedBrief = await MagicBriefGenerator.generateTargetedMagicBrief(
        targetOutcome,
        {
          epic_id: activeEpicId,
          epic_name: epic.name,
          epic_description: epic.description,
          epic_outcomes: epic.outcomes || [],
        },
        existingBriefs
      );

      // Save the brief to database
      const briefToSave = {
        title: targetedBrief.title,
        brand_name: targetedBrief.brand_name,
        challenge_statement: targetedBrief.challenge_statement,
        connected_learning_outcomes: targetedBrief.connected_learning_outcomes,
        skill_focus: targetedBrief.skill_focus,
        challenge_order: targetedBrief.challenge_order,
        prerequisite_skills: targetedBrief.prerequisite_skills,
        skill_compounding: targetedBrief.skill_compounding,
        citations: targetedBrief.citations,
        raw_response: targetedBrief.rawResponse,
        epic_id: activeEpicId,
        created_at: new Date().toISOString(),
      };

      const [savedBrief] = await MagicBriefsService.createMagicBriefs([briefToSave]);
      console.log('💾 Targeted brief saved:', { 
        id: savedBrief.id, 
        title: savedBrief.title, 
        connectedOutcomes: savedBrief.connected_learning_outcomes 
      });
      return savedBrief;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTargetedMagicBrief,
    isGenerating,
  };
};
