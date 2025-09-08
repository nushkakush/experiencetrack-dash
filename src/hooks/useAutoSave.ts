import { useCallback, useEffect, useRef } from 'react';
import { ProfileExtendedService } from '@/services/profileExtended.service';
import { ProfileExtendedUpdate } from '@/types/profileExtended';
import { toast } from 'sonner';

interface UseAutoSaveProps {
  profileId: string;
  debounceMs?: number;
  showToast?: boolean;
}

export const useAutoSave = ({
  profileId,
  debounceMs = 1000,
  showToast = false,
}: UseAutoSaveProps) => {
  const service = ProfileExtendedService.getInstance();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const saveData = useCallback(
    async (updates: Partial<ProfileExtendedUpdate>, immediate = false) => {
      try {
        await service.updateProfileExtended(profileId, updates, immediate);

        if (showToast && immediate) {
          toast.success('Changes saved');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        if (showToast) {
          toast.error('Failed to save changes');
        }
      }
    },
    [profileId, service, showToast]
  );

  const handleFieldChange = useCallback(
    (field: keyof ProfileExtendedUpdate, value: any) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        saveData({ [field]: value });
      }, debounceMs);
    },
    [saveData, debounceMs]
  );

  const handleFieldBlur = useCallback(
    (field: keyof ProfileExtendedUpdate, value: any) => {
      // Clear timeout and save immediately on blur
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveData({ [field]: value }, true);
    },
    [saveData]
  );

  const forceSave = useCallback(async () => {
    await service.forceSave(profileId);
  }, [profileId, service]);

  const hasUnsavedChanges = useCallback(() => {
    return service.hasUnsavedChanges();
  }, [service]);

  const getPendingChangesCount = useCallback(() => {
    return service.getPendingChangesCount();
  }, [service]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleFieldChange,
    handleFieldBlur,
    forceSave,
    hasUnsavedChanges,
    getPendingChangesCount,
    isSaving: isSavingRef.current,
  };
};
